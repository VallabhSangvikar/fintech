import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOrganization } from '@/lib/middleware';
import { mysqlPool } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';
import { APIResponse } from '@/types/database';
import path from 'path';
import fs from 'fs/promises';

interface DocumentUploadResponse {
  id: string;
  fileName: string;
  documentType: 'INVESTMENT_PLAN' | 'LOAN_APPLICATION' | 'FINANCIAL_REPORT';
  storageUrl: string;
  status: 'PENDING' | 'ANALYZED' | 'ERROR';
  uploadedAt: string;
}

interface DocumentListResponse {
  id: string;
  fileName: string;
  documentType: string;
  status: string;
  uploadedAt: string;
  uploadedBy: string;
}

// Ensure upload directory exists
async function ensureUploadDirectory() {
  const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
  return uploadDir;
}

// Helper function to validate file type for documents
function validateDocumentType(fileName: string): boolean {
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.xlsx', '.xls', '.txt', '.csv'];
  const ext = path.extname(fileName).toLowerCase();
  return allowedExtensions.includes(ext);
}

// POST - Upload new documents
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

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const documentType = formData.get('documentType') as string;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files uploaded' } as APIResponse<null>,
        { status: 400 }
      );
    }

    if (!documentType || !['INVESTMENT_PLAN', 'LOAN_APPLICATION', 'FINANCIAL_REPORT'].includes(documentType)) {
      return NextResponse.json(
        { success: false, error: 'Valid document type is required' } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    const uploadDir = await ensureUploadDirectory();
    
    const uploadedDocuments: DocumentUploadResponse[] = [];
    const connection = await mysqlPool.getConnection();

    try {
      await connection.beginTransaction();

      for (const file of files) {
        // Validate file type
        if (!validateDocumentType(file.name)) {
          throw new Error(`Invalid file type for ${file.name}. Only PDF, DOC, DOCX, XLSX, XLS, TXT, and CSV files are allowed.`);
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
          `INSERT INTO documents 
           (id, organization_id, uploaded_by_id, file_name, storage_url, document_type, status, uploaded_at) 
           VALUES (?, ?, ?, ?, ?, ?, 'PENDING', NOW())`,
          [
            documentId,
            user.organizationId,
            user.userId,
            file.name,
            `/uploads/documents/${uniqueFileName}`,
            documentType
          ]
        );

        uploadedDocuments.push({
          id: documentId,
          fileName: file.name,
          documentType: documentType as any,
          storageUrl: `/uploads/documents/${uniqueFileName}`,
          status: 'PENDING',
          uploadedAt: new Date().toISOString(),
        });
      }

      await connection.commit();

      const response = {
        documents: uploadedDocuments,
        message: `${uploadedDocuments.length} document(s) uploaded successfully`,
      };

      return NextResponse.json(
        { success: true, data: response } as APIResponse<typeof response>,
        { status: 201 }
      );

    } catch (error) {
      await connection.rollback();
      
      // Clean up uploaded files on error
      for (const doc of uploadedDocuments) {
        try {
          await fs.unlink(path.join(process.cwd(), doc.storageUrl));
        } catch (cleanupError) {
          console.error('File cleanup error:', cleanupError);
        }
      }
      
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to upload documents' } as APIResponse<null>,
      { status: 500 }
    );
  }
}

// GET - Retrieve documents list
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
    const documentType = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '50')) || 50;
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0')) || 0;

    let query = `
      SELECT 
        d.id,
        d.file_name,
        d.document_type,
        d.status,
        d.uploaded_at,
        u.full_name as uploaded_by
      FROM documents d
      JOIN users u ON d.uploaded_by_id = u.id
      WHERE d.organization_id = ?
    `;
    
    const params: any[] = [user.organizationId];

    if (documentType) {
      query += ' AND d.document_type = ?';
      params.push(documentType);
    }

    if (status) {
      query += ' AND d.status = ?';
      params.push(status);
    }

    query += ` ORDER BY d.uploaded_at DESC LIMIT ? OFFSET ?`;
    params.push(limit.toString(), offset.toString());

    const [rows] = await mysqlPool.execute(query, params) as any;

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM documents WHERE organization_id = ?';
    const countParams = [user.organizationId];

    if (documentType) {
      countQuery += ' AND document_type = ?';
      countParams.push(documentType);
    }

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    const [countRows] = await mysqlPool.execute(countQuery, countParams) as any;
    const total = countRows[0].total;

    const response = {
      documents: rows.map((row: any) => ({
        id: row.id,
        fileName: row.file_name,
        documentType: row.document_type,
        status: row.status,
        uploadedAt: row.uploaded_at,
        uploadedBy: row.uploaded_by,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };

    return NextResponse.json(
      { success: true, data: response } as APIResponse<typeof response>,
      { status: 200 }
    );

  } catch (error) {
    console.error('Get documents error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve documents' } as APIResponse<null>,
      { status: 500 }
    );
  }
}
