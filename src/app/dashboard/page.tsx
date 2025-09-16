'use client';

import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import InvestmentDashboard from '../../components/dashboards/InvestmentDashboard';
import BankDashboard from '../../components/dashboards/BankDashboard';
import CustomerDashboard from '../../components/dashboards/CustomerDashboard';

export default function DashboardPage() {
  const { user } = useAuth();

  const renderDashboard = () => {
    if (!user) return <CustomerDashboard />;

    // Determine dashboard based on user role and organization type
    if (!user.organizationId) {
      // Individual customer
      return <CustomerDashboard />;
    } else {
      // Organization user - check organization type
      if (user.organizationType === 'INVESTMENT_FIRM' || user.organizationType === 'WEALTH_MANAGEMENT') {
        return <InvestmentDashboard />;
      } else if (user.organizationType === 'BANK' || user.organizationType === 'LENDING_INSTITUTION') {
        return <BankDashboard />;
      } else {
        return <InvestmentDashboard />; // Default for organizations
      }
    }
  };

  return (
    <DashboardLayout currentPage="dashboard">
      {renderDashboard()}
    </DashboardLayout>
  );
}
