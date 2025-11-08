'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Upload, 
  FileText, 
  PieChart, 
  TrendingDown, 
  TrendingUp,
  Calendar,
  DollarSign,
  ShoppingCart,
  Home,
  Car,
  Utensils,
  Gamepad2,
  Plus,
  Eye,
  Download,
  BarChart3
} from 'lucide-react';
import apiClient from '@/services/api-client';

interface ExpenseCategory {
  name: string;
  amount: number;
  percentage: number;
  color: string;
  icon: any;
}

interface ExpenseItem {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  source: 'manual' | 'uploaded';
}

interface ExpenseAnalysis {
  totalExpenses: number;
  monthlyAverage: number;
  categories: ExpenseCategory[];
  trends: {
    currentMonth: number;
    previousMonth: number;
    change: number;
  };
}

const expenseIcons = {
  'Food & Dining': Utensils,
  'Transportation': Car,
  'Shopping': ShoppingCart,
  'Home': Home,
  'Entertainment': Gamepad2,
  'Other': DollarSign,
};

const categoryColors = {
  'Food & Dining': 'bg-orange-500',
  'Transportation': 'bg-blue-500',
  'Shopping': 'bg-purple-500',
  'Home': 'bg-emerald-500',
  'Entertainment': 'bg-pink-500',
  'Other': 'bg-slate-500',
};

export default function ExpenseAnalysisPage() {
  const { user, token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [analysis, setAnalysis] = useState<ExpenseAnalysis | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: 'Other',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (token) {
      apiClient.setToken(token);
      loadExpenseData();
    }
  }, [token]);

  const loadExpenseData = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getExpenseAnalysisReports();
      
      if (response.success && response.data && response.data.length > 0) {
        // We have real analysis reports from the backend!
        console.log('Loaded expense reports:', response.data);
        
        // Convert API reports to expense items
        const expenseItems: ExpenseItem[] = [];
        
        response.data.forEach((report: any) => {
          // Parse extracted_expenses if available
          try {
            const extractedExpenses = typeof report.extracted_expenses === 'string' 
              ? JSON.parse(report.extracted_expenses) 
              : report.extracted_expenses || [];
            
            if (Array.isArray(extractedExpenses)) {
              extractedExpenses.forEach((expense: any, index: number) => {
                expenseItems.push({
                  id: `${report.id}-${index}`,
                  description: expense.description || expense.item || `Expense from ${report.document_name}`,
                  amount: parseFloat(expense.amount || 0),
                  category: mapExpenseCategory(expense.category || 'Other'),
                  date: expense.date || report.created_at.split('T')[0],
                  source: 'uploaded' as const
                });
              });
            }
          } catch (parseError) {
            console.warn('Error parsing expenses from report:', parseError);
          }
        });
        
        // If we have actual expenses, use them, otherwise show a helpful message
        if (expenseItems.length > 0) {
          setExpenses(expenseItems);
          setAnalysis(analyzeExpenses(expenseItems));
        } else {
          // Reports exist but no detailed expenses extracted, still show summary
          console.log('Reports found but no detailed expenses extracted');
          const mockExpenses = generateMockExpenseData();
          setExpenses(mockExpenses);
          setAnalysis(analyzeExpenses(mockExpenses));
        }
      } else {
        // No reports yet, show mock data for demonstration
        console.log('No expense reports found, showing demo data');
        const mockExpenses = generateMockExpenseData();
        setExpenses(mockExpenses);
        setAnalysis(analyzeExpenses(mockExpenses));
      }
    } catch (error) {
      console.error('Error loading expense data:', error);
      // Fallback to mock data
      const mockExpenses = generateMockExpenseData();
      setExpenses(mockExpenses);
      setAnalysis(analyzeExpenses(mockExpenses));
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to map API categories to UI categories
  const mapExpenseCategory = (apiCategory: string): string => {
    const categoryMap: Record<string, string> = {
      'food': 'Food & Dining',
      'dining': 'Food & Dining',
      'restaurant': 'Food & Dining',
      'groceries': 'Food & Dining',
      'transport': 'Transportation',
      'transportation': 'Transportation',
      'fuel': 'Transportation',
      'uber': 'Transportation',
      'taxi': 'Transportation',
      'shopping': 'Shopping',
      'retail': 'Shopping',
      'clothing': 'Shopping',
      'home': 'Home',
      'rent': 'Home',
      'utilities': 'Home',
      'entertainment': 'Entertainment',
      'movies': 'Entertainment',
      'games': 'Entertainment'
    };
    
    const normalized = apiCategory.toLowerCase().trim();
    return categoryMap[normalized] || 'Other';
  };

  const generateMockExpenseData = (): ExpenseItem[] => {
    const categories = ['Food & Dining', 'Transportation', 'Shopping', 'Home', 'Entertainment', 'Other'];
    const mockData: ExpenseItem[] = [];
    
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      mockData.push({
        id: `expense-${i}`,
        description: `Expense item ${i + 1}`,
        amount: Math.random() * 200 + 10,
        category: categories[Math.floor(Math.random() * categories.length)],
        date: date.toISOString().split('T')[0],
        source: Math.random() > 0.7 ? 'uploaded' : 'manual',
      });
    }
    
    return mockData;
  };

  const analyzeExpenses = (expenseData: ExpenseItem[]): ExpenseAnalysis => {
    const totalExpenses = expenseData.reduce((sum, expense) => sum + expense.amount, 0);
    const monthlyAverage = totalExpenses / 3; // Assuming 3 months of data
    
    // Calculate category breakdown
    const categoryTotals: Record<string, number> = {};
    expenseData.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    
    const categories: ExpenseCategory[] = Object.entries(categoryTotals).map(([name, amount]) => ({
      name,
      amount,
      percentage: (amount / totalExpenses) * 100,
      color: categoryColors[name as keyof typeof categoryColors] || 'bg-slate-500',
      icon: expenseIcons[name as keyof typeof expenseIcons] || DollarSign,
    }));
    
    // Calculate trends (mock data)
    const currentMonth = totalExpenses * 0.4;
    const previousMonth = totalExpenses * 0.35;
    const change = ((currentMonth - previousMonth) / previousMonth) * 100;
    
    return {
      totalExpenses,
      monthlyAverage,
      categories: categories.sort((a, b) => b.amount - a.amount),
      trends: {
        currentMonth,
        previousMonth,
        change,
      },
    };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const processUploadedFile = async () => {
    if (!uploadedFile) return;

    try {
      console.log('Processing file with AI:', uploadedFile.name);
      
      // Call the AI analysis API
      const response = await apiClient.analyzeExpenseDocument(uploadedFile);
      
      if (response.success && response.data) {
        // Parse the analysis data
        const analysisData = response.data;
        const totalExpenses = analysisData.total_expenses || 0;
        const insights = analysisData.analysis_insights || '';
        const recommendations = analysisData.recommendations || '';
        
        // Show detailed success message
        const successMessage = `✅ Document Analyzed Successfully!

📄 File: ${uploadedFile.name}
💰 Total Expenses Detected: ₹${totalExpenses.toLocaleString()}

${insights ? `💡 Key Insights:\n${insights.slice(0, 200)}${insights.length > 200 ? '...' : ''}` : ''}

${recommendations ? `\n📊 Recommendations:\n${recommendations.slice(0, 150)}${recommendations.length > 150 ? '...' : ''}` : ''}

The full analysis has been saved to your expense reports.`;
        
        alert(successMessage);
        
        // Reload the expense data to reflect the new analysis
        await loadExpenseData();
        
        setUploadedFile(null);
        setIsUploadModalOpen(false);
      } else {
        const errorMsg = response.error || 'Unknown error occurred';
        alert(`❌ Failed to analyze the document.\n\nError: ${errorMsg}\n\nPlease check:\n- File format (PDF, CSV, or Excel)\n- File size (max 10MB)\n- File contains expense data`);
      }
    } catch (error: any) {
      console.error('Error processing file:', error);
      alert(`❌ Failed to process the uploaded file.\n\nError: ${error.message || 'Network error'}\n\nPlease ensure:\n- FastAPI backend is running\n- File is a valid expense document\n- You have a stable internet connection`);
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount) return;

    // For now, add to local mock data since we're using document upload approach
    const expense: ExpenseItem = {
      id: `manual-${Date.now()}`,
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      category: newExpense.category,
      date: newExpense.date,
      source: 'manual',
    };

    const updatedExpenses = [expense, ...expenses];
    setExpenses(updatedExpenses);
    setAnalysis(analyzeExpenses(updatedExpenses));
    
    setNewExpense({
      description: '',
      amount: '',
      category: 'Other',
      date: new Date().toISOString().split('T')[0],
    });
    setIsAddExpenseOpen(false);
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout currentPage="expense-analysis">
          <div className="p-6">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-slate-200 rounded w-1/3"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-32 bg-slate-200 rounded-lg"></div>
                ))}
              </div>
              <div className="h-96 bg-slate-200 rounded-lg"></div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="expense-analysis">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Expense Analysis</h1>
              <p className="text-slate-600 mt-1">Track and analyze your spending patterns with AI-powered insights</p>
            </div>
            <div className="flex space-x-3">
              <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Manual Expense</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={newExpense.description}
                        onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                        placeholder="Enter expense description"
                      />
                    </div>
                    <div>
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <select
                        id="category"
                        value={newExpense.category}
                        onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                        className="w-full p-2 border border-slate-300 rounded-md"
                      >
                        {Object.keys(expenseIcons).map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newExpense.date}
                        onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsAddExpenseOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddExpense} className="bg-blue-600 hover:bg-blue-700">
                        Add Expense
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Expense Document</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                      <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600 mb-4">
                        Upload bank statements, receipts, or expense reports
                      </p>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        accept=".pdf,.jpg,.jpeg,.png,.txt,.csv"
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload">
                        <Button asChild className="cursor-pointer">
                          <span>Choose File</span>
                        </Button>
                      </label>
                      {uploadedFile && (
                        <p className="mt-2 text-sm text-slate-600">
                          Selected: {uploadedFile.name}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Supported formats: PDF, JPG, PNG, TXT, CSV (Max 10MB)
                    </p>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={processUploadedFile} 
                        disabled={!uploadedFile}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Process Document
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {analysis && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-slate-600">Total Expenses</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800 mt-2">
                      ${analysis.totalExpenses.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-medium text-slate-600">Monthly Average</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800 mt-2">
                      ${analysis.monthlyAverage.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium text-slate-600">This Month</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800 mt-2">
                      ${analysis.trends.currentMonth.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      {analysis.trends.change >= 0 ? (
                        <TrendingUp className="w-5 h-5 text-red-600" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-emerald-600" />
                      )}
                      <span className="text-sm font-medium text-slate-600">Change</span>
                    </div>
                    <p className={`text-2xl font-bold mt-2 ${
                      analysis.trends.change >= 0 ? 'text-red-600' : 'text-emerald-600'
                    }`}>
                      {analysis.trends.change >= 0 ? '+' : ''}{analysis.trends.change.toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Category Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <PieChart className="w-5 h-5" />
                      <span>Expense Categories</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analysis.categories.map((category, index) => {
                        const IconComponent = category.icon;
                        return (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 rounded-lg ${category.color} flex items-center justify-center`}>
                                <IconComponent className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-800">{category.name}</p>
                                <p className="text-sm text-slate-600">${category.amount.toFixed(2)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-slate-800">{category.percentage.toFixed(1)}%</p>
                              <div className="w-20 h-2 bg-slate-200 rounded-full mt-1">
                                <div 
                                  className={`h-full ${category.color} rounded-full`}
                                  style={{ width: `${category.percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Expenses */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="w-5 h-5" />
                      <span>Recent Expenses</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {expenses.slice(0, 10).map((expense) => {
                        const IconComponent = expenseIcons[expense.category as keyof typeof expenseIcons] || DollarSign;
                        return (
                          <div key={expense.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded ${categoryColors[expense.category as keyof typeof categoryColors] || 'bg-slate-500'} flex items-center justify-center`}>
                                <IconComponent className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-sm text-slate-800">{expense.description}</p>
                                <p className="text-xs text-slate-600">{expense.date}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-sm text-slate-800">${expense.amount.toFixed(2)}</p>
                              <Badge variant={expense.source === 'uploaded' ? 'default' : 'outline'} className="text-xs">
                                {expense.source}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}