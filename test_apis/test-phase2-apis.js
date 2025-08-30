// Test script for Phase 2: Onboarding APIs
// Make sure to have a valid JWT token from Phase 1

const API_BASE = 'http://localhost:3000/api';

// You'll need a token from Phase 1 authentication
let authToken = ''; // Set this after login from Phase 1

// Test 1: Customer Onboarding
async function testCustomerOnboarding() {
  console.log('🧪 Testing Customer Onboarding...');
  
  try {
    const response = await fetch(`${API_BASE}/customer/onboarding`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        incomeRange: '$50,000 - $75,000',
        currentCreditScore: 720,
        riskAppetite: 'MODERATE',
        primaryFinancialGoal: 'RETIREMENT'
      }),
    });

    const result = await response.json();
    console.log('✅ Customer Onboarding Response:', result);
    return result;
  } catch (error) {
    console.error('❌ Customer Onboarding Error:', error);
  }
}

// Test 2: Get Customer Profile
async function testGetCustomerProfile() {
  console.log('🧪 Testing Get Customer Profile...');
  
  try {
    const response = await fetch(`${API_BASE}/customer/onboarding`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    console.log('✅ Get Customer Profile Response:', result);
    return result;
  } catch (error) {
    console.error('❌ Get Customer Profile Error:', error);
  }
}

// Test 3: Update Customer Profile
async function testUpdateCustomerProfile() {
  console.log('🧪 Testing Update Customer Profile...');
  
  try {
    const response = await fetch(`${API_BASE}/customer/onboarding`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentCreditScore: 750,
        riskAppetite: 'AGGRESSIVE'
      }),
    });

    const result = await response.json();
    console.log('✅ Update Customer Profile Response:', result);
    return result;
  } catch (error) {
    console.error('❌ Update Customer Profile Error:', error);
  }
}

// Test 4: Check Onboarding Status
async function testOnboardingStatus() {
  console.log('🧪 Testing Onboarding Status...');
  
  try {
    const response = await fetch(`${API_BASE}/customer/onboarding-status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    console.log('✅ Onboarding Status Response:', result);
    return result;
  } catch (error) {
    console.error('❌ Onboarding Status Error:', error);
  }
}

// Test 5: Knowledge Base Upload (Admin only - need organization token)
async function testKnowledgeBaseUpload() {
  console.log('🧪 Testing Knowledge Base Upload...');
  
  try {
    // Create a simple text file for testing
    const testFile = new File(['This is a test compliance document.'], 'test-compliance.txt', { type: 'text/plain' });
    
    const formData = new FormData();
    formData.append('files', testFile);
    formData.append('category', 'LOAN_COMPLIANCE');

    const response = await fetch(`${API_BASE}/knowledge-base`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: formData,
    });

    const result = await response.json();
    console.log('✅ Knowledge Base Upload Response:', result);
    return result;
  } catch (error) {
    console.error('❌ Knowledge Base Upload Error:', error);
  }
}

// Test 6: Get Knowledge Base Documents
async function testGetKnowledgeBase() {
  console.log('🧪 Testing Get Knowledge Base Documents...');
  
  try {
    const response = await fetch(`${API_BASE}/knowledge-base?category=LOAN_COMPLIANCE`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    console.log('✅ Get Knowledge Base Response:', result);
    return result;
  } catch (error) {
    console.error('❌ Get Knowledge Base Error:', error);
  }
}

// Helper function to set auth token
function setAuthToken(token) {
  authToken = token;
  console.log('✅ Auth token set for Phase 2 testing');
}

// Run customer onboarding tests
async function runCustomerOnboardingTests() {
  console.log('🚀 Starting Customer Onboarding Tests...\n');
  
  if (!authToken) {
    console.error('❌ Please set auth token first using setAuthToken(token)');
    return;
  }
  
  // Check initial status
  await testOnboardingStatus();
  
  // Complete onboarding
  await testCustomerOnboarding();
  
  // Get profile
  await testGetCustomerProfile();
  
  // Update profile
  await testUpdateCustomerProfile();
  
  // Check status again
  await testOnboardingStatus();
  
  console.log('\n🎉 Customer onboarding tests completed!');
}

// Run admin knowledge base tests
async function runKnowledgeBaseTests() {
  console.log('🚀 Starting Knowledge Base Tests...\n');
  
  if (!authToken) {
    console.error('❌ Please set auth token first using setAuthToken(token)');
    console.error('❌ Make sure to use an ADMIN token from an organization signup');
    return;
  }
  
  // Upload document
  await testKnowledgeBaseUpload();
  
  // Get documents
  await testGetKnowledgeBase();
  
  console.log('\n🎉 Knowledge base tests completed!');
}

// Run all Phase 2 tests
async function runAllPhase2Tests() {
  console.log('🚀 Starting All Phase 2 Tests...\n');
  
  if (!authToken) {
    console.error('❌ Please set auth token first using setAuthToken(token)');
    return;
  }
  
  await runCustomerOnboardingTests();
  console.log('\n' + '='.repeat(50) + '\n');
  await runKnowledgeBaseTests();
  
  console.log('\n🎉 All Phase 2 tests completed!');
}

console.log('📋 Phase 2: Onboarding API Test Suite Ready!');
console.log('');
console.log('Instructions:');
console.log('1. First, complete Phase 1 authentication and get tokens');
console.log('2. For Customer tests: setAuthToken("customer_token_here")');
console.log('3. Run: runCustomerOnboardingTests()');
console.log('4. For Admin tests: setAuthToken("admin_token_here")');
console.log('5. Run: runKnowledgeBaseTests()');
console.log('6. Or run all: runAllPhase2Tests()');

// Export functions for global access
window.setAuthToken = setAuthToken;
window.runCustomerOnboardingTests = runCustomerOnboardingTests;
window.runKnowledgeBaseTests = runKnowledgeBaseTests;
window.runAllPhase2Tests = runAllPhase2Tests;
