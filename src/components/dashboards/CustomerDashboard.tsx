'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/services/api-client';
import { Send, TrendingUp, Target, DollarSign, Shield, Star, ArrowRight, ExternalLink, Brain } from 'lucide-react';
import Link from 'next/link';

interface ChatMessage {
  id: number;
  type: 'ai' | 'user';
  message: string;
  time: string;
  tips?: string[];
}

interface InvestmentTip {
  id: number;
  title: string;
  description: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  expectedReturn: string;
  category: string;
  confidence?: number;
  rationale?: string;
}

interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
  priority: string;
  status: string;
}

const initialChatMessages: ChatMessage[] = [
  {
    id: 1,
    type: 'ai',
    message: 'Hi! I\'m your financial assistant. How can I help you improve your financial health today?',
    time: '09:00 AM',
  },
];

export default function CustomerDashboard() {
  const { user, token } = useAuth();
  
  const [messages, setMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [creditScore, setCreditScore] = useState(650); // Start with base score
  const [financialHealthScore, setFinancialHealthScore] = useState(65);
  const [isLoading, setIsLoading] = useState(true);
  
  // Local state instead of context
  const [goals, setGoals] = useState<any[]>([]);
  const [investmentTips, setInvestmentTips] = useState<any[]>([]);
  const [userPortfolio, setUserPortfolio] = useState<any[]>([]);

  // Initialize API client with token
  useEffect(() => {
    if (token) {
      console.log('Setting token in API client:', token.substring(0, 20) + '...');
      apiClient.setToken(token);
    } else {
      console.log('No token available in CustomerDashboard');
    }
  }, [token]);

  // Calculate credit score based on user's financial behavior
  const calculateCreditScore = (goals: any[], portfolio: any[]) => {
    let baseScore = 650; // Base credit score
    
    // Goal-based scoring (up to 100 points)
    if (goals.length > 0) {
      baseScore += Math.min(goals.length * 15, 50); // Points for having goals (max 50)
      
      // Calculate average goal completion
      const totalProgress = goals.reduce((sum, goal) => {
        const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
        return sum + Math.min(progress, 100);
      }, 0);
      const avgProgress = totalProgress / goals.length;
      baseScore += Math.floor(avgProgress / 2); // Up to 50 points for goal progress
    }

    // Portfolio diversification (up to 75 points)
    if (portfolio.length > 0) {
      baseScore += Math.min(portfolio.length * 12, 60); // Points for diversification
      
      // Check for different asset types
      const categories = new Set(portfolio.map(item => item.product_category));
      baseScore += categories.size * 5; // 5 points per different category
    }

    // Account activity bonus (simulate based on data presence - up to 50 points)
    if (user?.last_login_at) {
      baseScore += 25; // Active user bonus
    }
    if (goals.length > 0 || portfolio.length > 0) {
      baseScore += 25; // Engagement bonus
    }

    return Math.min(Math.max(baseScore, 300), 850); // Cap between 300-850
  };

  // Calculate financial health score
  const calculateFinancialHealth = (goals: any[], portfolio: any[]) => {
    let healthScore = 50; // Base health score

    // Goals progress (up to 30 points)
    if (goals.length > 0) {
      const totalProgress = goals.reduce((sum, goal) => {
        const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
        return sum + Math.min(progress, 100);
      }, 0);
      healthScore += (totalProgress / goals.length) * 0.3;
    }

    // Investment activity (up to 20 points)
    if (portfolio.length > 0) {
      healthScore += Math.min(portfolio.length * 3, 20);
    }

    return Math.min(Math.max(healthScore, 0), 100);
  };

  // Load real data from APIs
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!token) {
        console.log('No token available, using demo data');
        // Set some demo data for showcase
        setInvestmentTips([
          {
            id: 1,
            title: "Diversify Your Portfolio",
            description: "Consider investing across different sectors and asset classes to reduce risk.",
            riskLevel: "Low" as const,
            expectedReturn: "8-10%",
            category: "Portfolio Management",
            confidence: 85,
            rationale: "Historical data shows diversified portfolios perform better over time."
          },
          {
            id: 2,
            title: "SIP in Index Funds",
            description: "Start a systematic investment plan in low-cost index funds.",
            riskLevel: "Medium" as const,
            expectedReturn: "12-15%",
            category: "Investment Strategy",
            confidence: 90,
            rationale: "Index funds provide market returns with minimal expense ratios."
          }
        ]);
        
        setGoals([
          {
            id: 1,
            user_id: "demo-user",
            goal_name: "Emergency Fund",
            target_amount: 500000,
            current_amount: 125000,
            target_date: new Date('2025-12-31'),
            created_at: new Date()
          },
          {
            id: 2,
            user_id: "demo-user", 
            goal_name: "House Down Payment",
            target_amount: 2000000,
            current_amount: 450000,
            target_date: new Date('2026-06-30'),
            created_at: new Date()
          }
        ]);

        setUserPortfolio([
          {
            id: 1,
            product_name: "Nifty 50 Index Fund",
            product_category: "INDEX_FUND",
            risk_level: "MEDIUM",
            expected_return: "12-15%",
            description: "Diversified equity fund tracking the Nifty 50 index"
          },
          {
            id: 2,
            product_name: "Monthly SIP - HDFC Top 100",
            product_category: "SIP",
            risk_level: "MEDIUM",
            expected_return: "10-14%",
            description: "Systematic investment plan in large-cap equity fund"
          },
          {
            id: 3,
            product_name: "Government Savings Bonds",
            product_category: "GOVERNMENT_BOND",
            risk_level: "LOW",
            expected_return: "7-8%",
            description: "Safe government-backed investment with steady returns"
          }
        ]);

        // Calculate scores for demo data
        const demoGoals = [
          { id: 1, goal_name: "Emergency Fund", target_amount: 500000, current_amount: 125000 },
          { id: 2, goal_name: "House Down Payment", target_amount: 2000000, current_amount: 450000 }
        ];
        const demoPortfolio = [
          { product_category: "INDEX_FUND" },
          { product_category: "SIP" }, 
          { product_category: "GOVERNMENT_BOND" }
        ];

        const calculatedCreditScore = calculateCreditScore(demoGoals, demoPortfolio);
        const calculatedHealthScore = calculateFinancialHealth(demoGoals, demoPortfolio);
        
        setCreditScore(calculatedCreditScore);
        setFinancialHealthScore(calculatedHealthScore);
        
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log('Loading dashboard data with token:', token.substring(0, 20) + '...');
        
        // Load investment tips from API
        try {
          const tipsResponse = await apiClient.getInvestmentTips();
          console.log('Investment tips response:', tipsResponse);
          if (tipsResponse.success && tipsResponse.data) {
            setInvestmentTips(Array.isArray(tipsResponse.data) ? tipsResponse.data.slice(0, 4) : []);
          }
        } catch (error: any) {
          console.error('Error loading investment tips:', error);
          // Use demo data on error
          setInvestmentTips([]);
        }

        // Load financial goals
        let loadedGoals: any[] = [];
        try {
          const goalsResponse = await apiClient.getGoals();
          console.log('Goals response:', goalsResponse);
          if (goalsResponse.success && goalsResponse.data) {
            loadedGoals = Array.isArray(goalsResponse.data) ? goalsResponse.data.slice(0, 3) : [];
            setGoals(loadedGoals);
          }
        } catch (error: any) {
          console.error('Error loading goals:', error);
          setGoals([]);
        }

        // Load user portfolio (investment products)
        let loadedPortfolio: any[] = [];
        try {
          const portfolioResponse = await apiClient.getPortfolio();
          console.log('Portfolio response:', portfolioResponse);
          if (portfolioResponse.success && portfolioResponse.data) {
            loadedPortfolio = Array.isArray(portfolioResponse.data) ? portfolioResponse.data : [];
            setUserPortfolio(loadedPortfolio);
          }
        } catch (error: any) {
          console.error('Error loading portfolio:', error);
          setUserPortfolio([]);
        }

        // Calculate real credit score and financial health
        const calculatedCreditScore = calculateCreditScore(loadedGoals, loadedPortfolio);
        const calculatedHealthScore = calculateFinancialHealth(loadedGoals, loadedPortfolio);
        
        setCreditScore(calculatedCreditScore);
        setFinancialHealthScore(calculatedHealthScore);

        // Load chat sessions (recent AI conversations)
        const sessionsResponse = await fetch('/api/ai/sessions', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
        });
        
        if (sessionsResponse.ok) {
          const sessionsData = await sessionsResponse.json();
          if (sessionsData.sessions && Array.isArray(sessionsData.sessions) && sessionsData.sessions.length > 0) {
            // Convert recent session messages to chat format
            const recentSession = sessionsData.sessions[0];
            if (recentSession.messages && recentSession.messages.length > 0) {
              const formattedMessages = recentSession.messages.map((msg: { role: string; content: string; timestamp: string }, index: number) => ({
                id: index + 1,
                type: msg.role === 'assistant' ? 'ai' : 'user',
                message: msg.content,
                time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              }));
              setMessages([...initialChatMessages, ...formattedMessages.slice(-5)]); // Show last 5 messages
            }
          }
        }

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadDashboardData();
    }
  }, [user]);



  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: messages.length + 1,
      type: 'user',
      message: inputMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Call real AI chat API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          message: inputMessage,
          context: 'customer_dashboard',
        }),
      });
      
      if (response.ok) {
        const tdata = await response.json();
        const data=tdata.data;
        const aiResponse: ChatMessage = {
          id: messages.length + 2,
          type: 'ai',
          message: data.response || 'I\'m here to help with your financial questions!',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          tips: data.tips || []
        };
        setMessages(prev => [...prev, aiResponse]);
      } else {
        // Fallback response
        const aiResponse: ChatMessage = {
          id: messages.length + 2,
          type: 'ai',
          message: 'I\'m experiencing some technical difficulties. Please try again in a moment.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, aiResponse]);
      }
    } catch (error) {
      console.error('Error sending message to AI:', error);
      const aiResponse: ChatMessage = {
        id: messages.length + 2,
        type: 'ai',
        message: 'I\'m having trouble connecting right now. Please try again later.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const getCreditScoreColor = (score: number) => {
    if (score >= 750) return 'text-emerald-600';
    if (score >= 650) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCreditScoreLabel = (score: number) => {
    if (score >= 750) return 'Excellent';
    if (score >= 650) return 'Good';
    return 'Fair';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* AI Workbench Launch Button */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">AI Financial Coach</h3>
            <p className="text-purple-100">Get personalized insights and coaching for your financial goals</p>
          </div>
          <Link href="/ai-workbench">
            <button className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2">
              <Brain className="w-5 h-5" />
              <span>Launch Workbench</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-emerald-500 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Good morning, {user?.full_name?.split(' ')[0] || 'there'}! 👋
        </h2>
        <p className="text-blue-100">
          Your financial health score is {financialHealthScore}/100. 
          {financialHealthScore >= 80 ? ' Excellent financial planning!' : 
           financialHealthScore >= 60 ? ' Good progress on your goals!' : 
           ' Let\'s work on improving your financial health together!'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Credit Score Gauge */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Your Financial Health</h3>
            
            {/* Credit Score Circle */}
            <div className="relative w-40 h-40 mx-auto mb-4">
              <svg className="transform -rotate-90 w-40 h-40">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-slate-200"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - creditScore / 900)}`}
                  className={getCreditScoreColor(creditScore)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className={`text-3xl font-bold ${getCreditScoreColor(creditScore)}`}>
                  {creditScore}
                </span>
                <span className="text-sm text-slate-600">Credit Score</span>
              </div>
            </div>

            <div className="text-center">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                creditScore >= 750 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                creditScore >= 650 ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {getCreditScoreLabel(creditScore)}
              </span>
              <p className="text-sm text-slate-600 mt-2">
                Updated 2 minutes ago
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-200">
            <div className="text-center">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mx-auto mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-sm text-slate-600">This Month</p>
              <p className="text-lg font-bold text-slate-800">+5</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-full mx-auto mb-2">
                <Target className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-sm text-slate-600">Goal</p>
              <p className="text-lg font-bold text-slate-800">800</p>
            </div>
          </div>
        </div>

        {/* AI Credit Coach Chat */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800">AI Credit Coach</h3>
            <p className="text-sm text-slate-600">Get personalized financial advice and tips</p>
          </div>
          
          <div className="h-80 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                    message.type === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-100 text-slate-800'
                  }`}>
                    <p className="text-sm">{message.message}</p>
                    
                    {message.tips && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <ul className="space-y-2">
                          {message.tips.map((tip, index) => (
                            <li key={index} className="flex items-start space-x-2 text-sm">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <p className="text-xs opacity-70 mt-2">{message.time}</p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 px-4 py-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-200">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me about improving your credit score, saving tips, or investment advice..."
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personalized Investment Tips */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Personalized Investment Tips</h3>
            <p className="text-sm text-slate-600">Curated opportunities based on your financial profile</p>
          </div>
          <Link href="/investment-tips" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-4 animate-pulse">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
                    <div className="w-16 h-4 bg-slate-200 rounded"></div>
                  </div>
                </div>
                <div className="h-4 bg-slate-200 rounded mb-2"></div>
                <div className="h-3 bg-slate-200 rounded mb-3 w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded mb-4 w-1/2"></div>
                <div className="flex space-x-2">
                  <div className="flex-1 h-8 bg-slate-200 rounded"></div>
                  <div className="w-8 h-8 bg-slate-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : investmentTips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {investmentTips.map((tip) => (
            <div key={tip.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    {tip.category === 'Equity Fund' && <TrendingUp className="w-4 h-4 text-blue-600" />}
                    {tip.category === 'Real Estate' && <Target className="w-4 h-4 text-blue-600" />}
                    {tip.category === 'Mutual Fund' && <DollarSign className="w-4 h-4 text-blue-600" />}
                    {tip.category === 'Bonds' && <Shield className="w-4 h-4 text-blue-600" />}
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded border ${getRiskColor(tip.riskLevel)}`}>
                    {tip.riskLevel}
                  </span>
                </div>
              </div>

              <h4 className="font-semibold text-slate-800 mb-2 line-clamp-2">{tip.title}</h4>
              <p className="text-sm text-slate-600 mb-3 line-clamp-3">{tip.description}</p>
              
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-slate-500">Expected Return</p>
                  <p className="text-sm font-bold text-emerald-600">{tip.expectedReturn}</p>
                </div>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3 h-3 ${
                        star <= 4 ? 'text-yellow-400 fill-current' : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex space-x-2">
                <button className="flex-1 bg-blue-600 text-white text-sm py-2 px-3 rounded hover:bg-blue-700 transition-colors">
                  Learn More
                </button>
                <button className="p-2 border border-slate-300 rounded hover:bg-slate-50 transition-colors">
                  <ExternalLink className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>
          ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">No investment tips available</p>
            <Link 
              href="/investment-tips" 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Explore Investment Options
            </Link>
          </div>
        )}
      </div>

      {/* Portfolio Overview */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Your Investment Portfolio</h3>
            <p className="text-sm text-slate-600">Track your stocks, funds, and investment products</p>
          </div>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
            Add Investment
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-slate-200 rounded mb-2"></div>
                <div className="h-3 bg-slate-200 rounded mb-3 w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded mb-4 w-1/2"></div>
                <div className="flex justify-between">
                  <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : userPortfolio.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userPortfolio.map((investment) => (
              <div key={investment.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      {investment.product_category === 'INDEX_FUND' && <TrendingUp className="w-4 h-4 text-blue-600" />}
                      {investment.product_category === 'REAL_ESTATE' && <Target className="w-4 h-4 text-blue-600" />}
                      {investment.product_category === 'SIP' && <DollarSign className="w-4 h-4 text-blue-600" />}
                      {investment.product_category === 'GOVERNMENT_BOND' && <Shield className="w-4 h-4 text-blue-600" />}
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded border ${getRiskColor(investment.risk_level)}`}>
                      {investment.risk_level}
                    </span>
                  </div>
                </div>

                <h4 className="font-semibold text-slate-800 mb-2">{investment.product_name}</h4>
                <p className="text-sm text-slate-600 mb-3">{investment.description}</p>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">Expected Return</p>
                    <p className="text-sm font-bold text-emerald-600">{investment.expected_return || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Category</p>
                    <p className="text-sm font-medium text-slate-800">
                      {investment.product_category.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">No investments in your portfolio yet</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
              Start Investing
            </button>
          </div>
        )}
      </div>

      {/* Financial Goals Progress */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Your Financial Goals</h3>
          <Link href="/goals" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 bg-slate-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-24"></div>
                  </div>
                  <div className="w-32">
                    <div className="bg-slate-200 rounded-full h-2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : goals.length > 0 ? (
          <div className="space-y-4">
            {goals.map((goal) => {
              const progressPercentage = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
              const formatAmount = (amount: number) => {
                if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
                if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
                if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
                return `₹${amount.toFixed(0)}`;
              };
              
              const getProgressColor = () => {
                return 'bg-blue-600'; // Simplified since FinancialGoal doesn't have category
              };

              return (
                <div key={goal.id} className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-800">{goal.goal_name}</h4>
                    <p className="text-sm text-slate-600">
                      {formatAmount(goal.current_amount)} of {formatAmount(goal.target_amount)}
                    </p>
                  </div>
                  <div className="w-32">
                    <div className="bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getProgressColor()}`} 
                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">No financial goals yet</p>
            <Link 
              href="/goals" 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Set Your First Goal
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
