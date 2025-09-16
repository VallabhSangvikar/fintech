import { APIResponse, LoginResponse, User, FinancialGoal, Document } from '@/types/database';

class APIError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'APIError';
  }
}

class APIClient {
  private baseURL = '/api';
  private token: string | null = null;

  constructor() {
    // Initialize token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken');
      console.log('API Client initialized with token:', this.token ? 'Present' : 'None');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    console.log('API Client token updated:', token ? 'Token set' : 'Token cleared');
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('authToken', token);
      } else {
        localStorage.removeItem('authToken');
      }
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Always get the latest token from localStorage
    const currentToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : this.token;
    
    if (currentToken) {
      // Clean the token and ensure proper Bearer format
      const cleanToken = currentToken.trim();
      headers.Authorization = `Bearer ${cleanToken}`;
      console.log('API Client using token:', cleanToken.substring(0, 20) + '...');
    } else {
      console.log('API Client: No token available');
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new APIError(response.status, data.error || 'API Error', data);
      }

      return data as APIResponse<T>;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(500, 'Network error occurred');
    }
  }

  // Authentication APIs
  async login(email: string, password: string): Promise<APIResponse<LoginResponse>> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signup(data: {
    full_name: string;
    email: string;
    password: string;
    role: string;
    organization_name?: string;
  }): Promise<APIResponse<LoginResponse>> {
    return this.request<LoginResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser(): Promise<APIResponse<User>> {
    return this.request<User>('/auth/me');
  }

  async logout(): Promise<APIResponse<null>> {
    return this.request<null>('/auth/logout', { method: 'POST' });
  }

  // Goals APIs
  async getGoals(): Promise<APIResponse<FinancialGoal[]>> {
    return this.request<FinancialGoal[]>('/goals');
  }

  async createGoal(data: {
    goal_name: string;
    target_amount: number;
    current_amount?: number;
    target_date?: string;
  }): Promise<APIResponse<FinancialGoal>> {
    return this.request<FinancialGoal>('/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateGoal(
    id: number,
    data: Partial<{
      goal_name: string;
      target_amount: number;
      current_amount: number;
      target_date: string;
    }>
  ): Promise<APIResponse<FinancialGoal>> {
    return this.request<FinancialGoal>(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteGoal(id: number): Promise<APIResponse<null>> {
    return this.request<null>(`/goals/${id}`, { method: 'DELETE' });
  }

  // Documents APIs
  async getDocuments(): Promise<APIResponse<Document[]>> {
    return this.request<Document[]>('/documents');
  }

  async uploadDocuments(files: File[], documentType: string): Promise<APIResponse<any>> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('documentType', documentType);

    return fetch(`${this.baseURL}/documents`, {
      method: 'POST',
      headers: {
        Authorization: this.token ? `Bearer ${this.token}` : '',
      },
      body: formData,
    }).then(res => res.json());
  }

  async deleteDocument(id: string): Promise<APIResponse<null>> {
    return this.request<null>(`/documents/${id}`, { method: 'DELETE' });
  }

  // AI APIs
  async sendChatMessage(data: {
    message: string;
    sessionId?: string;
  }): Promise<APIResponse<any>> {
    return this.request<any>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAISessions(): Promise<APIResponse<any[]>> {
    return this.request<any[]>('/ai/sessions');
  }

  async getInvestmentTips(): Promise<APIResponse<any[]>> {
    return this.request<any[]>('/ai/investment-tips');
  }

  async analyzeDocument(data: {
    documentId: string;
    analysisType: string;
  }): Promise<APIResponse<any>> {
    return this.request<any>('/ai/analyze-document', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Team APIs
  async getTeamMembers(): Promise<APIResponse<any[]>> {
    return this.request<any[]>('/team');
  }

  async inviteTeamMember(data: {
    email: string;
    role: string;
  }): Promise<APIResponse<any>> {
    return this.request<any>('/team', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTeamMember(userId: string, data: {
    role: string;
  }): Promise<APIResponse<any>> {
    return this.request<any>(`/team/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async removeTeamMember(userId: string): Promise<APIResponse<null>> {
    return this.request<null>(`/team/${userId}`, { method: 'DELETE' });
  }

  // User Profile APIs
  async updateUserProfile(data: {
    name: string;
    email: string;
    phone?: string;
  }): Promise<APIResponse<any>> {
    return this.request<any>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<APIResponse<any>> {
    return this.request<any>('/user/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Customer APIs  
  async getCustomerOnboardingStatus(): Promise<APIResponse<any>> {
    return this.request<any>('/customer/onboarding-status');
  }

  async updateCustomerProfile(data: any): Promise<APIResponse<any>> {
    return this.request<any>('/customer/onboarding', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Knowledge Base APIs
  async getKnowledgeBase(): Promise<APIResponse<any[]>> {
    return this.request<any[]>('/knowledge-base');
  }

  async uploadKnowledgeDocument(file: File, category: string): Promise<APIResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    return fetch(`${this.baseURL}/knowledge-base`, {
      method: 'POST',
      headers: {
        Authorization: this.token ? `Bearer ${this.token}` : '',
      },
      body: formData,
    }).then(res => res.json());
  }

  // Database Test
  async testDatabase(): Promise<APIResponse<any>> {
    return this.request<any>('/test-db');
  }
}

// Create singleton instance
const apiClient = new APIClient();

export default apiClient;
export { APIError };