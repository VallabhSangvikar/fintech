'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  User, 
  Shield, 
  Users, 
  Bell, 
  Upload, 
  Eye, 
  EyeOff, 
  Mail,
  Plus,
  MoreHorizontal,
  Check,
  X,
  AlertCircle,
  QrCode
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type TabType = 'profile' | 'security' | 'team' | 'notifications';
type UserRole = 'investment' | 'bank' | 'customer';

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  department?: string;
  status: 'active' | 'pending';
  avatar: string;
  joinedAt?: string;
}

// Sample team data
const sampleTeamMembers: TeamMember[] = [
  { id: 1, name: 'Anand Sharma', email: 'anand.sharma@company.com', role: 'Admin', status: 'active', avatar: 'AS' },
  { id: 2, name: 'Priya Singh', email: 'priya.singh@company.com', role: 'Portfolio Manager', status: 'active', avatar: 'PS' },
  { id: 3, name: 'Rohit Kumar', email: 'rohit.kumar@company.com', role: 'Analyst', status: 'active', avatar: 'RK' },
  { id: 4, name: 'Neha Gupta', email: 'neha.gupta@company.com', role: 'Read-Only', status: 'pending', avatar: 'NG' },
];

const activeSessions = [
  { id: 1, device: 'Chrome on Windows', location: 'Pune, India', lastActive: '5 mins ago', current: true },
  { id: 2, device: 'Safari on MacBook', location: 'Mumbai, India', lastActive: '2 hours ago', current: false },
  { id: 3, device: 'Chrome on Android', location: 'Delhi, India', lastActive: '1 day ago', current: false },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(sampleTeamMembers);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    phone: ''
  });
  
  // Invite member form state
  const [inviteForm, setInviteForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: '',
    department: ''
  });
  
  // Get user role and check if admin
  const getUserRole = (): UserRole => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('userRole') as UserRole) || 'customer';
    }
    return 'customer';
  };

  const getUserInfo = () => {
    const role = getUserRole();
    switch (role) {
      case 'investment':
        return { 
          name: 'Anand Sharma', 
          email: 'anand.sharma@acmecapital.com', 
          role: 'Investment Analyst',
          institution: 'ACME Capital Management',
          isAdmin: true // For demo purposes
        };
      case 'bank':
        return { 
          name: 'Priya Singh', 
          email: 'priya.singh@nationbank.com', 
          role: 'Lending Manager',
          institution: 'National Bank of India',
          isAdmin: true // For demo purposes
        };
      case 'customer':
        return { 
          name: 'Rohan Verma', 
          email: 'rohan.verma@gmail.com', 
          role: 'Customer',
          institution: null,
          isAdmin: false
        };
      default:
        return { 
          name: 'Rohan Verma', 
          email: 'rohan.verma@gmail.com', 
          role: 'Customer',
          institution: null,
          isAdmin: false
        };
    }
  };

  const userInfo = getUserInfo();
  const userRole = getUserRole();
  const { user } = useAuth();

  // Initialize profile form with current user data
  useEffect(() => {
    setProfileForm({
      full_name: userInfo.name,
      email: userInfo.email,
      phone: '' // This would come from user profile API
    });
  }, [userInfo.name, userInfo.email]);

  // Profile update handler
  const handleProfileSave = async () => {
    setIsProfileSaving(true);
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(profileForm)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const result = await response.json();
      
      // Update local storage or context if needed
      alert('Profile updated successfully');
      
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsProfileSaving(false);
    }
  };

  // Invite member functions
  const handleInviteMember = async () => {
    if (!inviteForm.email || !inviteForm.firstName || !inviteForm.lastName || !inviteForm.role) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          email: inviteForm.email,
          firstName: inviteForm.firstName,
          lastName: inviteForm.lastName,
          role: inviteForm.role,
          department: inviteForm.department || 'General'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send invitation');
      }

      const result = await response.json();
      
      // Add the new team member to local state for immediate feedback
      const newMember: TeamMember = {
        id: result.id || Date.now(),
        name: `${inviteForm.firstName} ${inviteForm.lastName}`,
        email: inviteForm.email,
        role: inviteForm.role,
        department: inviteForm.department || 'General',
        status: 'pending',
        avatar: `${inviteForm.firstName.charAt(0)}${inviteForm.lastName.charAt(0)}`,
        joinedAt: new Date().toISOString().split('T')[0]
      };

      setTeamMembers([...teamMembers, newMember]);
      setShowInviteModal(false);
      resetInviteForm();
      alert('Invitation sent successfully');
      
    } catch (error: any) {
      console.error('Invitation error:', error);
      alert(error.message || 'Failed to send invitation. Please try again.');
    }
  };

  const resetInviteForm = () => {
    setInviteForm({
      email: '',
      firstName: '',
      lastName: '',
      role: '',
      department: ''
    });
  };

  const getRoleOptions = () => {
    if (userRole === 'investment') {
      return ['Analyst', 'Portfolio Manager', 'Compliance Officer', 'Risk Manager', 'Senior Analyst', 'Associate'];
    } else if (userRole === 'bank') {
      return ['Lending Manager', 'Credit Analyst', 'Relationship Manager', 'Operations Manager', 'Compliance Officer'];
    }
    return ['Team Member', 'Analyst', 'Manager'];
  };

  const getDepartmentOptions = () => {
    if (userRole === 'investment') {
      return ['Research', 'Portfolio Management', 'Risk Management', 'Compliance', 'Operations', 'Client Services'];
    } else if (userRole === 'bank') {
      return ['Lending & Credit', 'Retail Banking', 'Corporate Banking', 'Risk Management', 'Compliance', 'Operations'];
    }
    return ['General', 'Operations', 'Support'];
  };

  // Define available tabs based on user role and admin status
  const getAvailableTabs = () => {
    const baseTabs = [
      { id: 'profile' as TabType, label: 'Profile', icon: User },
      { id: 'security' as TabType, label: 'Security', icon: Shield },
      { id: 'notifications' as TabType, label: 'Notifications', icon: Bell },
    ];

    // Add Team Management tab only for institutional admins
    if ((userRole === 'investment' || userRole === 'bank') && userInfo.isAdmin) {
      baseTabs.splice(2, 0, { id: 'team' as TabType, label: 'Team Management', icon: Users });
    }

    return baseTabs;
  };

  const availableTabs = getAvailableTabs();

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }

    setIsPasswordChanging(true);
    
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: currentPassword,
          newPassword: newPassword
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change password');
      }

      alert('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (error: any) {
      console.error('Password change error:', error);
      alert(error.message || 'Failed to change password. Please try again.');
    } finally {
      setIsPasswordChanging(false);
    }
  };

  const renderProfileTab = () => (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Picture */}
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {userInfo.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Upload Photo
            </Button>
            <p className="text-sm text-slate-500 mt-1">JPG, PNG or GIF (max. 800x800px)</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              value={profileForm.full_name}
              onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
              className="bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={profileForm.phone}
              onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Enter your phone number"
              className="bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={profileForm.email}
              disabled
              className="bg-slate-100 cursor-not-allowed"
            />
            <p className="text-xs text-slate-500">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              type="text"
              value={userInfo.role}
              disabled
              className="bg-slate-100 cursor-not-allowed"
            />
          </div>

          {userInfo.institution && (
            <div className="space-y-2">
              <Label htmlFor="institution">{userRole === 'investment' ? 'Institution' : 'Bank'}</Label>
              <Input
                id="institution"
                type="text"
                value={userInfo.institution}
                disabled
                className="bg-slate-100 cursor-not-allowed"
              />
            </div>
          )}
        </div>

        <Button 
          className="w-full md:w-auto" 
          onClick={handleProfileSave}
          disabled={isProfileSaving}
        >
          {isProfileSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-0 top-0 h-full px-3"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-0 top-0 h-full px-3"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-0 top-0 h-full px-3"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          <Button 
            onClick={handlePasswordChange}
            disabled={isPasswordChanging}
          >
            {isPasswordChanging ? 'Changing Password...' : 'Change Password'}
          </Button>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Authenticator App</h4>
              <p className="text-sm text-slate-500">Use an authentication app to generate verification codes</p>
            </div>
            <Button
              variant={twoFactorEnabled ? "destructive" : "default"}
              onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
            >
              {twoFactorEnabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
          
          {twoFactorEnabled && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <QrCode className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-blue-800">Setup Instructions</h5>
                  <p className="text-sm text-blue-600">Scan the QR code with your authenticator app and enter the verification code.</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{session.device}</h4>
                    {session.current && <Badge variant="secondary">Current</Badge>}
                  </div>
                  <p className="text-sm text-slate-500">{session.location} • {session.lastActive}</p>
                </div>
                {!session.current && (
                  <Button variant="outline" size="sm">
                    Terminate
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" className="w-full">
              Log out all other sessions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTeamTab = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Team Management</CardTitle>
        <Button onClick={() => setShowInviteModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {teamMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {member.avatar}
                </div>
                <div>
                  <h4 className="font-medium">{member.name}</h4>
                  <p className="text-sm text-slate-500">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                  {member.status}
                </Badge>
                <span className="text-sm text-slate-600">{member.role}</span>
                {member.role !== 'Admin' && (
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderNotificationsTab = () => (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-medium mb-4">Email Notifications</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Weekly Summary Report</p>
                <p className="text-sm text-slate-500">Receive weekly performance summaries</p>
              </div>
              <Button variant="outline" size="sm">Toggle</Button>
            </div>
            
            {userRole !== 'customer' && (
              <>
                {userRole === 'investment' && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Major Market Alerts</p>
                      <p className="text-sm text-slate-500">Get notified of significant market movements</p>
                    </div>
                    <Button variant="outline" size="sm">Toggle</Button>
                  </div>
                )}
                
                {userRole === 'bank' && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">High-Risk Fraud Alerts</p>
                      <p className="text-sm text-slate-500">Immediate alerts for high-risk transactions</p>
                    </div>
                    <Button variant="outline" size="sm">Toggle</Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-4">In-App Notifications</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Document Analysis Complete</p>
                <p className="text-sm text-slate-500">When AI finishes analyzing documents</p>
              </div>
              <Button variant="outline" size="sm">Toggle</Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">AI Co-Pilot Mentions</p>
                <p className="text-sm text-slate-500">When the AI references your previous conversations</p>
              </div>
              <Button variant="outline" size="sm">Toggle</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="settings">
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-800 mb-8">Settings</h1>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-8 bg-slate-100 p-1 rounded-lg">
            {availableTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'security' && renderSecurityTab()}
          {activeTab === 'team' && renderTeamTab()}
          {activeTab === 'notifications' && renderNotificationsTab()}
        </div>
      </div>

      {/* Invite Member Modal */}
      <Dialog open={showInviteModal} onOpenChange={(open) => {
        setShowInviteModal(open);
        if (!open) resetInviteForm();
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Add a new team member to your {userInfo.institution || 'organization'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={inviteForm.firstName}
                  onChange={(e) => setInviteForm({...inviteForm, firstName: e.target.value})}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={inviteForm.lastName}
                  onChange={(e) => setInviteForm({...inviteForm, lastName: e.target.value})}
                  placeholder="Doe"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                placeholder="john.doe@company.com"
              />
            </div>
            
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={inviteForm.role} onValueChange={(value) => setInviteForm({...inviteForm, role: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {getRoleOptions().map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="department">Department</Label>
              <Select value={inviteForm.department} onValueChange={(value) => setInviteForm({...inviteForm, department: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {getDepartmentOptions().map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowInviteModal(false);
                resetInviteForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInviteMember}
              disabled={!inviteForm.email || !inviteForm.firstName || !inviteForm.lastName || !inviteForm.role}
            >
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
    </ProtectedRoute>
  );
}
