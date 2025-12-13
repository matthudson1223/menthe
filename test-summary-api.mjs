#!/usr/bin/env node

/**
 * Test script to diagnose summary generation issues
 * Run with: node test-summary-api.mjs [output-file]
 *
 * Examples:
 *   node test-summary-api.mjs
 *   node test-summary-api.mjs error-report.txt
 */

import fs from 'fs';

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3001';
const OUTPUT_FILE = process.argv[2];

let output = [];

function log(message) {
  console.log(message);
  output.push(message);
}

async function testSummaryAPI() {
  log('🔍 Testing Summary API...\n');
  log(`Timestamp: ${new Date().toISOString()}\n`);

  const testData = {
    transcript: "This is a test transcript to verify the summary generation is working.",
    userNotes: "Test notes"
  };

  try {
    log(`📡 Sending request to: ${API_BASE_URL}/api/gemini/summary`);
    log('📝 Request payload:');
    log(JSON.stringify(testData, null, 2));

    const response = await fetch(`${API_BASE_URL}/api/gemini/summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    log(`\n📊 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      log('❌ API Error Response:');
      log(errorText);

      if (OUTPUT_FILE) {
        fs.writeFileSync(OUTPUT_FILE, output.join('\n'));
        log(`\n📄 Error report saved to: ${OUTPUT_FILE}`);
      }

      process.exit(1);
    }

    const data = await response.json();
    log('\n✅ Success! Summary generated:');
    log('─'.repeat(60));
    log(data.text || '(empty response)');
    log('─'.repeat(60));

    if (OUTPUT_FILE) {
      fs.writeFileSync(OUTPUT_FILE, output.join('\n'));
      log(`\n📄 Report saved to: ${OUTPUT_FILE}`);
    }

  } catch (error) {
    log('\n❌ Error occurred:');
    log(`Message: ${error.message}`);
    if (error.cause) {
      log(`Cause: ${error.cause}`);
    }
    if (error.stack) {
      log(`\nStack trace:\n${error.stack}`);
    }

    if (OUTPUT_FILE) {
      fs.writeFileSync(OUTPUT_FILE, output.join('\n'));
      log(`\n📄 Error report saved to: ${OUTPUT_FILE}`);
    }

    process.exit(1);
  }
}

testSummaryAPI();
