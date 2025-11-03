const axios = require('axios');
require('dotenv').config();

async function testPerplexityAPI() {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  const apiUrl = process.env.PERPLEXITY_API_URL || 'https://api.perplexity.ai';
  const model = process.env.PERPLEXITY_MODEL || 'sonar-pro';

  console.log('Testing Perplexity API...');
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET');
  console.log('API URL:', apiUrl);
  console.log('Model:', model);
  console.log('---');

  // Test 1: Simple request without system message
  console.log('\n📝 Test 1: Simple request (no system message)');
  try {
    const response1 = await axios.post(
      `${apiUrl}/chat/completions`,
      {
        model: model,
        messages: [
          { role: 'user', content: 'Hello, what can you help me with?' }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    console.log('✅ Test 1 PASSED');
    console.log('Response:', response1.data.choices[0].message.content.substring(0, 100) + '...');
  } catch (error) {
    console.log('❌ Test 1 FAILED');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
  }

  // Test 2: Request with system message
  console.log('\n📝 Test 2: Request with system message');
  try {
    const response2 = await axios.post(
      `${apiUrl}/chat/completions`,
      {
        model: model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello!' }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    console.log('✅ Test 2 PASSED');
    console.log('Response:', response2.data.choices[0].message.content.substring(0, 100) + '...');
  } catch (error) {
    console.log('❌ Test 2 FAILED');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
  }

  // Test 3: Request with max_tokens
  console.log('\n📝 Test 3: Request with max_tokens parameter');
  try {
    const response3 = await axios.post(
      `${apiUrl}/chat/completions`,
      {
        model: model,
        messages: [
          { role: 'user', content: 'Hello!' }
        ],
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    console.log('✅ Test 3 PASSED');
    console.log('Response:', response3.data.choices[0].message.content.substring(0, 100) + '...');
  } catch (error) {
    console.log('❌ Test 3 FAILED');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
  }

  // Test 4: Full request (system + user + parameters)
  console.log('\n📝 Test 4: Full request (system + user + all parameters)');
  try {
    const response4 = await axios.post(
      `${apiUrl}/chat/completions`,
      {
        model: model,
        messages: [
          { role: 'system', content: 'You are a helpful HR assistant.' },
          { role: 'user', content: 'How do I apply for leave?' }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    console.log('✅ Test 4 PASSED');
    console.log('Response:', response4.data.choices[0].message.content.substring(0, 100) + '...');
  } catch (error) {
    console.log('❌ Test 4 FAILED');
    console.log('Status:', error.response?.status);
    console.log('Error:', JSON.stringify(error.response?.data, null, 2) || error.message);
  }

  console.log('\n--- Tests Complete ---');
}

testPerplexityAPI().catch(console.error);
