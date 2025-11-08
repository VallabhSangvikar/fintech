'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  CreditCard,
  Calendar,
  Target,
  Info,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import apiClient from '@/services/api-client';

interface CreditScore {
  score: number;
  rating: 'Poor' | 'Fair' | 'Good' | 'Very Good' | 'Excellent';
  lastUpdated: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

interface CreditFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
  recommendation?: string;
}

interface CreditAccount {
  type: 'credit_card' | 'loan' | 'mortgage';
  name: string;
  balance: number;
  limit?: number;
  utilization?: number;
  status: 'current' | 'late' | 'closed';
  paymentHistory: number;
}

export default function CreditHealthPage() {
  const { user, token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);
  const [creditFactors, setCreditFactors] = useState<CreditFactor[]>([]);
  const [creditAccounts, setCreditAccounts] = useState<CreditAccount[]>([]);

  useEffect(() => {
    if (token) {
      apiClient.setToken(token);
      loadCreditData();
    }
  }, [token]);

  const loadCreditData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch real credit data from API
      const response = await apiClient.getCreditHealth();
      
      if (response.success && response.data) {
        setCreditScore(response.data.creditScore);
        setCreditFactors(response.data.creditFactors);
        setCreditAccounts(response.data.creditAccounts);
        
        console.log('Credit data loaded:', {
          score: response.data.creditScore.score,
          accounts: response.data.creditAccounts.length,
          factors: response.data.creditFactors.length
        });
      } else {
        console.error('Failed to load credit data:', response.error);
        // Fall back to generating sample data for demonstration
        generateSampleData();
      }
    } catch (error) {
      console.error('Error loading credit data:', error);
      // Fall back to generating sample data for demonstration
      generateSampleData();
    } finally {
      setIsLoading(false);
    }
  };

  const generateSampleData = () => {
    // Fallback sample data if API fails
    const mockCreditScore: CreditScore = {
      score: 742,
      rating: 'Very Good',
      lastUpdated: new Date().toISOString().split('T')[0],
      change: 12,
      trend: 'up'
    };

    const mockFactors: CreditFactor[] = [
      {
        name: 'Payment History',
        impact: 'positive',
        description: 'You have made all payments on time',
        recommendation: 'Keep up the excellent payment history'
      },
      {
        name: 'Credit Utilization',
        impact: 'positive',
        description: 'Your credit utilization is 18%',
        recommendation: 'Try to keep utilization below 30%'
      },
      {
        name: 'Length of Credit History',
        impact: 'positive',
        description: 'Average account age is 5.2 years'
      },
      {
        name: 'Credit Mix',
        impact: 'neutral',
        description: 'You have a good mix of credit types'
      },
      {
        name: 'New Credit',
        impact: 'negative',
        description: 'Recent credit inquiry may have small impact',
        recommendation: 'Avoid opening multiple new accounts'
      }
    ];

    const mockAccounts: CreditAccount[] = [
      {
        type: 'credit_card',
        name: 'Chase Sapphire Reserve',
        balance: 1850,
        limit: 10000,
        utilization: 18.5,
        status: 'current',
        paymentHistory: 100
      },
      {
        type: 'credit_card',
        name: 'Bank of America Cash Rewards',
        balance: 450,
        limit: 5000,
        utilization: 9,
        status: 'current',
        paymentHistory: 98
      },
      {
        type: 'loan',
        name: 'Auto Loan - Honda Civic',
        balance: 15420,
        status: 'current',
        paymentHistory: 100
      },
      {
        type: 'mortgage',
        name: 'Home Mortgage',
        balance: 285000,
        status: 'current',
        paymentHistory: 100
      }
    ];

    setCreditScore(mockCreditScore);
    setCreditFactors(mockFactors);
    setCreditAccounts(mockAccounts);
  };

  const getScoreColor = (score: number) => {
    if (score >= 800) return 'text-emerald-600';
    if (score >= 740) return 'text-blue-600';
    if (score >= 670) return 'text-yellow-600';
    if (score >= 580) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBackgroundColor = (score: number) => {
    if (score >= 800) return 'bg-emerald-500';
    if (score >= 740) return 'bg-blue-500';
    if (score >= 670) return 'bg-yellow-500';
    if (score >= 580) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive': return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'negative': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Info className="w-4 h-4 text-slate-600" />;
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'credit_card': return <CreditCard className="w-5 h-5" />;
      case 'loan': return <Target className="w-5 h-5" />;
      case 'mortgage': return <Shield className="w-5 h-5" />;
      default: return <CreditCard className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout currentPage="credit-health">
          <div className="p-6">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-slate-200 rounded w-1/3"></div>
              <div className="h-64 bg-slate-200 rounded-lg"></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-96 bg-slate-200 rounded-lg"></div>
                <div className="h-96 bg-slate-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="credit-health">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Credit Health</h1>
              <p className="text-slate-600 mt-1">Monitor your credit score and get personalized improvement tips</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={loadCreditData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Credit Data
            </Button>
          </div>

          {/* Disclaimer Banner */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-900 mb-1">
                  Sample Credit Data for Demonstration
                </h3>
                <p className="text-sm text-amber-800">
                  The credit scores and account information shown here are generated sample data for demonstration purposes. 
                  For real credit monitoring, we're exploring integration with <span className="font-semibold">Fi Money</span> and 
                  other Indian fintech providers to bring you authentic credit bureau data from CIBIL, Experian, and Equifax. 
                  <a href="#" className="text-amber-900 underline ml-1 hover:text-amber-700">Learn more about our roadmap</a>
                </p>
              </div>
            </div>
          </div>

          {creditScore && (
            <>
              {/* Credit Score Overview */}
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full transform translate-x-16 -translate-y-16"></div>
                <CardContent className="p-8">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
                    <div className="flex items-center space-x-8">
                      <div className="text-center">
                        <div className="relative w-32 h-32 mx-auto">
                          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-slate-200"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="transparent"
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className={getScoreColor(creditScore.score)}
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              fill="transparent"
                              strokeDasharray={`${(creditScore.score / 850) * 100}, 100`}
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className={`text-3xl font-bold ${getScoreColor(creditScore.score)}`}>
                                {creditScore.score}
                              </div>
                              <div className="text-sm text-slate-600 font-medium">{creditScore.rating}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-semibold text-slate-800">Your Credit Score</h3>
                          <p className="text-slate-600">Last updated: {new Date(creditScore.lastUpdated).toLocaleDateString()}</p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {creditScore.trend === 'up' ? (
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                          ) : creditScore.trend === 'down' ? (
                            <TrendingDown className="w-5 h-5 text-red-600" />
                          ) : null}
                          <span className={`font-medium ${
                            creditScore.change > 0 ? 'text-emerald-600' : 
                            creditScore.change < 0 ? 'text-red-600' : 'text-slate-600'
                          }`}>
                            {creditScore.change > 0 ? '+' : ''}{creditScore.change} points this month
                          </span>
                        </div>
                        
                        <div className="text-sm text-slate-600">
                          <p>Score range: 300 - 850</p>
                          <p>Your score is better than 75% of consumers</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="lg:text-right">
                      <Badge className="bg-blue-100 text-blue-700 mb-4">
                        Very Good Credit
                      </Badge>
                      <div className="space-y-2 text-sm">
                        <p className="text-slate-600">You qualify for:</p>
                        <ul className="space-y-1 text-slate-700">
                          <li>• Premium credit cards</li>
                          <li>• Low interest rates</li>
                          <li>• Better loan terms</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Credit Factors and Accounts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Credit Factors */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="w-5 h-5" />
                      <span>Credit Factors</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {creditFactors.map((factor, index) => (
                        <div key={index} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {getImpactIcon(factor.impact)}
                              <h4 className="font-medium text-slate-800">{factor.name}</h4>
                            </div>
                            <Badge 
                              className={
                                factor.impact === 'positive' ? 'bg-emerald-100 text-emerald-700' :
                                factor.impact === 'negative' ? 'bg-red-100 text-red-700' :
                                'bg-slate-100 text-slate-700'
                              }
                            >
                              {factor.impact}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{factor.description}</p>
                          {factor.recommendation && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-2">
                              <p className="text-xs text-blue-700">💡 {factor.recommendation}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Credit Accounts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CreditCard className="w-5 h-5" />
                      <span>Credit Accounts</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {creditAccounts.map((account, index) => (
                        <div key={index} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                {getAccountIcon(account.type)}
                              </div>
                              <div>
                                <h4 className="font-medium text-slate-800">{account.name}</h4>
                                <p className="text-sm text-slate-600 capitalize">{account.type.replace('_', ' ')}</p>
                              </div>
                            </div>
                            <Badge className={
                              account.status === 'current' ? 'bg-emerald-100 text-emerald-700' :
                              account.status === 'late' ? 'bg-red-100 text-red-700' :
                              'bg-slate-100 text-slate-700'
                            }>
                              {account.status}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Balance:</span>
                              <span className="font-medium">${account.balance.toLocaleString()}</span>
                            </div>
                            
                            {account.limit && (
                              <>
                                <div className="flex justify-between text-sm">
                                  <span className="text-slate-600">Limit:</span>
                                  <span className="font-medium">${account.limit.toLocaleString()}</span>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Utilization:</span>
                                    <span className={`font-medium ${
                                      (account.utilization || 0) > 30 ? 'text-red-600' : 'text-emerald-600'
                                    }`}>
                                      {account.utilization?.toFixed(1)}%
                                    </span>
                                  </div>
                                  <Progress 
                                    value={account.utilization || 0} 
                                    className={`h-2 ${
                                      (account.utilization || 0) > 30 ? 'bg-red-100' : 'bg-emerald-100'
                                    }`}
                                  />
                                </div>
                              </>
                            )}
                            
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Payment History:</span>
                              <span className={`font-medium ${
                                account.paymentHistory >= 95 ? 'text-emerald-600' : 
                                account.paymentHistory >= 85 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {account.paymentHistory}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Improvement Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="w-5 h-5" />
                    <span>Improvement Recommendations</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                        <h4 className="font-medium text-blue-800">Keep Low Utilization</h4>
                      </div>
                      <p className="text-sm text-blue-700">
                        Maintain credit card utilization below 30% for optimal scoring.
                      </p>
                      <Button variant="ghost" size="sm" className="mt-2 text-blue-600 hover:text-blue-700">
                        Learn More <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="w-5 h-5 text-emerald-600" />
                        <h4 className="font-medium text-emerald-800">Pay On Time</h4>
                      </div>
                      <p className="text-sm text-emerald-700">
                        Continue making all payments on time to maintain excellent payment history.
                      </p>
                      <Button variant="ghost" size="sm" className="mt-2 text-emerald-600 hover:text-emerald-700">
                        Set Reminders <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Shield className="w-5 h-5 text-purple-600" />
                        <h4 className="font-medium text-purple-800">Monitor Regularly</h4>
                      </div>
                      <p className="text-sm text-purple-700">
                        Check your credit report regularly for errors and unauthorized accounts.
                      </p>
                      <Button variant="ghost" size="sm" className="mt-2 text-purple-600 hover:text-purple-700">
                        Get Report <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}