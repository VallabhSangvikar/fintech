'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  TrendingUp, 
  PieChart, 
  Target, 
  DollarSign, 
  Shield,
  Edit,
  Trash2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import apiClient from '@/services/api-client';

interface PortfolioItem {
  id: number;
  product_name: string;
  product_category: string;
  risk_level: string;
  expected_return?: string;
  description?: string;
  created_at: string;
}

const categoryOptions = [
  { value: 'INDEX_FUND', label: 'Index Fund', icon: TrendingUp },
  { value: 'REAL_ESTATE', label: 'Real Estate', icon: Target },
  { value: 'SIP', label: 'SIP (Mutual Fund)', icon: DollarSign },
  { value: 'GOVERNMENT_BOND', label: 'Government Bond', icon: Shield },
  { value: 'STOCKS', label: 'Individual Stocks', icon: TrendingUp },
  { value: 'GOLD', label: 'Gold', icon: DollarSign },
];

const riskLevelOptions = [
  { value: 'LOW', label: 'Low Risk', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'MEDIUM', label: 'Medium Risk', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'HIGH', label: 'High Risk', color: 'bg-red-100 text-red-700' },
  { value: 'CONSERVATIVE', label: 'Conservative', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'MODERATE', label: 'Moderate', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'AGGRESSIVE', label: 'Aggressive', color: 'bg-red-100 text-red-700' },
];

export default function PortfolioPage() {
  const { user, token } = useAuth();
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [newItem, setNewItem] = useState({
    product_name: '',
    product_category: '',
    risk_level: '',
    expected_return: '',
    description: '',
  });

  useEffect(() => {
    if (token) {
      apiClient.setToken(token);
      loadPortfolio();
    }
  }, [token]);

  const loadPortfolio = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getPortfolio();
      if (response.success && response.data) {
        setPortfolioItems(response.data);
      }
    } catch (error) {
      console.error('Error loading portfolio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.product_name || !newItem.product_category || !newItem.risk_level) {
      return;
    }

    try {
      setIsAddingItem(true);
      const response = await apiClient.addToPortfolio(newItem);
      
      if (response.success) {
        setPortfolioItems([response.data, ...portfolioItems]);
        setNewItem({
          product_name: '',
          product_category: '',
          risk_level: '',
          expected_return: '',
          description: '',
        });
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error('Error adding portfolio item:', error);
    } finally {
      setIsAddingItem(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const option = categoryOptions.find(opt => opt.value === category);
    if (!option) return <PieChart className="w-4 h-4" />;
    const IconComponent = option.icon;
    return <IconComponent className="w-4 h-4" />;
  };

  const getRiskColor = (riskLevel: string) => {
    const option = riskLevelOptions.find(opt => opt.value === riskLevel);
    return option?.color || 'bg-slate-100 text-slate-700';
  };

  const calculatePortfolioStats = () => {
    const totalItems = portfolioItems.length;
    const riskDistribution = portfolioItems.reduce((acc, item) => {
      acc[item.risk_level] = (acc[item.risk_level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalItems,
      riskDistribution,
      categories: [...new Set(portfolioItems.map(item => item.product_category))].length,
    };
  };

  const stats = calculatePortfolioStats();

  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="portfolio">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">My Portfolio</h1>
              <p className="text-slate-600 mt-1">Track and manage your investment portfolio</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Investment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Investment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="product_name">Investment Name *</Label>
                    <Input
                      id="product_name"
                      value={newItem.product_name}
                      onChange={(e) => setNewItem({...newItem, product_name: e.target.value})}
                      placeholder="e.g., Nifty 50 Index Fund"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="product_category">Category *</Label>
                    <Select value={newItem.product_category} onValueChange={(value) => setNewItem({...newItem, product_category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select investment type" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="risk_level">Risk Level *</Label>
                    <Select value={newItem.risk_level} onValueChange={(value) => setNewItem({...newItem, risk_level: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select risk level" />
                      </SelectTrigger>
                      <SelectContent>
                        {riskLevelOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expected_return">Expected Return (%)</Label>
                    <Input
                      id="expected_return"
                      value={newItem.expected_return}
                      onChange={(e) => setNewItem({...newItem, expected_return: e.target.value})}
                      placeholder="e.g., 12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Notes</Label>
                    <Textarea
                      id="description"
                      value={newItem.description}
                      onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                      placeholder="Any additional notes about this investment"
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddItem}
                    disabled={isAddingItem || !newItem.product_name || !newItem.product_category || !newItem.risk_level}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isAddingItem ? 'Adding...' : 'Add Investment'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Portfolio Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <PieChart className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-slate-600">Total Investments</span>
                </div>
                <p className="text-2xl font-bold text-slate-800 mt-2">{stats.totalItems}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium text-slate-600">Categories</span>
                </div>
                <p className="text-2xl font-bold text-slate-800 mt-2">{stats.categories}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium text-slate-600">Low Risk</span>
                </div>
                <p className="text-2xl font-bold text-slate-800 mt-2">{stats.riskDistribution.LOW || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-slate-600">High Risk</span>
                </div>
                <p className="text-2xl font-bold text-slate-800 mt-2">{stats.riskDistribution.HIGH || 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Portfolio Items */}
          <Card>
            <CardHeader>
              <CardTitle>Your Investments</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-4 p-4 border border-slate-200 rounded-lg">
                      <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                      </div>
                      <div className="w-20 h-6 bg-slate-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : portfolioItems.length === 0 ? (
                <div className="text-center py-12">
                  <PieChart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">No investments yet</h3>
                  <p className="text-slate-600 mb-6">Start building your portfolio by adding your first investment</p>
                  <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Investment
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {portfolioItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                          {getCategoryIcon(item.product_category)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800">{item.product_name}</h3>
                          <p className="text-sm text-slate-600">
                            {categoryOptions.find(opt => opt.value === item.product_category)?.label || item.product_category}
                          </p>
                          {item.description && (
                            <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {item.expected_return && (
                          <div className="text-right">
                            <p className="text-sm font-medium text-slate-800">{item.expected_return}%</p>
                            <p className="text-xs text-slate-500">Expected Return</p>
                          </div>
                        )}
                        <Badge className={getRiskColor(item.risk_level)}>
                          {riskLevelOptions.find(opt => opt.value === item.risk_level)?.label || item.risk_level}
                        </Badge>
                        <div className="text-xs text-slate-500">
                          Added {new Date(item.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}