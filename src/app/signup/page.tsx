'use client';

import { useState } from 'react';
import { ArrowLeft, TrendingUp, Eye, EyeOff, Building2, Users, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PersonaType = 'Investment' | 'Bank' | 'Customer';

interface FormData {
  role: PersonaType;
  full_name: string;
  email: string;
  password: string;
  organization_name?: string;
}

const personaInfo = {
  Investment: {
    title: "Investment Institution",
    icon: TrendingUp,
    description: "Manage portfolios, analyze market trends, and optimize investment strategies with AI-powered insights.",
    features: ["Portfolio Analysis", "Market Intelligence", "Risk Assessment", "Compliance Tools"],
    color: "blue"
  },
  Bank: {
    title: "Banking Institution", 
    icon: Building2,
    description: "Streamline loan processing, detect fraud, and ensure regulatory compliance with automated tools.",
    features: ["Document Analysis", "Fraud Detection", "Compliance Check", "Risk Management"],
    color: "emerald"
  },
  Customer: {
    title: "Individual Customer",
    icon: Users,
    description: "Improve your financial health with personalized AI coaching and investment recommendations.",
    features: ["Credit Score Coaching", "Investment Tips", "Financial Planning", "Goal Tracking"],
    color: "purple"
  }
};

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    role: 'Customer',
    full_name: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const signupData = {
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        organization_name: formData.organization_name
      };

      const result = await signup(signupData);
      
      if (result.success) {
        // Redirect based on role
        if (formData.role === 'Customer') {
          router.push('/onboarding');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(result.error || 'Signup failed');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (key: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const currentPersona = personaInfo[formData.role];
  const PersonaIcon = currentPersona.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex">
      {/* Left Side - Persona Information */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 to-blue-900 p-12 flex-col justify-between">
        <div>
          <Link href="/" className="inline-flex items-center space-x-2 text-white/80 hover:text-white mb-12">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-white">FinSight</span>
          </div>

          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${
                currentPersona.color === 'blue' ? 'from-blue-500 to-blue-600' :
                currentPersona.color === 'emerald' ? 'from-emerald-500 to-emerald-600' :
                'from-purple-500 to-purple-600'
              }`}>
                <PersonaIcon className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">{currentPersona.title}</h2>
            </div>
            <p className="text-lg text-slate-300 mb-6">{currentPersona.description}</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white mb-4">What you'll get:</h3>
            {currentPersona.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-slate-200">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-slate-400 text-sm">
          <p>Trusted by 10,000+ financial professionals worldwide</p>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile header - only shown on small screens */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-2 text-slate-600 hover:text-slate-800 mb-6">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-800">FinSight</span>
            </div>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl font-bold text-slate-800">Create your account</CardTitle>
              <p className="text-sm text-slate-600">Join thousands of financial professionals</p>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                
                {/* Role Selection - Horizontal Layout */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    What best describes you?
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Investment', 'Bank', 'Customer'] as PersonaType[]).map((persona) => {
                      const info = personaInfo[persona];
                      const Icon = info.icon;
                      return (
                        <button
                          key={persona}
                          type="button"
                          onClick={() => updateFormData('role', persona)}
                          className={`p-3 rounded-lg border-2 transition-all text-center hover:shadow-md ${
                            formData.role === persona
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex flex-col items-center space-y-1">
                            <div className={`p-1.5 rounded-lg ${
                              formData.role === persona 
                                ? 'bg-blue-100 text-blue-600' 
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              <Icon className="w-3 h-3" />
                            </div>
                            <span className="text-xs font-medium text-slate-800">{info.title.replace(' Institution', '').replace('Individual ', '')}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Basic Information - All in Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5 md:col-span-2">
                    <Label htmlFor="fullName" className="text-sm">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={(e) => updateFormData('full_name', e.target.value)}
                      placeholder="Enter your full name"
                      className="h-10"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm">
                      {formData.role === 'Customer' ? 'Email' : 'Work Email'}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      placeholder={formData.role === 'Customer' ? 'your@email.com' : 'name@company.com'}
                      className="h-10"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-sm">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={(e) => updateFormData('password', e.target.value)}
                        placeholder="Strong password"
                        className="h-10 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-0 top-0 h-10 px-3 py-2 hover:bg-transparent"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Workspace-specific Fields - Only Institution/Bank Name for workspace creation */}
                {formData.role === 'Investment' && (
                  <div className="pt-3 border-t border-slate-200">
                    <div className="space-y-1.5">
                      <Label htmlFor="organizationName" className="text-sm">Institution Name</Label>
                      <Input
                        id="organizationName"
                        type="text"
                        required
                        value={formData.organization_name || ''}
                        onChange={(e) => updateFormData('organization_name', e.target.value)}
                        placeholder="ABC Mutual Fund"
                        className="h-10"
                      />
                      <p className="text-xs text-slate-500">You'll be the workspace administrator and can invite team members later.</p>
                    </div>
                  </div>
                )}

                {formData.role === 'Bank' && (
                  <div className="pt-3 border-t border-slate-200">
                    <div className="space-y-1.5">
                      <Label htmlFor="organizationName" className="text-sm">Bank Name</Label>
                      <Input
                        id="organizationName"
                        type="text"
                        required
                        value={formData.organization_name || ''}
                        onChange={(e) => updateFormData('organization_name', e.target.value)}
                        placeholder="National Bank of India"
                        className="h-10"
                      />
                      <p className="text-xs text-slate-500">You'll be the workspace administrator and can invite team members later.</p>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading 
                    ? 'Creating account...' 
                    : formData.role === 'Customer' 
                      ? 'Create Account'
                      : 'Create Your Workspace'
                  }
                </Button>
              </form>

              <div className="text-center mt-4">
                <p className="text-sm text-slate-600">
                  Already have an account?{' '}
                  <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
