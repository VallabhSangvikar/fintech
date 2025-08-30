import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOrganization } from '@/lib/middleware';
import { mysqlPool } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';
import { APIResponse } from '@/types/database';
import path from 'path';
import fs from 'fs/promises';

interface KnowledgeBaseDocument {
  id: string;
  fileName: string;
  documentCategory: 'LOAN_COMPLIANCE' | 'ESG_POLICY' | 'REGULATORY_STANDARD';
  filePath: string;
  fileSize: number;
  uploadedAt: string;
}

interface KnowledgeBaseUploadResponse {
  documents: KnowledgeBaseDocument[];
  message: string;
}

// Ensure upload directory exists
async function ensureUploadDirectory() {
  const uploadDir = path.join(process.cwd(), 'uploads', 'knowledge-base');
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
  return uploadDir;
}

// Helper function to get file extension and validate
function validateFileType(fileName: string): boolean {
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.md'];
  const ext = path.extname(fileName).toLowerCase();
  return allowedExtensions.includes(ext);
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;

    // Check if user has organization access
    const orgCheckResult = requireOrganization(user);
    if (orgCheckResult) {
      return orgCheckResult;
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only admins can upload knowledge base documents' } as APIResponse<null>,
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const category = formData.get('category') as string;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files uploaded' } as APIResponse<null>,
        { status: 400 }
      );
    }

    if (!category || !['LOAN_COMPLIANCE', 'ESG_POLICY', 'REGULATORY_STANDARD'].includes(category)) {
      return NextResponse.json(
        { success: false, error: 'Valid document category is required' } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    const uploadDir = await ensureUploadDirectory();
    
    const uploadedDocuments: KnowledgeBaseDocument[] = [];
    const connection = await mysqlPool.getConnection();

    try {
      await connection.beginTransaction();

      for (const file of files) {
        // Validate file type
        if (!validateFileType(file.name)) {
          throw new Error(`Invalid file type for ${file.name}. Only PDF, DOC, DOCX, TXT, and MD files are allowed.`);
        }

        // Generate unique file name
        const fileId = uuidv4();
        const fileExtension = path.extname(file.name);
        const uniqueFileName = `${fileId}${fileExtension}`;
        const filePath = path.join(uploadDir, uniqueFileName);

        // Save file to disk
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await fs.writeFile(filePath, buffer);

        // Save to database
        const documentId = uuidv4();
        await connection.execute(
          `INSERT INTO knowledge_base_documents 
           (id, organization_id, uploaded_by_id, file_name, storage_url, document_category, is_active, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, true, NOW())`,
          [
            documentId,
            user.organizationId,
            user.userId,
            file.name,
            `/uploads/knowledge-base/${uniqueFileName}`,
            category
          ]
        );

        uploadedDocuments.push({
          id: documentId,
          fileName: file.name,
          documentCategory: category as any,
          filePath: `/uploads/knowledge-base/${uniqueFileName}`,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
        });
      }

      await connection.commit();

      const response: KnowledgeBaseUploadResponse = {
        documents: uploadedDocuments,
        message: `${uploadedDocuments.length} document(s) uploaded successfully`,
      };

      return NextResponse.json(
        { success: true, data: response } as APIResponse<KnowledgeBaseUploadResponse>,
        { status: 201 }
      );

    } catch (error) {
      await connection.rollback();
      
      // Clean up uploaded files on error
      for (const doc of uploadedDocuments) {
        try {
          await fs.unlink(path.join(process.cwd(), doc.filePath));
        } catch (cleanupError) {
          console.error('File cleanup error:', cleanupError);
        }
      }
      
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Knowledge base upload error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to upload documents' } as APIResponse<null>,
      { status: 500 }
    );
  }
}

// GET - Retrieve knowledge base documents
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;

    // Check if user has organization access
    const orgCheckResult = requireOrganization(user);
    if (orgCheckResult) {
      return orgCheckResult;
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isActive = searchParams.get('active') !== 'false'; // Default to true

    let query = `
      SELECT 
        id, 
        file_name, 
        storage_url, 
        document_category, 
        is_active, 
        created_at,
        uploaded_by_id
      FROM knowledge_base_documents 
      WHERE organization_id = ? AND is_active = ?
    `;
    
    const params: any[] = [user.organizationId, isActive];

    if (category) {
      query += ' AND document_category = ?';
      params.push(category);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await mysqlPool.execute(query, params) as any;

    return NextResponse.json(
      { success: true, data: rows } as APIResponse<typeof rows>,
      { status: 200 }
    );

  } catch (error) {
    console.error('Get knowledge base documents error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve documents' } as APIResponse<null>,
      { status: 500 }
    );
  }
}

// DELETE - Remove a knowledge base document
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;

    // Check if user has organization access and admin role
    const orgCheckResult = requireOrganization(user);
    if (orgCheckResult) {
      return orgCheckResult;
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only admins can delete knowledge base documents' } as APIResponse<null>,
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Get document info first
    const [documentRows] = await mysqlPool.execute(
      'SELECT storage_url FROM knowledge_base_documents WHERE id = ? AND organization_id = ?',
      [documentId, user.organizationId]
    ) as any;

    if (documentRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Document not found' } as APIResponse<null>,
        { status: 404 }
      );
    }

    const document = documentRows[0];

    // Soft delete in database
    await mysqlPool.execute(
      'UPDATE knowledge_base_documents SET is_active = false WHERE id = ?',
      [documentId]
    );

    // Optionally delete physical file
    try {
      const filePath = path.join(process.cwd(), document.storage_url);
      await fs.unlink(filePath);
    } catch (fileError) {
      console.error('File deletion error:', fileError);
      // Continue even if file deletion fails
    }

    return NextResponse.json(
      { success: true, message: 'Document deleted successfully' } as APIResponse<null>,
      { status: 200 }
    );

  } catch (error) {
    console.error('Delete knowledge base document error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete document' } as APIResponse<null>,
      { status: 500 }
    );
  }
}
