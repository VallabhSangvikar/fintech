'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Paperclip, TrendingUp, TrendingDown, DollarSign, Users, ExternalLink, Brain } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

const portfolioData = [
  { month: 'Jan', value: 85000 },
  { month: 'Feb', value: 87500 },
  { month: 'Mar', value: 82000 },
  { month: 'Apr', value: 91000 },
  { month: 'May', value: 95000 },
  { month: 'Jun', value: 98500 },
];

const newsItems = [
  {
    id: 1,
    title: 'Indian Markets Show Strong Q2 Performance',
    summary: 'Nifty 50 gains 8.5% in second quarter driven by IT and banking sector growth',
    time: '2h ago',
    source: 'Economic Times'
  },
  {
    id: 2,
    title: 'RBI Maintains Repo Rate at 6.5%',
    summary: 'Central bank keeps rates unchanged amid inflation concerns',
    time: '4h ago',
    source: 'Business Standard'
  },
  {
    id: 3,
    title: 'Foreign Investment Inflows Hit ₹2.1L Crores',
    summary: 'FPI investments show positive momentum in equity markets',
    time: '6h ago',
    source: 'Mint'
  },
];

interface ChatMessage {
  id: number;
  type: 'ai' | 'user';
  message: string;
  time: string;
  sources?: { id: number; title: string }[];
}

const chatMessages: ChatMessage[] = [
  {
    id: 1,
    type: 'ai',
    message: 'Hello! I\'m your AI Investment Co-Pilot. How can I help you analyze your portfolio today?',
    time: '09:00 AM',
  },
];

export default function InvestmentDashboard() {
  const { user } = useAuth();
  const [messages, setMessages] = useState(chatMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [portfolioData, setPortfolioData] = useState([
    { month: 'Jan', value: 85000 },
    { month: 'Feb', value: 87500 },
    { month: 'Mar', value: 82000 },
    { month: 'Apr', value: 91000 },
    { month: 'May', value: 95000 },
    { month: 'Jun', value: 98500 },
  ]);
  const [newsItems, setNewsItems] = useState([
    {
      id: 1,
      title: 'Indian Markets Show Strong Q2 Performance',
      summary: 'Nifty 50 gains 8.5% in second quarter driven by IT and banking sector growth',
      time: '2h ago',
      source: 'Economic Times'
    },
    {
      id: 2,
      title: 'RBI Maintains Repo Rate at 6.5%',
      summary: 'Central bank keeps rates unchanged amid inflation concerns',
      time: '4h ago',
      source: 'Business Standard'
    },
    {
      id: 3,
      title: 'Foreign Investment Inflows Hit ₹2.1L Crores',
      summary: 'FPI investments show positive momentum in equity markets',
      time: '6h ago',
      source: 'Mint'
    },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  // Load real data from APIs
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Load recent AI sessions for this organization
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
                sources: msg.role === 'assistant' ? [
                  { id: 1, title: 'Market Analysis Report' },
                  { id: 2, title: 'Portfolio Performance Data' }
                ] : undefined
              }));
              setMessages([...chatMessages, ...formattedMessages.slice(-5)]); // Show last 5 messages
            }
          }
        }

        // Note: Portfolio and news data could be loaded from additional APIs here
        // For now keeping mock data but structured for easy API integration

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
      // Call real AI chat API with investment context
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          message: inputMessage,
          context: 'investment_dashboard',
          organizationType: user?.organizationType,
        }),
      });

      if (response.ok) {
        const data1 = await response.json();
        console.log('AI Response:', data1);
        const data=data1.data;
        const aiResponse: ChatMessage = {
          id: messages.length + 2,
          type: 'ai',
          message: data.response || 'I\'m here to help with your investment analysis!',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources: data.sources || [
            { id: 1, title: 'Market Analysis Report' },
            { id: 2, title: 'Portfolio Performance Data' }
          ]
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

  const handleSourceClick = (sourceId: number) => {
    // In real app, this would open the source document
    alert(`Opening source document ${sourceId}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* AI Workbench Launch Button */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">AI Workbench</h3>
            <p className="text-blue-100">Advanced analysis with intelligent widgets and contextual insights</p>
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
              <p className="text-sm text-slate-600">Total Portfolio Value</p>
              <p className="text-2xl font-bold text-slate-800">₹98.5L</p>
              <p className="text-sm text-emerald-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                +12.5% this quarter
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Active Investments</p>
              <p className="text-2xl font-bold text-slate-800">24</p>
              <p className="text-sm text-slate-500 mt-1">
                Across 8 sectors
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Monthly Returns</p>
              <p className="text-2xl font-bold text-slate-800">8.2%</p>
              <p className="text-sm text-emerald-600 flex items-center mt-1">
                <TrendingUp className="w-4 h-4 mr-1" />
                Above benchmark
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Risk Score</p>
              <p className="text-2xl font-bold text-slate-800">6.8/10</p>
              <p className="text-sm text-yellow-600 mt-1">
                Moderate Risk
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Co-Pilot Chat */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800">AI Investment Co-Pilot</h3>
            <p className="text-sm text-slate-600">Get intelligent insights about your portfolio</p>
          </div>
          
          <div className="h-96 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.type === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-100 text-slate-800'
                  }`}>
                    <p className="text-sm">{message.message}</p>
                    {message.type === 'ai' && message.sources && (
                      <div className="mt-2 pt-2 border-t border-slate-200">
                        <p className="text-xs text-slate-500 mb-1">Sources:</p>
                        {message.sources.map((source: any) => (
                          <button
                            key={source.id}
                            onClick={() => handleSourceClick(source.id)}
                            className="text-xs text-blue-600 hover:text-blue-700 underline block"
                          >
                            [{source.id}] {source.title}
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="text-xs opacity-70 mt-1">{message.time}</p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 px-4 py-2 rounded-lg">
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
                <button className="p-2 text-slate-400 hover:text-slate-600">
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me about your portfolio, market trends, or investment strategies..."
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

        {/* Market News Feed */}
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800">Market News</h3>
            <p className="text-sm text-slate-600">Latest financial updates</p>
          </div>
          
          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {newsItems.map((news) => (
              <div key={news.id} className="pb-4 border-b border-slate-100 last:border-b-0">
                <h4 className="text-sm font-medium text-slate-800 mb-2 line-clamp-2">
                  {news.title}
                </h4>
                <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                  {news.summary}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{news.source}</span>
                  <span>{news.time}</span>
                </div>
              </div>
            ))}
            <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center py-2">
              View All News
              <ExternalLink className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Portfolio Performance Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Portfolio Performance</h3>
            <p className="text-sm text-slate-600">6-month performance overview</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span className="text-sm text-slate-600">Portfolio Value</span>
            </div>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={portfolioData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis 
                stroke="#64748b" 
                fontSize={12}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Portfolio Value']}
                labelStyle={{ color: '#64748b' }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#2563eb" 
                strokeWidth={3}
                dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
