import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { mysqlPool } from '@/lib/database';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { user } = authResult;
    const filePath = params.path.join('/');
    
    // Determine file type and check permissions
    if (filePath.startsWith('knowledge-base/')) {
      // Check if user has access to this organization's knowledge base
      if (!user.organizationId) {
        return new NextResponse('Forbidden', { status: 403 });
      }
      
      const fileName = path.basename(filePath);
      const [rows] = await mysqlPool.execute(
        'SELECT storage_url FROM knowledge_base_documents WHERE storage_url LIKE ? AND organization_id = ? AND is_active = true',
        [`%${fileName}`, user.organizationId]
      ) as any;
      
      if (rows.length === 0) {
        return new NextResponse('File not found', { status: 404 });
      }
    }
    
    // Construct full file path
    const fullFilePath = path.join(process.cwd(), 'uploads', filePath);
    
    // Check if file exists
    try {
      await fs.access(fullFilePath);
    } catch {
      return new NextResponse('File not found', { status: 404 });
    }
    
    // Read and serve file
    const fileBuffer = await fs.readFile(fullFilePath);
    const stat = await fs.stat(fullFilePath);
    
    // Determine MIME type
    const ext = path.extname(fullFilePath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
      '.md': 'text/markdown',
    };
    
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    
    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': stat.size.toString(),
        'Cache-Control': 'private, no-cache',
      },
    });

  } catch (error) {
    console.error('File serving error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
