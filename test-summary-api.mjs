#!/usr/bin/env node

/**
 * Test script to diagnose summary generation issues
 * Run with: node test-summary-api.mjs
 */

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3001';

async function testSummaryAPI() {
  console.log('🔍 Testing Summary API...\n');

  const testData = {
    transcript: "This is a test transcript to verify the summary generation is working.",
    userNotes: "Test notes"
  };

  try {
    console.log(`📡 Sending request to: ${API_BASE_URL}/api/gemini/summary`);
    console.log('📝 Request payload:', JSON.stringify(testData, null, 2));

    const response = await fetch(`${API_BASE_URL}/api/gemini/summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log(`\n📊 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      process.exit(1);
    }

    const data = await response.json();
    console.log('\n✅ Success! Summary generated:');
    console.log('─'.repeat(60));
    console.log(data.text || '(empty response)');
    console.log('─'.repeat(60));

  } catch (error) {
    console.error('\n❌ Error occurred:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    process.exit(1);
  }
}

testSummaryAPI();
