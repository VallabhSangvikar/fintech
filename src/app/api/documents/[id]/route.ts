import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOrganization } from '@/lib/middleware';
import { mysqlPool } from '@/lib/database';
import { APIResponse } from '@/types/database';
import path from 'path';
import fs from 'fs/promises';
import { console } from 'inspector';

interface DocumentDetails {
  id: string;
  fileName: string;
  documentType: string;
  status: string;
  uploadedAt: string;
  uploadedBy: string;
  storageUrl: string;
}

// GET - Get individual document details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }
    const { user } = authResult;
    const x = await params;
    const documentId =x.id;

    // Check if user has organization access
    const orgCheckResult = requireOrganization(user);
    if (orgCheckResult) {
      return orgCheckResult;
    }

    const [rows] = await mysqlPool.execute(`
      SELECT 
        d.id,
        d.file_name,
        d.storage_url,
        d.document_type,
        d.status,
        d.uploaded_at,
        u.full_name as uploaded_by
      FROM documents d
      JOIN users u ON d.uploaded_by_id = u.id
      WHERE d.id = ? AND d.organization_id = ?
    `, [documentId, user.organizationId]) as any;

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Document not found' } as APIResponse<null>,
        { status: 404 }
      );
    }

    const document = rows[0];
    const response: DocumentDetails = {
      id: document.id,
      fileName: document.file_name,
      documentType: document.document_type,
      status: document.status,
      uploadedAt: document.uploaded_at,
      uploadedBy: document.uploaded_by,
      storageUrl: document.storage_url,
    };

    return NextResponse.json(
      { success: true, data: response } as APIResponse<DocumentDetails>,
      { status: 200 }
    );

  } catch (error) {
    console.error('Get document details error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve document details' } as APIResponse<null>,
      { status: 500 }
    );
  }
}

// DELETE - Delete a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }
    const x = await params;
    const { user } = authResult;
    const documentId = x.id;

    // Check if user has organization access
    const orgCheckResult = requireOrganization(user);
    if (orgCheckResult) {
      return orgCheckResult;
    }

    // Check if user has permission to delete (admin or document owner)
    const [documentRows] = await mysqlPool.execute(`
      SELECT storage_url, uploaded_by_id 
      FROM documents 
      WHERE id = ? AND organization_id = ?
    `, [documentId, user.organizationId]) as any;

    if (documentRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Document not found' } as APIResponse<null>,
        { status: 404 }
      );
    }

    const document = documentRows[0];

    // Check permissions: admin or document owner can delete
    if (user.role !== 'ADMIN' && document.uploaded_by_id !== user.userId) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to delete this document' } as APIResponse<null>,
        { status: 403 }
      );
    }

    // Delete from database
    await mysqlPool.execute(
      'DELETE FROM documents WHERE id = ?',
      [documentId]
    );

    // Delete physical file
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
    console.error('Delete document error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete document' } as APIResponse<null>,
      { status: 500 }
    );
  }
}

// PUT - Update document status or metadata
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }
    const x = await params;
    const { user } = authResult;
    const documentId = x.id;
    const body = await request.json();
    const { status } = body;

    // Check if user has organization access
    const orgCheckResult = requireOrganization(user);
    if (orgCheckResult) {
      return orgCheckResult;
    }

    // Validate status if provided
    if (status && !['PENDING', 'ANALYZED', 'ERROR'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status value' } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Check if document exists and user has access
    const [documentRows] = await mysqlPool.execute(
      'SELECT id FROM documents WHERE id = ? AND organization_id = ?',
      [documentId, user.organizationId]
    ) as any;

    if (documentRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Document not found' } as APIResponse<null>,
        { status: 404 }
      );
    }

    // Update document
    if (status) {
      await mysqlPool.execute(
        'UPDATE documents SET status = ? WHERE id = ?',
        [status, documentId]
      );
      console.log('Document status updated:', documentId);
    }

    return NextResponse.json(
      { success: true, message: 'Document updated successfully' } as APIResponse<null>,
      { status: 200 }
    );

  } catch (error) {
    console.error('Update document error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update document' } as APIResponse<null>,
      { status: 500 }
    );
  }
}
