'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Target, Plus, Edit2, Trash2, Calendar, IndianRupee, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface FinancialGoal {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: 'retirement' | 'education' | 'home' | 'car' | 'travel' | 'emergency' | 'investment' | 'other';
  priority: 'high' | 'medium' | 'low';
  status: 'not-started' | 'in-progress' | 'completed';
  monthlyContribution: number;
  createdAt: string;
}

export default function GoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetAmount: '',
    currentAmount: '0',
    targetDate: '',
    category: 'other' as FinancialGoal['category'],
    priority: 'medium' as FinancialGoal['priority'],
    monthlyContribution: ''
  });

  // Load goals from API
  const loadGoals = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/goals', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.goals && Array.isArray(data.goals)) {
          setGoals(data.goals);
        }
      } else {
        console.error('Failed to load goals:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadGoals();
    }
  }, [user]);

  const categoryColors = {
    'retirement': 'bg-purple-100 text-purple-800',
    'education': 'bg-blue-100 text-blue-800',
    'home': 'bg-green-100 text-green-800',
    'car': 'bg-orange-100 text-orange-800',
    'travel': 'bg-pink-100 text-pink-800',
    'emergency': 'bg-red-100 text-red-800',
    'investment': 'bg-indigo-100 text-indigo-800',
    'other': 'bg-gray-100 text-gray-800'
  };

  const priorityColors = {
    'high': 'bg-red-100 text-red-700',
    'medium': 'bg-yellow-100 text-yellow-700',
    'low': 'bg-green-100 text-green-700'
  };

  const statusColors = {
    'not-started': 'bg-gray-100 text-gray-700',
    'in-progress': 'bg-blue-100 text-blue-700',
    'completed': 'bg-green-100 text-green-700'
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const calculateMonthsRemaining = (targetDate: string) => {
    const now = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - now.getTime();
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return Math.max(0, diffMonths);
  };

  const handleCreateGoal = async () => {
    try {
      const goalData = {
        title: newGoal.title,
        description: newGoal.description,
        target_amount: parseFloat(newGoal.targetAmount),
        current_amount: parseFloat(newGoal.currentAmount) || 0,
        target_date: newGoal.targetDate,
        category: newGoal.category,
        priority: newGoal.priority,
        monthly_contribution: parseFloat(newGoal.monthlyContribution) || 0,
      };

      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(goalData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.goal) {
          // Add the new goal to the list
          setGoals(prev => [...prev, data.goal]);
          setIsCreateModalOpen(false);
          resetForm();
        }
      } else {
        alert('Failed to create goal. Please try again.');
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      alert('Failed to create goal. Please try again.');
    }
  };

  const handleEditGoal = (goal: FinancialGoal) => {
    setEditingGoal(goal);
    setNewGoal({
      title: goal.title,
      description: goal.description,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      targetDate: goal.targetDate,
      category: goal.category,
      priority: goal.priority,
      monthlyContribution: goal.monthlyContribution.toString()
    });
    setIsCreateModalOpen(true);
  };

  const handleUpdateGoal = async () => {
    if (!editingGoal) return;
    
    try {
      const currentAmount = parseFloat(newGoal.currentAmount) || 0;
      const targetAmount = parseFloat(newGoal.targetAmount);
      
      let status: FinancialGoal['status'] = 'not-started';
      if (currentAmount >= targetAmount) {
        status = 'completed';
      } else if (currentAmount > 0) {
        status = 'in-progress';
      }

      const response = await fetch(`/api/goals/${editingGoal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newGoal.title,
          description: newGoal.description,
          targetAmount: targetAmount,
          currentAmount: currentAmount,
          targetDate: newGoal.targetDate,
          category: newGoal.category,
          priority: newGoal.priority,
          monthlyContribution: parseFloat(newGoal.monthlyContribution) || 0,
          status: status
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update goal');
      }

      // Reload goals from server to get updated data
      await loadGoals();
      
      setIsCreateModalOpen(false);
      setEditingGoal(null);
      resetForm();
    } catch (error) {
      console.error('Error updating goal:', error);
      // Could add toast notification here
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      const response = await fetch(`/api/goals/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete goal');
      }

      // Reload goals from server to get updated data
      await loadGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      // Could add toast notification here
    }
  };

  const resetForm = () => {
    setNewGoal({
      title: '',
      description: '',
      targetAmount: '',
      currentAmount: '0',
      targetDate: '',
      category: 'other',
      priority: 'medium',
      monthlyContribution: ''
    });
  };

  const totalGoalsValue = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalCurrentValue = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const completedGoals = goals.filter(goal => goal.status === 'completed').length;
  const inProgressGoals = goals.filter(goal => goal.status === 'in-progress').length;

  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="goals">
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">My Financial Goals</h1>
              <p className="text-slate-600">Track and manage your financial objectives</p>
            </div>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add New Goal
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <IndianRupee className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Goal Value</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalGoalsValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-slate-600">Current Progress</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalCurrentValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-slate-600">Completed Goals</p>
                  <p className="text-2xl font-bold text-slate-900">{completedGoals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Target className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-sm font-medium text-slate-600">In Progress</p>
                  <p className="text-2xl font-bold text-slate-900">{inProgressGoals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goals List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isLoading ? (
            // Loading skeleton
            [1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="h-6 bg-slate-200 rounded mb-2 w-3/4"></div>
                      <div className="h-4 bg-slate-200 rounded mb-3 w-full"></div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <div className="w-8 h-8 bg-slate-200 rounded"></div>
                      <div className="w-8 h-8 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-2 bg-slate-200 rounded w-full"></div>
                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : goals.length > 0 ? (
            goals.map(goal => {
              const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
              const monthsRemaining = calculateMonthsRemaining(goal.targetDate);
              const shortfall = Math.max(0, goal.targetAmount - goal.currentAmount);
              const requiredMonthlyContribution = monthsRemaining > 0 ? shortfall / monthsRemaining : 0;
            
            return (
              <Card key={goal.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-slate-900 mb-2">
                        {goal.title}
                      </CardTitle>
                      <p className="text-sm text-slate-600 mb-3">{goal.description}</p>
                      
                      <div className="flex flex-wrap items-center space-x-2 mb-3">
                        <Badge className={`${categoryColors[goal.category]} text-xs px-2 py-1`}>
                          {goal.category.replace('-', ' ').toUpperCase()}
                        </Badge>
                        <Badge className={`${priorityColors[goal.priority]} text-xs px-2 py-1`}>
                          {goal.priority.toUpperCase()} PRIORITY
                        </Badge>
                        <Badge className={`${statusColors[goal.status]} text-xs px-2 py-1`}>
                          {goal.status.replace('-', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditGoal(goal)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-900">Progress</span>
                      <span className="text-sm font-semibold text-slate-900">{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  
                  {/* Financial Details */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-500">Current Amount</p>
                      <p className="text-sm font-semibold text-slate-900">{formatCurrency(goal.currentAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Target Amount</p>
                      <p className="text-sm font-semibold text-slate-900">{formatCurrency(goal.targetAmount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Monthly Contribution</p>
                      <p className="text-sm font-semibold text-slate-900">{formatCurrency(goal.monthlyContribution)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Target Date</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {new Date(goal.targetDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Analysis */}
                  {goal.status !== 'completed' && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="text-xs text-slate-600 space-y-1">
                        <p>Remaining: <span className="font-semibold">{formatCurrency(shortfall)}</span></p>
                        <p>Months Left: <span className="font-semibold">{monthsRemaining}</span></p>
                        {monthsRemaining > 0 && (
                          <p>
                            Required Monthly: 
                            <span className={`font-semibold ml-1 ${
                              requiredMonthlyContribution > goal.monthlyContribution 
                                ? 'text-red-600' 
                                : 'text-green-600'
                            }`}>
                              {formatCurrency(requiredMonthlyContribution)}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {goal.status === 'completed' && (
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Goal Achieved! 🎉</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
          ) : (
            // Empty state
            <div className="col-span-2 text-center py-12">
              <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">No Financial Goals Yet</h3>
              <p className="text-slate-600 mb-6">Start your financial journey by setting your first goal</p>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Goal
              </Button>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
          setIsCreateModalOpen(open);
          if (!open) {
            setEditingGoal(null);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingGoal ? 'Edit Financial Goal' : 'Create New Financial Goal'}
              </DialogTitle>
              <DialogDescription>
                {editingGoal ? 'Update your financial goal details' : 'Set up a new financial goal to track your progress'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Goal Title
                </Label>
                <Input
                  id="title"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                  className="col-span-3"
                  placeholder="e.g., Emergency Fund"
                />
              </div>
              
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right pt-2">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={newGoal.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewGoal({...newGoal, description: e.target.value})}
                  className="col-span-3"
                  rows={3}
                  placeholder="Describe your financial goal..."
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="targetAmount" className="text-right">
                  Target Amount (₹)
                </Label>
                <Input
                  id="targetAmount"
                  type="number"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal({...newGoal, targetAmount: e.target.value})}
                  className="col-span-3"
                  placeholder="1000000"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="currentAmount" className="text-right">
                  Current Amount (₹)
                </Label>
                <Input
                  id="currentAmount"
                  type="number"
                  value={newGoal.currentAmount}
                  onChange={(e) => setNewGoal({...newGoal, currentAmount: e.target.value})}
                  className="col-span-3"
                  placeholder="0"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="monthlyContribution" className="text-right">
                  Monthly Contribution (₹)
                </Label>
                <Input
                  id="monthlyContribution"
                  type="number"
                  value={newGoal.monthlyContribution}
                  onChange={(e) => setNewGoal({...newGoal, monthlyContribution: e.target.value})}
                  className="col-span-3"
                  placeholder="25000"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="targetDate" className="text-right">
                  Target Date
                </Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={newGoal.targetDate}
                  onChange={(e) => setNewGoal({...newGoal, targetDate: e.target.value})}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <Select value={newGoal.category} onValueChange={(value) => setNewGoal({...newGoal, category: value as FinancialGoal['category']})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retirement">Retirement</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="emergency">Emergency Fund</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priority" className="text-right">
                  Priority
                </Label>
                <Select value={newGoal.priority} onValueChange={(value) => setNewGoal({...newGoal, priority: value as FinancialGoal['priority']})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingGoal(null);
                  resetForm();
                }}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={editingGoal ? handleUpdateGoal : handleCreateGoal}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!newGoal.title || !newGoal.targetAmount || !newGoal.targetDate}
              >
                {editingGoal ? 'Update Goal' : 'Create Goal'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </DashboardLayout>
    </ProtectedRoute>
  );
}
