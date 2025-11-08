'use client';

import { useState } from 'react';
import { useAuth, User } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  MessageSquare, 
  BarChart3, 
  FileText, 
  Settings, 
  TrendingUp,
  Search,
  Bell,
  User as UserIcon,
  ChevronDown,
  Menu,
  X,
  Brain,
  Target,
  Lightbulb,
  LogOut,
  PieChart,
  Receipt,
  Newspaper,
  CreditCard,
  LineChart
} from 'lucide-react';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage: string;
}

// Get navigation items based on user role and organization type
const getNavigationItems = (user: User | null) => {
  const baseItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { id: 'ai-workbench', label: 'AI Workbench', icon: Brain, href: '/ai-workbench' },
  ];
  
  // Add role-specific items
  if (user?.organizationId) {
    // Organization user (Investment or Bank)
    baseItems.push(
      { id: 'documents', label: 'Document Center', icon: FileText, href: '/documents' }
    );
  } else {
    // Individual customer
    baseItems.push(
      { id: 'stock-hub', label: 'Stock Hub', icon: LineChart, href: '/stock-hub' },
      { id: 'investment-tips', label: 'Investment Tips', icon: Lightbulb, href: '/investment-tips' },
      { id: 'portfolio', label: 'My Portfolio', icon: PieChart, href: '/portfolio' },
      { id: 'goals', label: 'My Goals', icon: Target, href: '/goals' },
      { id: 'expense-analysis', label: 'Expense Analysis', icon: Receipt, href: '/expense-analysis' },
      { id: 'financial-news', label: 'Financial News', icon: Newspaper, href: '/financial-news' },
      { id: 'credit-health', label: 'Credit Health', icon: CreditCard, href: '/credit-health' }
    );
  }
  
  return baseItems;
};

export default function DashboardLayout({ children, currentPage }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const getUserDisplayInfo = () => {
    if (!user) return { name: 'Guest', role: 'Guest', avatar: 'G' };
    
    const initials = user.full_name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
    
    return {
      name: user.full_name,
      role: user.organizationName ? `${user.role || 'Member'} at ${user.organizationName}` : 'Customer',
      avatar: initials,
      email: user.email
    };
  };

  const userInfo = getUserDisplayInfo();
  const navigationItems = getNavigationItems(user);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} fixed lg:relative inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transition-all duration-300 ease-in-out`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              {!sidebarCollapsed && <span className="text-xl font-bold text-slate-800">FinSight</span>}
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-md hover:bg-slate-100 lg:block hidden"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-md hover:bg-slate-100 lg:hidden"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === currentPage;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span className="ml-3">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-slate-200">
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {userInfo.avatar}
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {userInfo.name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {userInfo.role}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-md hover:bg-slate-100 lg:hidden"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-xl font-semibold text-slate-800">
              {navigationItems.find(item => item.id === currentPage)?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-colors"
              />
            </div>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {userInfo.avatar}
                </div>
                <ChevronDown className="w-4 h-4 text-slate-600" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-900">{userInfo.name}</p>
                    <p className="text-xs text-slate-500">{userInfo.role}</p>
                  </div>
                  <Link href="/settings" className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                  <hr className="my-1" />
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
