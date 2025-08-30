'use client';

import { useState } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye,
  Download,
  RefreshCw,
  Shield,
  DollarSign,
  TrendingDown,
  Brain
} from 'lucide-react';
import Link from 'next/link';

interface LoanApplication {
  fileName: string;
  uploadDate: string;
  status: 'analyzing' | 'completed';
  keyTerms?: {
    applicantName: string;
    loanAmount: string;
    purpose: string;
    creditScore: string;
    monthlyIncome: string;
  };
  complianceCheck?: {
    kycVerified: boolean;
    disclosureClause: boolean;
    incomeVerification: boolean;
    creditHistoryCheck: boolean;
  };
  aiSummary?: string;
}

interface FraudAlert {
  id: number;
  transactionId: string;
  amount: string;
  riskScore: number;
  status: 'pending' | 'reviewed' | 'flagged';
  timestamp: string;
  reason: string;
}

const fraudAlerts: FraudAlert[] = [
  {
    id: 1,
    transactionId: 'TXN001234567',
    amount: '₹2,50,000',
    riskScore: 87,
    status: 'pending',
    timestamp: '2025-08-16 10:30 AM',
    reason: 'Unusual transaction pattern'
  },
  {
    id: 2,
    transactionId: 'TXN001234568',
    amount: '₹75,000',
    riskScore: 62,
    status: 'reviewed',
    timestamp: '2025-08-16 09:15 AM',
    reason: 'Geographic anomaly'
  },
  {
    id: 3,
    transactionId: 'TXN001234569',
    amount: '₹5,00,000',
    riskScore: 94,
    status: 'flagged',
    timestamp: '2025-08-16 08:45 AM',
    reason: 'Suspicious merchant category'
  },
];

export default function BankDashboard() {
  const [uploadedFile, setUploadedFile] = useState<LoanApplication | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileUpload = (file: File) => {
    setIsAnalyzing(true);
    
    const newApplication: LoanApplication = {
      fileName: file.name,
      uploadDate: new Date().toLocaleDateString(),
      status: 'analyzing'
    };
    
    setUploadedFile(newApplication);

    // Simulate AI analysis
    setTimeout(() => {
      setUploadedFile({
        ...newApplication,
        status: 'completed',
        keyTerms: {
          applicantName: 'Rajesh Kumar',
          loanAmount: '₹15,00,000',
          purpose: 'Home Purchase',
          creditScore: '742',
          monthlyIncome: '₹85,000'
        },
        complianceCheck: {
          kycVerified: true,
          disclosureClause: true,
          incomeVerification: false,
          creditHistoryCheck: true
        },
        aiSummary: 'Applicant shows strong financial profile with stable income history. Credit score is above average. However, income verification documents are incomplete. Recommend requesting additional salary slips or bank statements before approval. Overall risk assessment: LOW-MEDIUM.'
      });
      setIsAnalyzing(false);
    }, 3000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
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

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-50 border-red-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'reviewed': return 'text-blue-600 bg-blue-50';
      case 'flagged': return 'text-red-600 bg-red-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* AI Workbench Launch Button */}
      <div className="bg-gradient-to-r from-emerald-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">AI Workbench</h3>
            <p className="text-emerald-100">Advanced document analysis and fraud detection with intelligent insights</p>
          </div>
          <Link href="/ai-workbench">
            <button className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2">
              <Brain className="w-5 h-5" />
              <span>Launch Workbench</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Applications Today</p>
              <p className="text-2xl font-bold text-slate-800">47</p>
              <p className="text-sm text-emerald-600 flex items-center mt-1">
                <CheckCircle className="w-4 h-4 mr-1" />
                32 approved
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Fraud Alerts</p>
              <p className="text-2xl font-bold text-slate-800">3</p>
              <p className="text-sm text-red-600 flex items-center mt-1">
                <AlertTriangle className="w-4 h-4 mr-1" />
                Needs review
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Processing Time</p>
              <p className="text-2xl font-bold text-slate-800">2.3m</p>
              <p className="text-sm text-emerald-600 flex items-center mt-1">
                <TrendingDown className="w-4 h-4 mr-1" />
                30% faster
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <RefreshCw className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Volume</p>
              <p className="text-2xl font-bold text-slate-800">₹12.5Cr</p>
              <p className="text-sm text-slate-500 mt-1">
                This month
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Loan Document Analyzer */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800">Loan Document Analyzer</h3>
            <p className="text-sm text-slate-600">Upload and analyze loan applications instantly</p>
          </div>
          
          {!uploadedFile ? (
            <div className="p-6">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-300 hover:border-slate-400'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-slate-800 mb-2">
                  Upload Loan Application (PDF)
                </h4>
                <p className="text-sm text-slate-600 mb-4">
                  Drag and drop your file here, or click to browse
                </p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 cursor-pointer inline-block transition-colors"
                >
                  Select File
                </label>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {isAnalyzing ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-lg font-medium text-slate-800 mb-2">Analyzing Document</p>
                  <p className="text-sm text-slate-600">Our AI is processing your loan application...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* PDF Preview */}
                  <div>
                    <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-5 h-5 text-slate-600" />
                          <span className="text-sm font-medium text-slate-800">{uploadedFile.fileName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-1.5 text-slate-600 hover:text-slate-800 rounded">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-slate-600 hover:text-slate-800 rounded">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="bg-white h-64 rounded border-2 border-dashed border-slate-200 flex items-center justify-center">
                        <div className="text-center">
                          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-2" />
                          <p className="text-sm text-slate-500">PDF Preview</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Analysis Results */}
                  <div className="space-y-4">
                    {/* Key Terms */}
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-slate-800 mb-3">Extracted Key Terms</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Applicant:</span>
                          <span className="font-medium text-slate-800">{uploadedFile.keyTerms?.applicantName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Loan Amount:</span>
                          <span className="font-medium text-slate-800">{uploadedFile.keyTerms?.loanAmount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Purpose:</span>
                          <span className="font-medium text-slate-800">{uploadedFile.keyTerms?.purpose}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Credit Score:</span>
                          <span className="font-medium text-slate-800">{uploadedFile.keyTerms?.creditScore}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Monthly Income:</span>
                          <span className="font-medium text-slate-800">{uploadedFile.keyTerms?.monthlyIncome}</span>
                        </div>
                      </div>
                    </div>

                    {/* Compliance Check */}
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-slate-800 mb-3">Compliance Check</h4>
                      <div className="space-y-2">
                        {uploadedFile.complianceCheck && Object.entries(uploadedFile.complianceCheck).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm text-slate-600 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            {value ? (
                              <CheckCircle className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Summary */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h4 className="text-sm font-semibold text-blue-800 mb-2">AI Analysis Summary</h4>
                      <p className="text-sm text-blue-700">
                        {uploadedFile.aiSummary}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {!isAnalyzing && (
                <div className="flex justify-end mt-6 pt-4 border-t border-slate-200">
                  <button 
                    onClick={() => setUploadedFile(null)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 mr-3"
                  >
                    Upload Another
                  </button>
                  <button className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">
                    Approve Application
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fraud Alerts */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800">Recent Fraud Alerts</h3>
            <p className="text-sm text-slate-600">Transactions flagged by AI</p>
          </div>
          
          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {fraudAlerts.map((alert) => (
              <div key={alert.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{alert.transactionId}</p>
                    <p className="text-xs text-slate-500">{alert.timestamp}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(alert.status)}`}>
                    {alert.status}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-slate-800">{alert.amount}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getRiskColor(alert.riskScore)}`}>
                    Risk: {alert.riskScore}%
                  </span>
                </div>
                
                <p className="text-sm text-slate-600 mb-3">{alert.reason}</p>
                
                <div className="flex space-x-2">
                  <button className="flex-1 text-xs bg-blue-600 text-white py-1.5 rounded hover:bg-blue-700">
                    Review
                  </button>
                  <button className="flex-1 text-xs border border-slate-300 text-slate-600 py-1.5 rounded hover:bg-slate-50">
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
