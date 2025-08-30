// Test script for Phase 4: AI Service Integration APIs
// Make sure to have valid JWT tokens from previous phases

const API_BASE = 'http://localhost:3000/api';

// You'll need tokens from Phase 1 authentication
let authToken = ''; // Set this after login
let currentSessionId = ''; // Will be set after first chat

// Test 1: AI Chat - Start New Session
async function testStartNewChat() {
  console.log('🧪 Testing AI Chat - New Session...');
  
  try {
    const response = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello! Can you help me understand investment portfolio diversification?',
        context: {
          analysisType: 'INVESTMENT_ANALYSIS'
        }
      }),
    });

    const result = await response.json();
    console.log('✅ New Chat Response:', result);
    
    if (result.success && result.data.sessionId) {
      currentSessionId = result.data.sessionId;
      console.log('📝 Session ID saved:', currentSessionId);
    }
    
    return result;
  } catch (error) {
    console.error('❌ New Chat Error:', error);
  }
}

// Test 2: AI Chat - Continue Session
async function testContinueChat() {
  console.log('🧪 Testing AI Chat - Continue Session...');
  
  if (!currentSessionId) {
    console.error('❌ No session ID available. Run testStartNewChat first.');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'What are the key principles I should follow for risk management?',
        sessionId: currentSessionId,
      }),
    });

    const result = await response.json();
    console.log('✅ Continue Chat Response:', result);
    return result;
  } catch (error) {
    console.error('❌ Continue Chat Error:', error);
  }
}

// Test 3: Get AI Sessions List
async function testGetAISessions() {
  console.log('🧪 Testing Get AI Sessions List...');
  
  try {
    const response = await fetch(`${API_BASE}/ai/sessions?limit=10`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    console.log('✅ AI Sessions List Response:', result);
    return result;
  } catch (error) {
    console.error('❌ Get AI Sessions Error:', error);
  }
}

// Test 4: Get Specific AI Session Details
async function testGetSessionDetails() {
  console.log('🧪 Testing Get Session Details...');
  
  if (!currentSessionId) {
    console.error('❌ No session ID available. Run testStartNewChat first.');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/ai/sessions?sessionId=${currentSessionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    console.log('✅ Session Details Response:', result);
    return result;
  } catch (error) {
    console.error('❌ Get Session Details Error:', error);
  }
}

// Test 5: Update Session Title
async function testUpdateSessionTitle() {
  console.log('🧪 Testing Update Session Title...');
  
  if (!currentSessionId) {
    console.error('❌ No session ID available. Run testStartNewChat first.');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/ai/sessions`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: currentSessionId,
        sessionTitle: 'Investment Strategy Discussion - Updated'
      }),
    });

    const result = await response.json();
    console.log('✅ Update Session Title Response:', result);
    return result;
  } catch (error) {
    console.error('❌ Update Session Title Error:', error);
  }
}

// Test 6: Document Analysis (Requires organization token and document)
async function testDocumentAnalysis(documentId = 'test-doc-id') {
  console.log('🧪 Testing Document Analysis...');
  
  try {
    // Start analysis
    const response = await fetch(`${API_BASE}/ai/analyze-document`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentId: documentId,
        analysisType: 'INVESTMENT_ANALYSIS'
      }),
    });

    const result = await response.json();
    console.log('✅ Document Analysis Start Response:', result);
    return result;
  } catch (error) {
    console.error('❌ Document Analysis Error:', error);
  }
}

// Test 7: Check Document Analysis Status
async function testAnalysisStatus(documentId = 'test-doc-id') {
  console.log('🧪 Testing Analysis Status...');
  
  try {
    const response = await fetch(`${API_BASE}/ai/analyze-document?documentId=${documentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    console.log('✅ Analysis Status Response:', result);
    return result;
  } catch (error) {
    console.error('❌ Analysis Status Error:', error);
  }
}

// Test 8: Get Investment Tips
async function testGetInvestmentTips() {
  console.log('🧪 Testing Get Investment Tips...');
  
  try {
    const response = await fetch(`${API_BASE}/ai/investment-tips?personalized=true&limit=5`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    console.log('✅ Investment Tips Response:', result);
    return result;
  } catch (error) {
    console.error('❌ Investment Tips Error:', error);
  }
}

// Test 9: Generate Personalized Investment Tips
async function testGenerateInvestmentTips() {
  console.log('🧪 Testing Generate Investment Tips...');
  
  try {
    const response = await fetch(`${API_BASE}/ai/investment-tips`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        riskAppetite: 'MODERATE',
        categories: ['PORTFOLIO_OPTIMIZATION', 'RISK_MANAGEMENT'],
        marketConditions: 'volatile'
      }),
    });

    const result = await response.json();
    console.log('✅ Generate Tips Response:', result);
    return result;
  } catch (error) {
    console.error('❌ Generate Tips Error:', error);
  }
}

// Test 10: Delete AI Session
async function testDeleteSession() {
  console.log('🧪 Testing Delete AI Session...');
  
  if (!currentSessionId) {
    console.error('❌ No session ID available. Run testStartNewChat first.');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/ai/sessions?sessionId=${currentSessionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    console.log('✅ Delete Session Response:', result);
    return result;
  } catch (error) {
    console.error('❌ Delete Session Error:', error);
  }
}

// Helper function to set auth token
function setAuthToken(token) {
  authToken = token;
  console.log('✅ Auth token set for AI API testing');
}

// Run AI chat flow tests
async function runAIChatTests() {
  console.log('🚀 Starting AI Chat Flow Tests...\n');
  
  if (!authToken) {
    console.error('❌ Please set auth token first using setAuthToken(token)');
    return;
  }
  
  // Test complete chat flow
  await testStartNewChat();
  console.log('\n' + '-'.repeat(30) + '\n');
  
  await testContinueChat();
  console.log('\n' + '-'.repeat(30) + '\n');
  
  await testGetAISessions();
  console.log('\n' + '-'.repeat(30) + '\n');
  
  await testGetSessionDetails();
  console.log('\n' + '-'.repeat(30) + '\n');
  
  await testUpdateSessionTitle();
  console.log('\n' + '-'.repeat(30) + '\n');
  
  console.log('\n🎉 AI Chat tests completed!');
}

// Run document analysis tests
async function runDocumentAnalysisTests() {
  console.log('🚀 Starting Document Analysis Tests...\n');
  
  if (!authToken) {
    console.error('❌ Please set auth token first using setAuthToken(token)');
    console.error('❌ Make sure to use an organization token (not customer)');
    return;
  }
  
  // Test document analysis flow
  await testDocumentAnalysis();
  console.log('\n' + '-'.repeat(30) + '\n');
  
  // Wait a moment then check status
  console.log('⏱️ Waiting 2 seconds before checking status...');
  setTimeout(async () => {
    await testAnalysisStatus();
  }, 2000);
  
  console.log('\n🎉 Document analysis tests completed!');
}

// Run investment tips tests
async function runInvestmentTipsTests() {
  console.log('🚀 Starting Investment Tips Tests...\n');
  
  if (!authToken) {
    console.error('❌ Please set auth token first using setAuthToken(token)');
    return;
  }
  
  // Test investment tips flow
  await testGetInvestmentTips();
  console.log('\n' + '-'.repeat(30) + '\n');
  
  await testGenerateInvestmentTips();
  console.log('\n' + '-'.repeat(30) + '\n');
  
  // Get tips again to see new ones
  await testGetInvestmentTips();
  
  console.log('\n🎉 Investment tips tests completed!');
}

// Run all Phase 4 tests
async function runAllPhase4Tests() {
  console.log('🚀 Starting All Phase 4: AI Integration Tests...\n');
  
  if (!authToken) {
    console.error('❌ Please set auth token first using setAuthToken(token)');
    return;
  }
  
  await runAIChatTests();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await runInvestmentTipsTests();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await runDocumentAnalysisTests();
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Clean up - delete session
  if (currentSessionId) {
    console.log('🧹 Cleaning up - deleting test session...');
    await testDeleteSession();
  }
  
  console.log('\n🎉 All Phase 4 tests completed!');
}

console.log('📋 Phase 4: AI Service Integration Test Suite Ready!');
console.log('');
console.log('Instructions:');
console.log('1. Make sure FastAPI service is running (or tests will use fallback responses)');
console.log('2. Set auth token: setAuthToken("your_token_here")');
console.log('3. Run AI chat tests: runAIChatTests()');
console.log('4. Run investment tips tests: runInvestmentTipsTests()');
console.log('5. Run document analysis tests: runDocumentAnalysisTests() (org token needed)');
console.log('6. Or run all: runAllPhase4Tests()');

// Export functions for global access
window.setAuthToken = setAuthToken;
window.runAIChatTests = runAIChatTests;
window.runInvestmentTipsTests = runInvestmentTipsTests;
window.runDocumentAnalysisTests = runDocumentAnalysisTests;
window.runAllPhase4Tests = runAllPhase4Tests;
