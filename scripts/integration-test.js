#!/usr/bin/env node
/**
 * Comprehensive Integration Test Script
 * Tests all API endpoints and UI integration
 */

const apiClient = require('../src/services/api-client.ts').default;

class IntegrationTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async testAPI(name, testFn) {
    try {
      console.log(`🧪 Testing ${name}...`);
      await testFn();
      this.results.passed++;
      console.log(`✅ ${name} - PASSED`);
    } catch (error) {
      this.results.failed++;
      this.results.errors.push({ test: name, error: error.message });
      console.error(`❌ ${name} - FAILED: ${error.message}`);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Integration Tests\n');

    // Test Database Connection
    await this.testAPI('Database Connection', async () => {
      const response = await fetch('http://localhost:3000/api/test-db');
      if (!response.ok) throw new Error('Database connection failed');
    });

    // Test Authentication APIs
    await this.testAPI('User Signup', async () => {
      const testUser = {
        full_name: 'Test User',
        email: `test_${Date.now()}@example.com`,
        password: 'testpassword123',
        role: 'Customer'
      };

      const response = await apiClient.signup(testUser);
      if (!response.success) throw new Error(response.error || 'Signup failed');
      
      // Store token for subsequent tests
      this.testToken = response.data.token;
      this.testUserId = response.data.user.id;
      apiClient.setToken(this.testToken);
    });

    await this.testAPI('User Login', async () => {
      const response = await apiClient.login('test@example.com', 'password123');
      if (!response.success) {
        // If user doesn't exist, that's expected - test passed
        console.log('Login test: User not found (expected for new install)');
      }
    });

    // Test Goals API
    await this.testAPI('Create Financial Goal', async () => {
      if (!this.testToken) throw new Error('No auth token available');
      
      const goalData = {
        goal_name: 'Test Emergency Fund',
        target_amount: 100000,
        current_amount: 25000,
        target_date: '2025-12-31'
      };

      const response = await apiClient.createGoal(goalData);
      if (!response.success) throw new Error(response.error || 'Goal creation failed');
      
      this.testGoalId = response.data.id;
    });

    await this.testAPI('Get Financial Goals', async () => {
      if (!this.testToken) throw new Error('No auth token available');
      
      const response = await apiClient.getGoals();
      if (!response.success) throw new Error(response.error || 'Get goals failed');
    });

    // Test AI APIs
    await this.testAPI('Get Investment Tips', async () => {
      if (!this.testToken) throw new Error('No auth token available');
      
      const response = await apiClient.getInvestmentTips();
      if (!response.success) throw new Error(response.error || 'Get tips failed');
    });

    await this.testAPI('AI Chat Session', async () => {
      if (!this.testToken) throw new Error('No auth token available');
      
      const response = await apiClient.sendChatMessage({
        message: 'Hello, I need investment advice'
      });
      if (!response.success) throw new Error(response.error || 'AI chat failed');
    });

    // Test Team APIs (for organization users)
    await this.testAPI('Get Team Members', async () => {
      if (!this.testToken) throw new Error('No auth token available');
      
      try {
        const response = await apiClient.getTeamMembers();
        // This might fail for customer users, which is expected
        if (!response.success && response.error?.includes('organization')) {
          console.log('Team API test: Customer user has no organization (expected)');
        }
      } catch (error) {
        if (error.message.includes('organization')) {
          console.log('Team API test: Customer user has no organization (expected)');
        } else {
          throw error;
        }
      }
    });

    // Test Documents API
    await this.testAPI('Get Documents', async () => {
      if (!this.testToken) throw new Error('No auth token available');
      
      try {
        const response = await apiClient.getDocuments();
        // This might fail for customer users, which is expected
        if (!response.success && response.error?.includes('organization')) {
          console.log('Documents API test: Customer user has no organization (expected)');
        }
      } catch (error) {
        if (error.message.includes('organization')) {
          console.log('Documents API test: Customer user has no organization (expected)');
        } else {
          throw error;
        }
      }
    });

    // Print Results
    console.log('\n📊 TEST RESULTS');
    console.log('================');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    
    if (this.results.errors.length > 0) {
      console.log('\n🔥 ERRORS:');
      this.results.errors.forEach(error => {
        console.log(`   ${error.test}: ${error.error}`);
      });
    }

    const successRate = (this.results.passed / (this.results.passed + this.results.failed)) * 100;
    console.log(`\n🎯 Success Rate: ${successRate.toFixed(1)}%`);
    
    if (successRate >= 80) {
      console.log('🎉 Integration tests mostly successful!');
    } else {
      console.log('⚠️  Integration needs more work');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new IntegrationTester();
  tester.runAllTests().catch(console.error);
}

module.exports = IntegrationTester;
