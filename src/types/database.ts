// MySQL Types (matching your exact schema)
export interface Organization {
  id: string; // CHAR(36) UUID
  name: string;
  type: 'INVESTMENT' | 'BANK';
  created_at: Date;
}

export interface User {
  id: string; // CHAR(36) UUID
  full_name: string;
  email: string;
  password_hash: string;
  avatar_url?: string;
  last_login_at?: Date;
  is_active: boolean;
  jwt_version: number; // For token invalidation
  created_at: Date;
}

export interface TeamMembership {
  organization_id: string; // CHAR(36) UUID
  user_id: string; // CHAR(36) UUID
  role: 'ADMIN' | 'PORTFOLIO_MANAGER' | 'ANALYST' | 'LENDING_OFFICER' | 'RISK_MANAGER';
  joined_at: Date;
}

export interface Portfolio {
  id: string; // CHAR(36) UUID
  organization_id: string; // CHAR(36) UUID
  name: string;
  description?: string;
  risk_score?: number;
  created_at: Date;
}

export interface PortfolioHolding {
  id: number; // INT AUTO_INCREMENT
  portfolio_id: string; // CHAR(36) UUID
  asset_name: string;
  asset_ticker?: string;
  quantity: number; // DECIMAL(18,4)
  purchase_price: number; // DECIMAL(18,4)
  purchase_date: Date;
}

export interface LoanApplication {
  id: string; // CHAR(36) UUID
  document_id: string; // CHAR(36) UUID
  organization_id: string; // CHAR(36) UUID
  applicant_name?: string;
  loan_amount?: number; // DECIMAL(18,2)
  credit_score?: number;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  ai_recommendation?: string;
  processed_at?: Date;
}

export interface LoanApprovalRule {
  id: number; // INT AUTO_INCREMENT
  organization_id: string; // CHAR(36) UUID
  rule_name: string;
  rule_key: string;
  operator: 'GREATER_THAN' | 'LESS_THAN' | 'EQUALS';
  value: string;
  is_active: boolean;
}

export interface Transaction {
  id: number; // INT AUTO_INCREMENT
  organization_id: string; // CHAR(36) UUID
  amount: number; // DECIMAL(18,2)
  timestamp: Date;
  type: 'ONLINE' | 'IN_PERSON' | 'ATM_WITHDRAWAL';
  location?: string;
  is_flagged: boolean;
  fraud_score?: number; // FLOAT
}

export interface FinancialGoal {
  id: number; // INT AUTO_INCREMENT
  user_id: string; // CHAR(36) UUID
  goal_name: string;
  target_amount: number; // DECIMAL(18,2)
  current_amount: number; // DECIMAL(18,2)
  target_date?: Date;
  created_at: Date;
}

export interface InvestmentProduct {
  id: number; // INT AUTO_INCREMENT
  product_name: string;
  user_id: string; // CHAR(36) UUID
  product_category: 'INDEX_FUND' | 'REAL_ESTATE' | 'SIP' | 'GOVERNMENT_BOND';
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  expected_return?: string;
  description?: string;
}

export interface Document {
  id: string; // CHAR(36) UUID
  organization_id?: string; // CHAR(36) UUID
  uploaded_by_id: string; // CHAR(36) UUID
  file_name: string;
  storage_url: string;
  document_type: 'INVESTMENT_PLAN' | 'LOAN_APPLICATION' | 'FINANCIAL_REPORT';
  status: 'PENDING' | 'ANALYZED' | 'ERROR';
  uploaded_at: Date;
}

export interface KnowledgeBaseDocument {
  id: number; // INT AUTO_INCREMENT
  organization_id: string; // CHAR(36) UUID
  uploaded_by_id: string; // CHAR(36) UUID
  file_name: string;
  storage_url: string;
  document_category: 'LOAN_COMPLIANCE' | 'ESG_POLICY' | 'REGULATORY_STANDARD';
  is_active: boolean;
  created_at: Date;
}

// MongoDB Types
export interface AISession {
  _id: string; // MongoDB ObjectId
  userId: string; // References MySQL users.id
  organizationId?: string; // References MySQL organizations.id
  sessionTitle: string;
  createdAt: Date;
  lastUpdatedAt: Date;
  conversationHistory: AIMessage[];
}

export interface AIMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  attachments?: AIAttachment[];
  citations?: AICitation[];
}

export interface AIAttachment {
  documentId: string; // References MySQL documents.id
  fileName: string;
}

export interface AICitation {
  sourceDocumentId: string; // References MySQL documents.id
  page: number;
  text: string;
}

export interface CustomerProfile {
  _id: string; // MongoDB ObjectId - matches user ID from MySQL
  userId: string; // References MySQL users.id
  incomeRange: string;
  currentCreditScore: number;
  riskAppetite: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  primaryFinancialGoal: 'HOME_PURCHASE' | 'RETIREMENT' | 'EDUCATION' | 'WEALTH_BUILDING';
  onboardingCompleted: boolean;
  profileCreatedAt: Date;
  lastUpdatedAt: Date;
}

export interface InvestmentTip {
  _id: string; // MongoDB ObjectId
  title: string;
  category: 'MARKET_ANALYSIS' | 'RISK_MANAGEMENT' | 'PORTFOLIO_OPTIMIZATION' | 'SECTOR_INSIGHTS';
  content: string;
  aiConfidenceScore: number; // 0-100
  marketImpact: 'LOW' | 'MEDIUM' | 'HIGH';
  applicableRiskLevel: ('LOW' | 'MEDIUM' | 'HIGH')[];
  tags: string[];
  isActive: boolean;
  publishedAt: Date;
  expiresAt?: Date;
  sourcesUsed: string[];
}

export interface DocumentAnalysisResult {
  _id: string; // MongoDB ObjectId
  documentId: string; // References MySQL documents.id
  analysisType: 'INVESTMENT_ANALYSIS' | 'LOAN_RISK_ASSESSMENT' | 'COMPLIANCE_CHECK';
  extractedData: Record<string, any>; // Flexible JSON structure
  aiSummary: string;
  keyFindings: string[];
  riskIndicators: {
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    factors: string[];
  };
  recommendations: string[];
  confidenceScore: number; // 0-100
  processedAt: Date;
  processingTimeMs: number;
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// JWT & Authentication Types
export interface JWTPayload {
  userId: string;
  email: string;
  organizationId?: string;
  role?: string;
  jwtVersion: number;
  iat: number;
  exp: number;
}

export interface LoginResponse {
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    organizationId?: string;
    role?: string;
  };
  token: string;
}

// AI Service Types
export interface AIServiceRequest {
  message: string;
  sessionId?: string;
  userId: string;
  organizationId?: string;
  context?: {
    documentIds?: string[];
    analysisType?: string;
    conversationHistory?: AIMessage[];
    recentFinancialNews?: string[];
  };
}

export interface AIServiceResponse {
  response: string;
  sessionId: string;
  citations?: AICitation[];
  confidence?: number;
  processingTimeMs: number;
  // Enhanced financial analysis data
  success?: boolean;
  query?: string;
  companies?: string[];
  final_report?: string;
  messages?: string[];
}

export interface DocumentAnalysisRequest {
  documentId: string;
  analysisType: 'INVESTMENT_ANALYSIS' | 'LOAN_RISK_ASSESSMENT' | 'COMPLIANCE_CHECK';
  organizationId: string;
}

export interface DocumentAnalysisStatus {
  documentId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'ERROR';
  progress?: number; // 0-100
  estimatedTimeRemaining?: number; // seconds
}

// Frontend State Types
export interface UserState {
  user: User | null;
  organization: Organization | null;
  teamMembership: TeamMembership | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface DashboardData {
  portfolios?: Portfolio[];
  transactions?: Transaction[];
  goals?: FinancialGoal[];
  loanApplications?: LoanApplication[];
  documents?: Document[];
}
