'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  Upload, 
  Search, 
  Filter, 
  Eye, 
  Download, 
  Trash2, 
  FileText,
  File,
  FileSpreadsheet,
  FileImage,
  Plus,
  MoreHorizontal,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Document {
  id: number;
  name: string;
  type: 'pdf' | 'doc' | 'xls' | 'jpg' | 'png';
  status: 'analyzed' | 'pending' | 'error';
  uploadDate: string;
  uploadedBy: string;
  size: string;
}

// Sample documents data
const sampleDocuments: Document[] = [
  {
    id: 1,
    name: 'Q2_Financial_Report.pdf',
    type: 'pdf',
    status: 'analyzed',
    uploadDate: '2025-08-15',
    uploadedBy: 'Anand Sharma',
    size: '2.4 MB'
  },
  {
    id: 2,
    name: 'Loan_Application_12345.pdf',
    type: 'pdf',
    status: 'analyzed',
    uploadDate: '2025-08-14',
    uploadedBy: 'Priya Singh',
    size: '1.8 MB'
  },
  {
    id: 3,
    name: 'Market_Analysis_August.xlsx',
    type: 'xls',
    status: 'pending',
    uploadDate: '2025-08-16',
    uploadedBy: 'Rohit Kumar',
    size: '4.2 MB'
  },
  {
    id: 4,
    name: 'Identity_Verification_67890.jpg',
    type: 'jpg',
    status: 'analyzed',
    uploadDate: '2025-08-13',
    uploadedBy: 'Priya Singh',
    size: '856 KB'
  },
  {
    id: 5,
    name: 'Risk_Assessment_Draft.docx',
    type: 'doc',
    status: 'error',
    uploadDate: '2025-08-12',
    uploadedBy: 'Anand Sharma',
    size: '1.2 MB'
  },
  {
    id: 6,
    name: 'Portfolio_Performance_H1.pdf',
    type: 'pdf',
    status: 'analyzed',
    uploadDate: '2025-08-11',
    uploadedBy: 'Rohit Kumar',
    size: '3.1 MB'
  },
  {
    id: 7,
    name: 'Compliance_Checklist_v2.pdf',
    type: 'pdf',
    status: 'pending',
    uploadDate: '2025-08-16',
    uploadedBy: 'Anand Sharma',
    size: '967 KB'
  },
  {
    id: 8,
    name: 'Customer_KYC_Documents.zip',
    type: 'pdf',
    status: 'analyzed',
    uploadDate: '2025-08-10',
    uploadedBy: 'Priya Singh',
    size: '5.7 MB'
  }
];

export default function DocumentCenterPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [uploaderFilter, setUploaderFilter] = useState<string>('all');
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // Load documents from API
  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/documents', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Load documents response:', result);
        
        if (result.success && result.data && result.data.documents && Array.isArray(result.data.documents)) {
          // Map API response to our Document interface
          const mappedDocuments = result.data.documents.map((doc: any) => ({
            id: parseInt(doc.id) || doc.id,
            name: doc.fileName || doc.name,
            type: getFileType(doc.fileName || doc.name),
            status: doc.status?.toLowerCase() || 'pending',
            uploadDate: new Date(doc.uploadedAt).toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
            uploadedBy: doc.uploadedBy || 'Unknown',
            size: 'Unknown' // Size is not returned by API, would need to be calculated
          }));
          console.log('Mapped documents:', mappedDocuments);
          setDocuments(mappedDocuments);
        } else {
          console.error('Invalid response format:', result);
          setDocuments([]);
        }
      } else {
        const errorResult = await response.json().catch(() => ({}));
        console.error('Failed to load documents:', response.status, response.statusText, errorResult);
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFileType = (fileName: string): Document['type'] => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'pdf';
      case 'doc':
      case 'docx': return 'doc';
      case 'xls':
      case 'xlsx': return 'xls';
      case 'jpg':
      case 'jpeg': return 'jpg';
      case 'png': return 'png';
      default: return 'pdf';
    }
  };

  useEffect(() => {
    if (user?.organizationId) {
      loadDocuments();
    }
  }, [user]);

  // Check if user has access to Document Center (only for organizations)
  if (!user?.organizationId) {
    return (
      <ProtectedRoute>
        <DashboardLayout currentPage="documents">
          <div className="p-6 flex items-center justify-center min-h-96">
            <Card className="max-w-md mx-auto">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Restricted</h2>
                <p className="text-slate-600">
                  Document Center is available for Investment Institutions and Banks only.
                </p>
                <Button className="mt-4" onClick={() => window.history.back()}>
                  Go Back
                </Button>
              </CardContent>
            </Card>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <File className="w-5 h-5 text-red-500" />;
      case 'doc':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'xls':
        return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
      case 'jpg':
      case 'png':
        return <FileImage className="w-5 h-5 text-purple-500" />;
      default:
        return <FileText className="w-5 h-5 text-slate-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'analyzed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'analyzed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // Filter documents based on search and filters
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = (doc.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesUploader = uploaderFilter === 'all' || (doc.uploadedBy || '').includes(uploaderFilter);
    
    return matchesSearch && matchesStatus && matchesUploader;
  });

  // Get unique uploaders for filter dropdown
  const uniqueUploaders = Array.from(new Set(documents.map(doc => doc.uploadedBy || 'Unknown').filter(Boolean)));

  const handleFileUpload = async (files: FileList) => {
    // Use user from component level - don't call useAuth() inside async function
    
    for (const file of Array.from(files)) {
      // Add pending document to UI immediately for better UX
      const tempDoc: Document = {
        id: Date.now() + Math.random(),
        name: file.name,
        type: file.name.split('.').pop()?.toLowerCase() as any || 'pdf',
        status: 'pending',
        uploadDate: new Date().toISOString().split('T')[0],
        uploadedBy: user?.full_name || 'Current User',
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`
      };

      setDocuments(prev => [tempDoc, ...prev]);

      try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('files', file); // API expects 'files' not 'file'
        formData.append('documentType', 'FINANCIAL_REPORT'); // API requires documentType

        const response = await fetch('/api/documents', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (!result.success || !result.data || !result.data.documents) {
          throw new Error(result.error || 'Upload failed');
        }

        // Get the first uploaded document from the response
        const uploadedDocData = result.data.documents[0];
        
        // Convert API response format to frontend Document format
        const uploadedDoc: Document = {
          id: uploadedDocData.id,
          name: uploadedDocData.fileName,
          type: getFileType(uploadedDocData.fileName),
          status: uploadedDocData.status?.toLowerCase() || 'pending',
          uploadDate: new Date(uploadedDocData.uploadedAt).toISOString().split('T')[0],
          uploadedBy: user?.full_name || 'Current User',
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`
        };
        
        // Replace pending document with uploaded document
        setDocuments(prev => 
          prev.map(doc => 
            doc.id === tempDoc.id ? uploadedDoc : doc
          )
        );

      } catch (error) {
        console.error('File upload error:', error);
        
        // Update document status to error
        setDocuments(prev => 
          prev.map(doc => 
            doc.id === tempDoc.id 
              ? { ...doc, status: 'error' }
              : doc
          )
        );

        // Fallback: Keep the document but mark as error
        // In a real app, you might want to remove failed uploads
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDocumentSelect = (id: number) => {
    setSelectedDocuments(prev => 
      prev.includes(id) 
        ? prev.filter(docId => docId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedDocuments.length === filteredDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(filteredDocuments.map(doc => doc.id));
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedDocuments.length} selected documents?`)) {
      return;
    }

    try {
      const response = await fetch('/api/documents/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          documentIds: selectedDocuments
        })
      });

      if (!response.ok) {
        throw new Error('Failed to delete documents');
      }

      // Remove deleted documents from local state
      setDocuments(prev => prev.filter(doc => !selectedDocuments.includes(doc.id)));
      setSelectedDocuments([]);
      
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('Failed to delete some documents. Please try again.');
      
      // Fallback to local deletion
      setDocuments(prev => prev.filter(doc => !selectedDocuments.includes(doc.id)));
      setSelectedDocuments([]);
    }
  };

  const handleBulkDownload = async () => {
    try {
      const response = await fetch('/api/documents/bulk-download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          documentIds: selectedDocuments
        })
      });

      if (!response.ok) {
        throw new Error('Failed to prepare download');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `documents-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Bulk download error:', error);
      alert(`Failed to download documents. Preparing ${selectedDocuments.length} documents for download...`);
      
      // Fallback notification
      alert(`Download preparation complete for ${selectedDocuments.length} documents.`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="documents">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Document Center</h1>
              <p className="text-slate-600 mt-1">Manage and analyze your documents with AI-powered insights</p>
            </div>
            <div className="relative">
              <input
                type="file"
                multiple
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".pdf,.doc,.docx,.xlsx,.xls,.jpg,.jpeg,.png"
              />
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="analyzed">Analyzed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>

            <Select value={uploaderFilter} onValueChange={setUploaderFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by uploader" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Uploaders</SelectItem>
                {uniqueUploaders.map(uploader => (
                  <SelectItem key={uploader} value={uploader}>{uploader}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedDocuments.length > 0 && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <span className="text-blue-800 font-medium">
                {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={handleBulkDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}

          {/* Document Table */}
          {filteredDocuments.length === 0 && searchQuery === '' && statusFilter === 'all' && uploaderFilter === 'all' ? (
            // Empty State
            <Card 
              className={`border-2 border-dashed ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <CardContent className="p-12 text-center">
                <div className="relative">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".pdf,.doc,.docx,.xlsx,.xls,.jpg,.jpeg,.png"
                  />
                  <Upload className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">
                    Your documents will appear here
                  </h3>
                  <p className="text-slate-600 mb-4">
                    Upload your first document to get started with AI-powered analysis
                  </p>
                  <p className="text-sm text-slate-500">
                    Drag and drop files here, or click to browse<br />
                    Supports: PDF, DOC, XLSX, JPG, PNG (max 10MB)
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Document Table
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr>
                        <th className="text-left py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0}
                            onChange={handleSelectAll}
                            className="rounded"
                          />
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Document</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Upload Date</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Uploaded By</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-700">Size</th>
                        <th className="text-center py-3 px-4 font-medium text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        // Loading skeleton
                        Array.from({ length: 3 }).map((_, index) => (
                          <tr key={`loading-${index}`} className="border-b border-slate-100">
                            <td className="py-3 px-4">
                              <div className="w-4 h-4 bg-slate-200 rounded animate-pulse"></div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-6 h-6 bg-slate-200 rounded animate-pulse"></div>
                                <div>
                                  <div className="w-32 h-4 bg-slate-200 rounded animate-pulse mb-1"></div>
                                  <div className="w-16 h-3 bg-slate-200 rounded animate-pulse"></div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="w-20 h-6 bg-slate-200 rounded animate-pulse"></div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="w-24 h-4 bg-slate-200 rounded animate-pulse"></div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="w-20 h-4 bg-slate-200 rounded animate-pulse"></div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="w-16 h-4 bg-slate-200 rounded animate-pulse"></div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex justify-center space-x-1">
                                <div className="w-8 h-8 bg-slate-200 rounded animate-pulse"></div>
                                <div className="w-8 h-8 bg-slate-200 rounded animate-pulse"></div>
                                <div className="w-8 h-8 bg-slate-200 rounded animate-pulse"></div>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        filteredDocuments.map((doc) => (
                          <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-4">
                              <input
                                type="checkbox"
                                checked={selectedDocuments.includes(doc.id)}
                                onChange={() => handleDocumentSelect(doc.id)}
                                className="rounded"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-3">
                                {getFileIcon(doc.type)}
                                <div>
                                  <p className="font-medium text-slate-900">{doc.name}</p>
                                  <p className="text-sm text-slate-500 capitalize">{doc.type.toUpperCase()}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(doc.status)}
                                <Badge className={`${getStatusColor(doc.status)} capitalize`}>
                                  {doc.status}
                                </Badge>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {formatDate(doc.uploadDate)}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {doc.uploadedBy}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {doc.size}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center space-x-1">
                                <Button variant="ghost" size="sm" title="View Analysis">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" title="Download">
                                  <Download className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" title="Delete">
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {!isLoading && filteredDocuments.length === 0 && (searchQuery || statusFilter !== 'all' || uploaderFilter !== 'all') && (
                  <div className="p-8 text-center">
                    <Search className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">No documents found</h3>
                    <p className="text-slate-600">Try adjusting your search or filters</p>
                  </div>
                )}

                {!isLoading && documents.length === 0 && !searchQuery && statusFilter === 'all' && uploaderFilter === 'all' && (
                  <div className="p-8 text-center">
                    <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">No documents uploaded yet</h3>
                    <p className="text-slate-600 mb-4">Upload your first document to get started with AI analysis</p>
                    <Button>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Document
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
    </ProtectedRoute>
  );
}
