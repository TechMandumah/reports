// Test the debug citation relationship endpoint
// Run this in a browser console or test tool

async function testCitationRelationship() {
  try {
    const response = await fetch('/api/debug-citation-relationship', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        journalNumbers: ['1433060', '1433079']
      })
    });
    
    const result = await response.json();
    console.log('🔍 Citation Relationship Debug Results:', result);
    
    // Analyze which method found citations
    console.log('\n📊 Search Method Analysis:');
    Object.entries(result.searchResults).forEach(([method, data]) => {
      if (data.count > 0) {
        console.log(`✅ ${method}: Found ${data.count} citations`);
        console.log(`   Sample biblios: ${data.sample_biblios}`);
      } else {
        console.log(`❌ ${method}: No citations found`);
      }
    });
    
    return result;
    
  } catch (error) {
    console.error('🚨 Debug test failed:', error);
    return null;
  }
}

// For command line testing with curl:
/*
curl -X POST http://localhost:3000/api/debug-citation-relationship \
  -H "Content-Type: application/json" \
  -d '{"journalNumbers": ["1433060", "1433079"]}'
*/

// Usage instructions:
console.log('To test citation relationship:');
console.log('1. Start your dev server: npm run dev');
console.log('2. Run: testCitationRelationship()');
console.log('3. Or use curl command above');