'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import InvestmentDashboard from '../../components/dashboards/InvestmentDashboard';
import BankDashboard from '../../components/dashboards/BankDashboard';
import CustomerDashboard from '../../components/dashboards/CustomerDashboard';
import PersonaSwitcher from '../../components/PersonaSwitcher';

type UserRole = 'investment' | 'bank' | 'customer';

export default function DashboardPage() {
  const [userRole, setUserRole] = useState<UserRole>('customer');

  // In a real app, this would come from authentication context/API
  useEffect(() => {
    // Simulate fetching user role from auth context or API
    // For demo purposes, you can change this to test different dashboards
    const role = localStorage.getItem('userRole') as UserRole || 'customer';
    setUserRole(role);
  }, []);

  const renderDashboard = () => {
    switch (userRole) {
      case 'investment':
        return <InvestmentDashboard />;
      case 'bank':
        return <BankDashboard />;
      case 'customer':
        return <CustomerDashboard />;
      default:
        return <CustomerDashboard />;
    }
  };

  return (
    <DashboardLayout currentPage="dashboard">
      {renderDashboard()}
      <PersonaSwitcher />
    </DashboardLayout>
  );
}
