'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import ReactMarkdown from 'react-markdown';
import { 
  Brain,
  MessageSquare,
  PaperclipIcon,
  Send,
  ChevronLeft,
  ChevronRight,
  Pin,
  X,
  RefreshCw,
  TrendingUp,
  BarChart3,
  DollarSign,
  Users,
  Shield,
  FileText,
  ExternalLink,
  Maximize2,
  Minimize2,
  BookOpen,
  CheckCircle
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const getUserRole = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userRole') || 'customer';
  }
  return 'customer';
};

interface ChatMessage {
  id: number;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  widgets?: string[];
  // Enhanced data for financial reports
  companies?: string[];
  final_report?: string;
  analysis_messages?: string[];
  report_type?: 'financial_analysis' | 'standard';
}

interface ConversationHistory {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messageCount: number;
  // Add the raw date for sorting
  rawTimestamp: Date;
}

interface Widget {
  id: string;
  type: 'stock-chart' | 'metrics-table' | 'news-feed' | 'risk-gauge' | 'compliance-checklist' | 'credit-simulator';
  title: string;
  pinned: boolean;
  data?: any;
}

// Sample initial messages for different personas
const getInitialMessages = (userRole: string): ChatMessage[] => {
  const baseMessage = {
    id: 1,
    type: 'ai' as const,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  switch (userRole) {
    case 'investment':
      return [{
        ...baseMessage,
        content: 'Welcome to your AI Workbench! I\'m here to help you analyze portfolios, assess market risks, and generate insights. What would you like to explore today?'
      }];
    case 'bank':
      return [{
        ...baseMessage,
        content: 'Welcome to your AI Workbench! I can help you analyze loan documents, detect fraud patterns, and ensure compliance. What can I assist you with?'
      }];
    default:
      return [{
        ...baseMessage,
        content: 'Welcome to your AI Workbench! I\'m your personal financial AI assistant. I can help with credit analysis, investment planning, and financial goal tracking. How can I help you today?'
      }];
  }
};

// Sample stock data for widget
const stockData = [
  { name: 'Jan', value: 2840 },
  { name: 'Feb', value: 2950 },
  { name: 'Mar', value: 2720 },
  { name: 'Apr', value: 3100 },
  { name: 'May', value: 3350 },
  { name: 'Jun', value: 3200 }
];

// Function to parse and render markdown-like content from LLM
const parseReportContent = (content: string) => {
  const lines = content.split('\n');
  const parsed = [];
  let currentSection = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) continue; // Skip empty lines
    
    // Main headers (## Title)
    if (line.startsWith('## ')) {
      parsed.push({
        type: 'main_header',
        content: line.replace('## ', '').trim()
      });
    }
    // Section headers (**1. Section Name:**)
    else if (/^\*\*\d+\.\s/.test(line) && line.endsWith(':**')) {
      parsed.push({
        type: 'section_header',
        content: line.replace(/^\*\*/, '').replace(/:\*\*$/, '').trim()
      });
    }
    // Bold metadata (**Key:** value)
    else if (/^\*\*[^*]+:\*\*/.test(line)) {
      const [, key, value] = line.match(/^\*\*([^*]+):\*\*\s*(.*)$/) || [];
      if (key && value) {
        parsed.push({
          type: 'metadata',
          key: key.trim(),
          value: value.trim()
        });
      }
    }
    // Bullet points with metrics (*   **Metric:** value - description)
    else if (line.startsWith('*   **') && line.includes(':**')) {
      const metricMatch = line.match(/^\*\s+\*\*([^*]+):\*\*\s*([^-]+)(?:\s*-\s*(.+))?/);
      if (metricMatch) {
        const [, metric, value, description] = metricMatch;
        parsed.push({
          type: 'financial_metric',
          metric: metric.trim(),
          value: value.trim(),
          description: description ? description.trim() : ''
        });
      }
    }
    // Regular bullet points (*   Content)
    else if (line.startsWith('*   ')) {
      parsed.push({
        type: 'bullet_point',
        content: line.replace(/^\*\s+/, '').trim()
      });
    }
    // Regular paragraphs
    else if (line.length > 0) {
      parsed.push({
        type: 'paragraph',
        content: line
      });
    }
  }
  
  return parsed;
};

// Function to extract key metrics from financial report
const extractKeyMetrics = (content: string) => {
  const metrics = [];
  
  // Enhanced regex patterns to match the LLM output format
  const patterns = {
    pe: /\*\s+\*\*P\/E Ratio:\*\*\s*([\d.]+)/i,
    profit: /\*\s+\*\*Profit Margin:\*\*\s*([\d.]+)%/i,
    roe: /\*\s+\*\*Return on Equity[^*]*:\*\*\s*([\d.]+)%/i,
    debt: /\*\s+\*\*Debt-to-Equity:\*\*\s*([\d.]+)/i,
    current: /\*\s+\*\*Current Ratio:\*\*\s*([\d.]+)/i
  };
  
  const peMatch = content.match(patterns.pe);
  const profitMatch = content.match(patterns.profit);
  const roeMatch = content.match(patterns.roe);
  const debtMatch = content.match(patterns.debt);
  const currentMatch = content.match(patterns.current);
  
  if (peMatch) {
    const value = parseFloat(peMatch[1]);
    metrics.push({ 
      label: 'P/E Ratio', 
      value: peMatch[1], 
      type: value > 30 ? 'negative' : value > 20 ? 'neutral' : 'positive'
    });
  }
  
  if (profitMatch) {
    const value = parseFloat(profitMatch[1]);
    metrics.push({ 
      label: 'Profit Margin', 
      value: profitMatch[1] + '%', 
      type: value > 15 ? 'positive' : value > 10 ? 'neutral' : 'negative'
    });
  }
  
  if (roeMatch) {
    const value = parseFloat(roeMatch[1]);
    metrics.push({ 
      label: 'ROE', 
      value: roeMatch[1] + '%', 
      type: value > 100 ? 'neutral' : value > 15 ? 'positive' : 'negative'  // Very high ROE might be unusual
    });
  }
  
  if (debtMatch) {
    const value = parseFloat(debtMatch[1]);
    metrics.push({ 
      label: 'Debt-to-Equity', 
      value: debtMatch[1], 
      type: value > 100 ? 'negative' : value > 50 ? 'neutral' : 'positive'
    });
  }
  
  if (currentMatch) {
    const value = parseFloat(currentMatch[1]);
    metrics.push({ 
      label: 'Current Ratio', 
      value: currentMatch[1], 
      type: value >= 1 ? 'positive' : 'negative'
    });
  }
  
  return metrics;
};

export default function AIWorkbenchPage() {
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => getInitialMessages(getUserRole()));
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [activeContext, setActiveContext] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationHistory[]>([]);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/ai/sessions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched conversations:', data);
        if (data.success && Array.isArray(data.data.sessions)) {
          const mappedConversations = data.data.sessions.map((session: any) => ({
            id: session.sessionId,
            title: session.sessionTitle || 'Untitled Conversation',
            lastMessage: session.lastMessage || 'No messages yet.',
            timestamp: new Date(session.lastUpdatedAt).toLocaleString(),
            messageCount: session.messageCount || 0,
            rawTimestamp: new Date(session.createdAt),
          })).sort((a: ConversationHistory, b: ConversationHistory) => b.rawTimestamp.getTime() - a.rawTimestamp.getTime()); // Sort by most recent
          
          setConversations(mappedConversations);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now(), // Use a unique ID
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    try {
      // Make real API call to chat endpoint
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          message: currentInput,
          context: 'workbench',
          userRole: getUserRole(),
          sessionId: activeConversation || undefined
        }),
      });

      if (response.ok) {
        const data = await response.json();  
        // Handle response - simplified approach
        
        // The API response is nested in the `data` property
        const analysisData = data.data;
        
        if (!analysisData) {
          throw new Error("Response from API is missing the 'data' object.");
        }
        
        // Always update the active conversation ID with the one from the backend
        if (analysisData.sessionId) {
          setActiveConversation(analysisData.sessionId);
        }
        
        // Get the actual response content (try multiple sources)
        let responseContent = analysisData.final_report || 
                            analysisData.response ||
                            'I apologize, but I encountered an issue processing your request.';
        
        console.log('📝 Using response content:', responseContent.substring(0, 300) + '...');
        
        // Check if we have financial analysis data
        const hasFinancialData = analysisData.success && analysisData.final_report;
        
        const aiMessage: ChatMessage = {
          id: Date.now(), // Use a unique ID
          type: 'ai',
          content: responseContent,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          companies: analysisData.companies || [],
          final_report: analysisData.final_report,
          analysis_messages: analysisData.messages || [],
          report_type: hasFinancialData ? 'financial_analysis' : 'standard',
          widgets: determineWidgets(currentInput, getUserRole())
        };
       
        setMessages(prev => [...prev, aiMessage]);
      } else {
        // Fallback to mock response on API failure
        const aiMessage: ChatMessage = {
          id: Date.now(), // Use a unique ID
          type: 'ai',
          content: getAIResponse(currentInput, getUserRole()),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          widgets: determineWidgets(currentInput, getUserRole())
        };

        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Fallback to mock response on error
      const aiMessage: ChatMessage = {
        id: Date.now(), // Use a unique ID
        type: 'ai',
        content: getAIResponse(currentInput, getUserRole()),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        widgets: determineWidgets(currentInput, getUserRole())
      };

      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsTyping(false);
      // Refresh conversation list after sending a message
      fetchConversations();
    }
  };

  const getAIResponse = (input: string, role: string): string => {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('portfolio') && role === 'investment') {
      return 'I\'ve analyzed your current portfolio allocation. Your tech sector exposure is at 35%, which is above your target range. I\'m displaying a detailed breakdown in the metrics widget. Consider rebalancing towards healthcare and consumer staples for better diversification.';
    }
    
    if (lowerInput.includes('fraud') && role === 'bank') {
      return 'I\'ve detected 3 high-risk transactions in the past 24 hours. The risk assessment shows patterns consistent with card-not-present fraud. I\'ve loaded the risk gauge and transaction details for your review. Should I flag these for manual investigation?';
    }
    
    if (lowerInput.includes('credit') || lowerInput.includes('score')) {
      return 'Based on your current credit profile, I can see opportunities for improvement. Your utilization ratio is currently affecting your score. I\'ve loaded the credit simulator so you can explore different scenarios and their potential impact.';
    }

    if (lowerInput.includes('tesla') || lowerInput.includes('stock')) {
      return 'Tesla (TSLA) is currently trading with high volatility. The P/E ratio of 65.2 suggests premium valuation. I\'ve pulled up the live chart and key metrics. Recent earnings showed strong growth in energy storage division. Would you like me to compare with other EV manufacturers?';
    }

    // Generic response
    return 'I understand you\'re looking for analysis on this topic. Let me gather the relevant data and insights for you. I\'ll display the most pertinent information in the widget panel to give you a comprehensive view.';
  };

  const determineWidgets = (input: string, role: string): string[] => {
    const lowerInput = input.toLowerCase();
    const widgets: string[] = [];

    if (lowerInput.includes('stock') || lowerInput.includes('tesla')) {
      widgets.push('stock-chart', 'metrics-table');
    }
    
    if (lowerInput.includes('portfolio') && role === 'investment') {
      widgets.push('metrics-table', 'news-feed');
    }
    
    if (lowerInput.includes('fraud') && role === 'bank') {
      widgets.push('risk-gauge', 'compliance-checklist');
    }
    
    if (lowerInput.includes('credit') || lowerInput.includes('score')) {
      widgets.push('credit-simulator');
    }

    if (lowerInput.includes('news') || lowerInput.includes('market')) {
      widgets.push('news-feed');
    }

    return widgets;
  };

  const addWidget = (type: string) => {
    const widget: Widget = {
      id: `${type}-${Date.now()}`,
      type: type as any,
      title: getWidgetTitle(type),
      pinned: false,
      data: getWidgetData(type)
    };

    setWidgets(prev => {
      // Remove existing widget of same type if not pinned
      const filtered = prev.filter(w => w.type !== type || w.pinned);
      return [...filtered, widget];
    });
  };

  const getWidgetTitle = (type: string): string => {
    switch (type) {
      case 'stock-chart': return 'Live Stock Chart';
      case 'metrics-table': return 'Key Metrics';
      case 'news-feed': return 'Market News';
      case 'risk-gauge': return 'Risk Assessment';
      case 'compliance-checklist': return 'Compliance Check';
      case 'credit-simulator': return 'Credit Score Simulator';
      default: return 'Analysis Widget';
    }
  };

  const getWidgetData = (type: string) => {
    switch (type) {
      case 'stock-chart':
        return { chartData: stockData, symbol: 'TSLA', price: '$264.50', change: '+2.3%' };
      case 'metrics-table':
        return {
          metrics: [
            { label: 'P/E Ratio', value: '65.2', change: '+2.1%' },
            { label: 'Market Cap', value: '$841B', change: '+1.8%' },
            { label: '52W High', value: '$299.29', change: '-11.6%' },
            { label: 'Volume', value: '24.3M', change: '+15.2%' }
          ]
        };
      case 'news-feed':
        return {
          news: [
            { title: 'Tesla Reports Strong Q3 Earnings', time: '2h ago', source: 'Reuters' },
            { title: 'EV Market Share Grows 25% YoY', time: '4h ago', source: 'Bloomberg' },
            { title: 'Automotive Sector Outlook 2025', time: '6h ago', source: 'Financial Times' }
          ]
        };
      case 'risk-gauge':
        return { riskScore: 87, level: 'High', factors: ['Unusual transaction pattern', 'Geographic anomaly', 'Time-based irregularity'] };
      case 'compliance-checklist':
        return {
          items: [
            { name: 'KYC Verification', status: 'complete' },
            { name: 'AML Screening', status: 'complete' },
            { name: 'Risk Assessment', status: 'pending' },
            { name: 'Documentation', status: 'complete' }
          ]
        };
      case 'credit-simulator':
        return { currentScore: 742, factors: ['Payment History', 'Credit Utilization', 'Account Age'] };
      default:
        return {};
    }
  };

  const togglePinWidget = (id: string) => {
    setWidgets(prev => 
      prev.map(w => w.id === id ? { ...w, pinned: !w.pinned } : w)
    );
  };

  const removeWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
  };

  const loadConversation = async (conversationId: string) => {
    setActiveConversation(conversationId);
    
    try {
      // Load conversation from API
      const response = await fetch(`/api/ai/sessions?sessionId=${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.conversationHistory) {
          const conversationHistory = data.data.conversationHistory.map((msg: any, index: number) => ({
            id: index + 1,
            type: msg.role === 'user' ? 'user' : 'ai',
            content: msg.content,
            timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            // Handle financial analysis data
            ...(msg.financial_analysis && {
              companies: msg.financial_analysis.companies,
              final_report: msg.financial_analysis.final_report,
              analysis_messages: msg.financial_analysis.analysis_messages,
              report_type: 'financial_analysis'
            }),
            // Handle regular AI messages
            ...(!msg.financial_analysis && msg.role === 'ai' && {
              report_type: 'standard'
            })
          }));
          
          setMessages(conversationHistory);
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case 'stock-chart':
        return (
          <Card key={widget.id} className="mb-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePinWidget(widget.id)}
                  className={`p-1 ${widget.pinned ? 'text-blue-600' : 'text-slate-400'}`}
                >
                  <Pin className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeWidget(widget.id)}
                  className="p-1 text-slate-400 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-lg font-bold">{widget.data.symbol}</span>
                  <span className="text-xl font-bold ml-2">{widget.data.price}</span>
                </div>
                <Badge className="bg-green-100 text-green-800">{widget.data.change}</Badge>
              </div>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={widget.data.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        );

      case 'metrics-table':
        return (
          <Card key={widget.id} className="mb-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePinWidget(widget.id)}
                  className={`p-1 ${widget.pinned ? 'text-blue-600' : 'text-slate-400'}`}
                >
                  <Pin className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeWidget(widget.id)}
                  className="p-1 text-slate-400 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-2">
                {widget.data.metrics.map((metric: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{metric.label}</span>
                    <div className="text-right">
                      <span className="font-medium">{metric.value}</span>
                      <span className={`text-xs ml-1 ${metric.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {metric.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 'news-feed':
        return (
          <Card key={widget.id} className="mb-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
              <div className="flex items-center space-x-1">
                <RefreshCw className="w-3 h-3 text-slate-400 cursor-pointer hover:text-blue-600" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePinWidget(widget.id)}
                  className={`p-1 ${widget.pinned ? 'text-blue-600' : 'text-slate-400'}`}
                >
                  <Pin className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeWidget(widget.id)}
                  className="p-1 text-slate-400 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-3">
                {widget.data.news.map((item: any, index: number) => (
                  <div key={index} className="border-b border-slate-100 pb-2 last:border-b-0">
                    <h4 className="text-sm font-medium text-slate-800 mb-1">{item.title}</h4>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{item.source}</span>
                      <span>{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 'risk-gauge':
        return (
          <Card key={widget.id} className="mb-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePinWidget(widget.id)}
                  className={`p-1 ${widget.pinned ? 'text-blue-600' : 'text-slate-400'}`}
                >
                  <Pin className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeWidget(widget.id)}
                  className="p-1 text-slate-400 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-red-600">{widget.data.riskScore}</div>
                <div className="text-sm text-slate-600">{widget.data.level} Risk</div>
              </div>
              <div className="space-y-1">
                {widget.data.factors.map((factor: string, index: number) => (
                  <div key={index} className="text-xs text-slate-600 flex items-center">
                    <div className="w-1 h-1 bg-red-500 rounded-full mr-2"></div>
                    {factor}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 'credit-simulator':
        return (
          <Card key={widget.id} className="mb-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePinWidget(widget.id)}
                  className={`p-1 ${widget.pinned ? 'text-blue-600' : 'text-slate-400'}`}
                >
                  <Pin className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeWidget(widget.id)}
                  className="p-1 text-slate-400 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-green-600">{widget.data.currentScore}</div>
                <div className="text-sm text-slate-600">Current Score</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Pay off credit card</span>
                  <span className="text-green-600">+15 pts</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Reduce utilization to 10%</span>
                  <span className="text-green-600">+8 pts</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="ai-workbench">
      <div className="h-screen flex bg-slate-50">
        {/* Left Panel - Context & History */}
        <div className={`${leftPanelCollapsed ? 'w-12' : 'w-80'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col`}>
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            {!leftPanelCollapsed && <h2 className="font-semibold text-slate-800">Context & History</h2>}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
            >
              {leftPanelCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>

          {!leftPanelCollapsed && (
            <div className="flex-1 overflow-y-auto">
              {/* Active Context */}
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Active Context</h3>
                {activeContext ? (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-800">{activeContext}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No active context</p>
                )}
              </div>

              {/* Conversation History */}
              <div className="p-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Recent Conversations</h3>
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => loadConversation(conv.id)}
                      className={`w-full text-left p-3 rounded-lg hover:bg-slate-50 transition-colors ${
                        activeConversation === conv.id ? 'bg-blue-50 border border-blue-200' : ''
                      }`}
                    >
                      <h4 className="text-sm font-medium text-slate-800 truncate">{conv.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 truncate">{conv.lastMessage}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-slate-400">{conv.timestamp}</span>
                        <Badge variant="secondary" className="text-xs">{conv.messageCount}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Knowledge Base */}
              <div className="p-4 border-t border-slate-200">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Knowledge Base</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 p-2 rounded hover:bg-slate-50 cursor-pointer">
                    <BookOpen className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600">Market Analysis Guidelines</span>
                  </div>
                  <div className="flex items-center space-x-2 p-2 rounded hover:bg-slate-50 cursor-pointer">
                    <BookOpen className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600">Risk Assessment Framework</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Center Panel - Chat Interface */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-white border-b">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-800">AI Workbench</h2>
                <p className="text-sm text-slate-500">Your intelligent financial command center</p>
              </div>
            </div>
            <div className="flex items-center">
              <Button variant="outline" size="icon" onClick={() => setRightPanelCollapsed(prev => !prev)} className="mr-2">
                {rightPanelCollapsed ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
              </Button>
              <Button onClick={handleSendMessage} disabled={isTyping}>
                {isTyping ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
          
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-2xl rounded-lg p-4 ${msg.type === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-slate-800 shadow-sm border border-slate-200'}`}>
                  {msg.type === 'ai' ? (
                    <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:my-2 prose-ul:my-2 prose-li:my-1 prose-table:text-sm">
                      <ReactMarkdown
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-2 text-blue-700" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-lg font-semibold mb-2 mt-3 text-blue-600" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-base font-semibold mb-1 mt-2 text-blue-500" {...props} />,
                          p: ({node, ...props}) => <p className="my-2 leading-relaxed" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />,
                          li: ({node, ...props}) => <li className="my-1" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-semibold text-slate-900" {...props} />,
                          em: ({node, ...props}) => <em className="italic text-slate-700" {...props} />,
                          table: ({node, ...props}) => <div className="overflow-x-auto my-3"><table className="min-w-full divide-y divide-slate-200 border" {...props} /></div>,
                          thead: ({node, ...props}) => <thead className="bg-slate-50" {...props} />,
                          tbody: ({node, ...props}) => <tbody className="divide-y divide-slate-200" {...props} />,
                          tr: ({node, ...props}) => <tr {...props} />,
                          th: ({node, ...props}) => <th className="px-3 py-2 text-left text-xs font-medium text-slate-700 uppercase tracking-wider" {...props} />,
                          td: ({node, ...props}) => <td className="px-3 py-2 text-sm" {...props} />,
                          code: ({node, inline, ...props}: any) => 
                            inline ? 
                              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono text-slate-800" {...props} /> :
                              <code className="block bg-slate-100 p-3 rounded-lg text-sm font-mono overflow-x-auto my-2" {...props} />,
                          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-400 pl-4 italic text-slate-600 my-2" {...props} />
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Message input */}
          <div className="p-4 bg-white border-t">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <PaperclipIcon className="w-4 h-4" />
              </Button>
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything about your financial data..."
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={!inputMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Right panel - Widgets */}
        <div className={`flex flex-col bg-white border-l transition-width duration-300 ${rightPanelCollapsed ? 'w-16' : 'w-64'}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className={`text-lg font-semibold transition-opacity duration-300 ${rightPanelCollapsed ? 'opacity-0' : 'opacity-100'}`}>Analysis Widgets</h2>
            <Button variant="outline" size="icon" onClick={() => setRightPanelCollapsed(prev => !prev)}>
              {rightPanelCollapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </Button>
          </div>
          
          {/* Widget list - Collapsible */}
          <div className={`flex-1 overflow-y-auto transition-opacity duration-300 ${rightPanelCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="p-4">
              {widgets.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-sm text-slate-500">Analysis widgets will appear here as you chat with the AI</p>
                </div>
              ) : (
                <div>
                  {widgets.map(widget => renderWidget(widget))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
    </ProtectedRoute>
  );
}
