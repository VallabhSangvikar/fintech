// Test script for authentication APIs
// Run this in a browser console or use a REST client like Postman

const API_BASE = 'http://localhost:3000/api';

// Test 1: Signup API
async function testSignup() {
  console.log('🧪 Testing Signup API...');
  
  try {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        full_name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'securepassword123',
        role: 'Customer'
      }),
    });

    const result = await response.json();
    console.log('✅ Signup Response:', result);
    return result;
  } catch (error) {
    console.error('❌ Signup Error:', error);
  }
}

// Test 2: Login API
async function testLogin() {
  console.log('🧪 Testing Login API...');
  
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'john.doe@example.com',
        password: 'securepassword123'
      }),
    });

    const result = await response.json();
    console.log('✅ Login Response:', result);
    return result;
  } catch (error) {
    console.error('❌ Login Error:', error);
  }
}

// Test 3: Get Current User API
async function testGetCurrentUser(token) {
  console.log('🧪 Testing Get Current User API...');
  
  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    console.log('✅ Current User Response:', result);
    return result;
  } catch (error) {
    console.error('❌ Get Current User Error:', error);
  }
}

// Test 4: Logout API
async function testLogout(token) {
  console.log('🧪 Testing Logout API...');
  
  try {
    const response = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    console.log('✅ Logout Response:', result);
    return result;
  } catch (error) {
    console.error('❌ Logout Error:', error);
  }
}

// Test 5: Organization Signup (Investment Firm)
async function testOrganizationSignup() {
  console.log('🧪 Testing Organization Signup API...');
  
  try {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        full_name: 'Jane Smith',
        email: 'jane.smith@investmentfirm.com',
        password: 'securepassword456',
        role: 'Investment',
        organization_name: 'Smith Investment Partners'
      }),
    });

    const result = await response.json();
    console.log('✅ Organization Signup Response:', result);
    return result;
  } catch (error) {
    console.error('❌ Organization Signup Error:', error);
  }
}

// Run all tests in sequence
async function runAllTests() {
  console.log('🚀 Starting Authentication API Tests...\n');
  
  // Test customer signup
  const customerSignup = await testSignup();
  
  if (customerSignup?.success) {
    // Test login
    const loginResult = await testLogin();
    
    if (loginResult?.success) {
      const token = loginResult.data.token;
      
      // Test get current user
      await testGetCurrentUser(token);
      
      // Test logout
      await testLogout(token);
    }
  }
  
  // Test organization signup
  await testOrganizationSignup();
  
  console.log('\n🎉 All tests completed!');
}

// Uncomment the line below to run tests
// runAllTests();

// Or run individual tests:
// testSignup();
// testLogin();

console.log('📋 Authentication API Test Suite Ready!');
console.log('Open browser console and call runAllTests() or individual test functions');
