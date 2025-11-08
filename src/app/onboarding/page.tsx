'use client';

import { useState } from 'react';
import { TrendingUp, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface OnboardingData {
  monthlyIncome: string;
  creditScore: number;
  primaryGoal: string;
  currentInvestments: string[];
  riskTolerance: string;
}

const incomeRanges = [
  '₹20,000 - ₹30,000',
  '₹30,000 - ₹50,000',
  '₹50,000 - ₹75,000',
  '₹75,000 - ₹1,00,000',
  '₹1,00,000 - ₹1,50,000',
  '₹1,50,000+',
];

const financialGoals = [
  {
    id: 'credit',
    title: 'Improve my Credit Score',
    description: 'Get personalized tips to boost your credit rating',
    emoji: '📈'
  },
  {
    id: 'invest',
    title: 'Start Investing',
    description: 'Learn about investment options tailored for you',
    emoji: '💰'
  },
  {
    id: 'save',
    title: 'Save for a Major Purchase',
    description: 'Plan and track your savings goals effectively',
    emoji: '🏠'
  },
  {
    id: 'explore',
    title: 'Just Exploring',
    description: 'Discover financial insights and opportunities',
    emoji: '🔍'
  },
];

const investmentOptions = [
  { id: 'INDEX_FUND', name: 'Index Funds', description: 'Low-cost diversified funds' },
  { id: 'REAL_ESTATE', name: 'Real Estate', description: 'Property investments' },
  { id: 'SIP', name: 'SIP (Mutual Funds)', description: 'Systematic Investment Plans' },
  { id: 'GOVERNMENT_BOND', name: 'Government Bonds', description: 'Safe government securities' },
  { id: 'STOCKS', name: 'Individual Stocks', description: 'Direct equity investments' },
  { id: 'GOLD', name: 'Gold', description: 'Precious metal investments' },
];

const riskToleranceOptions = [
  { id: 'CONSERVATIVE', name: 'Conservative', description: 'Prefer stable, low-risk investments' },
  { id: 'MODERATE', name: 'Moderate', description: 'Balanced approach to risk and returns' },
  { id: 'AGGRESSIVE', name: 'Aggressive', description: 'Comfortable with higher risk for better returns' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    monthlyIncome: '',
    creditScore: 700,
    primaryGoal: '',
    currentInvestments: [],
    riskTolerance: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const progress = ((currentStep + 1) / 6) * 100;

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    
    try {
      // Save onboarding data to the backend
      const response = await fetch('/api/customer/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          incomeRange: data.monthlyIncome,
          currentCreditScore: data.creditScore,
          primaryFinancialGoal: data.primaryGoal.toUpperCase().replace(/\s+/g, '_'),
          riskAppetite: data.riskTolerance,
        }),
      });

      if (response.ok) {
        console.log('✅ Onboarding profile saved successfully');
        
        // Create a financial goal based on their primary goal
        if (data.primaryGoal) {
          const goalDetails = financialGoals.find(g => g.id === data.primaryGoal);
          if (goalDetails) {
            const goalData: any = {
              goal_name: goalDetails.title,
              target_amount: 100000, // Default target, user can update later
              current_amount: 0,
              target_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
              description: goalDetails.description,
            };

            try {
              await fetch('/api/goals', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                },
                body: JSON.stringify(goalData),
              });
              console.log('✅ Financial goal created');
            } catch (error) {
              console.error('Error creating goal:', error);
            }
          }
        }
        
        // Add investments to portfolio if they selected any
        if (data.currentInvestments.length > 0) {
          console.log(`📊 Adding ${data.currentInvestments.length} investments to portfolio...`);
          for (const investment of data.currentInvestments) {
            const investmentOption = investmentOptions.find(opt => opt.id === investment);
            if (investmentOption) {
              try {
                await fetch('/api/customer/portfolio', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                  },
                  body: JSON.stringify({
                    product_name: investmentOption.name,
                    product_category: investment,
                    risk_level: data.riskTolerance,
                    expected_return: '8-12%', // Default expected return
                    description: `Added during onboarding - ${investmentOption.description}`,
                  }),
                });
                console.log(`✅ Added ${investmentOption.name} to portfolio`);
              } catch (error) {
                console.error(`Error adding ${investmentOption.name}:`, error);
              }
            }
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      // Still proceed to dashboard even if saving fails
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
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
    return 'Needs Improvement';
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card className="border-0 shadow-lg">
            <CardContent className="text-center p-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">
                Welcome, {user?.full_name || user?.email?.split('@')[0] || 'there'}! 👋
              </h2>
              <p className="text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
                Let's create your financial snapshot so I can provide the best advice. This will only take a moment.
              </p>
              <Button
                onClick={handleNext}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        );

      case 1:
        return (
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-slate-800">Your Financial Picture</CardTitle>
              <p className="text-slate-600">Help us understand your current situation</p>
            </CardHeader>
            
            <CardContent className="p-8 space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-slate-800 mb-4">
                  What is your approximate monthly income?
                </h3>
                <div className="grid gap-3">
                  {incomeRanges.map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setData({ ...data, monthlyIncome: range })}
                      className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                        data.monthlyIncome === range
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="font-medium text-slate-800">{range}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-medium text-slate-800">
                  What is your current credit score (estimate)?
                </h3>
                <div className="px-4">
                  <div className="relative mb-6">
                    <input
                      type="range"
                      min="300"
                      max="900"
                      value={data.creditScore}
                      onChange={(e) => setData({ ...data, creditScore: parseInt(e.target.value) })}
                      className="w-full h-3 bg-gradient-to-r from-red-500 via-yellow-500 to-emerald-500 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  <div className="flex justify-between text-sm text-slate-500 mb-4">
                    <span>300</span>
                    <span className={`font-bold text-2xl ${getCreditScoreColor(data.creditScore)}`}>
                      {data.creditScore}
                    </span>
                    <span>900</span>
                  </div>
                  <div className="text-center">
                    <Badge 
                      variant="outline" 
                      className={`${getCreditScoreColor(data.creditScore)} border-current text-base px-4 py-1`}
                    >
                      {getCreditScoreLabel(data.creditScore)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-slate-800">Your Goals</CardTitle>
              <p className="text-slate-600">What would you like to focus on first?</p>
            </CardHeader>
            
            <CardContent className="p-8">
              <div className="space-y-4">
                {financialGoals.map((goal) => (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setData({ ...data, primaryGoal: goal.id })}
                    className={`w-full p-6 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                      data.primaryGoal === goal.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="text-3xl">{goal.emoji}</div>
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-2 text-lg">{goal.title}</h3>
                        <p className="text-slate-600">{goal.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-slate-800">Your Investment Profile</CardTitle>
              <p className="text-slate-600">Tell us about your current investments</p>
            </CardHeader>
            
            <CardContent className="p-8">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-slate-800 mb-4">
                  What investments do you currently have? (Select all that apply)
                </h3>
                <div className="grid gap-3">
                  {investmentOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        const newInvestments = data.currentInvestments.includes(option.id)
                          ? data.currentInvestments.filter(inv => inv !== option.id)
                          : [...data.currentInvestments, option.id];
                        setData({ ...data, currentInvestments: newInvestments });
                      }}
                      className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                        data.currentInvestments.includes(option.id)
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-slate-800">{option.name}</span>
                          <p className="text-sm text-slate-600">{option.description}</p>
                        </div>
                        {data.currentInvestments.includes(option.id) && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setData({ ...data, currentInvestments: [] })}
                    className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                      data.currentInvestments.length === 0
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-slate-800">No current investments</span>
                        <p className="text-sm text-slate-600">I'm just starting my investment journey</p>
                      </div>
                      {data.currentInvestments.length === 0 && (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-slate-800">Risk Tolerance</CardTitle>
              <p className="text-slate-600">How do you feel about investment risk?</p>
            </CardHeader>
            
            <CardContent className="p-8">
              <div className="space-y-4">
                {riskToleranceOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setData({ ...data, riskTolerance: option.id })}
                    className={`w-full p-6 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                      data.riskTolerance === option.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="text-2xl">
                        {option.id === 'LOW' ? '🛡️' : option.id === 'MEDIUM' ? '⚖️' : '🚀'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-2 text-lg">{option.name}</h3>
                        <p className="text-slate-600">{option.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card className="border-0 shadow-lg">
            <CardContent className="text-center p-8">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">All Set! 🎉</h2>
              <p className="text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
                Thank you! I've customized your dashboard based on your preferences. Let's get started on your financial journey.
              </p>
              
              {/* Summary Card */}
              <div className="bg-slate-50 rounded-lg p-6 mb-8 text-left max-w-md mx-auto">
                <h3 className="font-semibold text-slate-800 mb-4 text-center">Your Profile Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Monthly Income:</span>
                    <Badge variant="outline" className="text-slate-800 font-medium">
                      {data.monthlyIncome}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Credit Score:</span>
                    <Badge 
                      variant="outline" 
                      className={`${getCreditScoreColor(data.creditScore)} border-current font-medium`}
                    >
                      {data.creditScore}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Primary Goal:</span>
                    <Badge variant="outline" className="text-slate-800 font-medium">
                      {financialGoals.find(g => g.id === data.primaryGoal)?.title?.split(' ').slice(0, 2).join(' ')}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Risk Tolerance:</span>
                    <Badge variant="outline" className="text-slate-800 font-medium">
                      {riskToleranceOptions.find(r => r.id === data.riskTolerance)?.name}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-slate-600">Investments:</span>
                    <div className="text-right">
                      {data.currentInvestments.length === 0 ? (
                        <Badge variant="outline" className="text-slate-800 font-medium">None yet</Badge>
                      ) : (
                        <div className="flex flex-wrap gap-1 justify-end">
                          {data.currentInvestments.slice(0, 2).map(inv => (
                            <Badge key={inv} variant="outline" className="text-xs text-slate-800">
                              {investmentOptions.find(opt => opt.id === inv)?.name}
                            </Badge>
                          ))}
                          {data.currentInvestments.length > 2 && (
                            <Badge variant="outline" className="text-xs text-slate-600">
                              +{data.currentInvestments.length - 2} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleComplete}
                disabled={isLoading}
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isLoading ? 'Setting up...' : 'Go to Dashboard'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Section */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-sm font-medium text-slate-600 mb-2">Step {currentStep + 1} of 6</h1>
            <Progress value={progress} className="w-full max-w-md mx-auto h-2" />
          </div>
        </div>

        {/* Content */}
        <div className="mb-8">
          {renderStep()}
        </div>

        {/* Navigation */}
        {currentStep > 0 && currentStep < 5 && (
          <div className="flex justify-between">
            <Button
              onClick={handlePrev}
              variant="ghost"
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <Button
              onClick={handleNext}
              disabled={
                (currentStep === 1 && !data.monthlyIncome) ||
                (currentStep === 2 && !data.primaryGoal) ||
                (currentStep === 4 && !data.riskTolerance)
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {currentStep === 5 && (
          <div className="flex justify-center">
            <Button
              onClick={handlePrev}
              variant="ghost"
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
