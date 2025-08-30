import { ArrowRight, Shield, TrendingUp, Building2, Users, Zap, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-800">FinSight</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/login" 
                className="text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors font-medium"
              >
                Login
              </Link>
              <Link 
                href="/signup" 
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center opacity-5">
              <div className="w-96 h-96 rounded-full border-2 border-blue-200 animate-pulse"></div>
              <div className="absolute w-72 h-72 rounded-full border border-emerald-200 animate-ping"></div>
              <div className="absolute w-48 h-48 rounded-full border border-slate-200"></div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-slate-800 mb-6 relative z-10">
              The Future of <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">Financial Intelligence</span>, Unified
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto relative z-10">
              Empowering Investment Institutions, Banks, and Individual Customers with AI-powered financial insights and intelligent decision-making tools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
              <Link 
                href="/signup" 
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-lg"
              >
                <span>Sign Up for Free</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="border-2 border-slate-300 text-slate-700 px-8 py-3 rounded-lg hover:bg-slate-50 transition-colors text-lg">
                Request a Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-800 mb-16">
            Tailored Solutions for Every Financial Role
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Investment Institutions */}
            <div className="group p-8 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Investment Institutions</h3>
              <p className="text-slate-600 mb-6">
                AI-powered portfolio analysis, market insights, and investment plan optimization with real-time data and regulatory compliance.
              </p>
              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <img 
                  src="/api/placeholder/300/200" 
                  alt="Investment Dashboard" 
                  className="w-full h-40 object-cover rounded-lg bg-gradient-to-br from-blue-100 to-slate-100"
                />
              </div>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>AI Investment Co-Pilot</span>
                </li>
                <li className="flex items-center space-x-2 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Portfolio Performance Analytics</span>
                </li>
                <li className="flex items-center space-x-2 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Real-time Market Intelligence</span>
                </li>
              </ul>
            </div>

            {/* Banks */}
            <div className="group p-8 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Banks</h3>
              <p className="text-slate-600 mb-6">
                Automated loan document analysis, compliance checking, and fraud detection with AI-powered risk assessment tools.
              </p>
              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <img 
                  src="/api/placeholder/300/200" 
                  alt="Banking Dashboard" 
                  className="w-full h-40 object-cover rounded-lg bg-gradient-to-br from-emerald-100 to-slate-100"
                />
              </div>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Smart Document Analyzer</span>
                </li>
                <li className="flex items-center space-x-2 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Regulatory Compliance Check</span>
                </li>
                <li className="flex items-center space-x-2 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Fraud Detection Alerts</span>
                </li>
              </ul>
            </div>

            {/* Customers */}
            <div className="group p-8 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">Individual Customers</h3>
              <p className="text-slate-600 mb-6">
                Personal AI financial coach providing credit improvement tips, investment guidance, and personalized financial health insights.
              </p>
              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <img 
                  src="/api/placeholder/300/200" 
                  alt="Customer Dashboard" 
                  className="w-full h-40 object-cover rounded-lg bg-gradient-to-br from-purple-100 to-slate-100"
                />
              </div>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>AI Credit Score Coach</span>
                </li>
                <li className="flex items-center space-x-2 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Personalized Investment Tips</span>
                </li>
                <li className="flex items-center space-x-2 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Financial Health Tracking</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center mb-8">
            <Shield className="w-12 h-12 text-blue-600 mr-4" />
            <h2 className="text-3xl font-bold text-slate-800">Enterprise-Grade Security</h2>
          </div>
          <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto">
            Your financial data is protected with bank-level security, end-to-end encryption, and full regulatory compliance.
          </p>
          
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">SOC 2 Compliant</h3>
              <p className="text-sm text-slate-600">Type II certified security controls</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">GDPR Ready</h3>
              <p className="text-sm text-slate-600">Full data privacy compliance</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">256-bit Encryption</h3>
              <p className="text-sm text-slate-600">End-to-end data protection</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">99.9% Uptime</h3>
              <p className="text-sm text-slate-600">Always available when you need it</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">FinSight</span>
              </div>
              <p className="text-slate-300 text-sm">
                The future of financial intelligence, unified for institutions, banks, and individuals.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Demo</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-sm text-slate-400">
            <p>&copy; 2025 FinSight. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
