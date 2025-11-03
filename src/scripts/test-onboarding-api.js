require('dotenv').config();
const axios = require('axios');
const { User } = require('../models');

const API_URL = process.env.API_URL || 'http://localhost:5000';

async function testOnboardingAPI() {
  try {
    console.log('🧪 TESTING ONBOARDING API\n');
    console.log('═'.repeat(60));

    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
      console.log('\n❌ Usage: node test-onboarding-api.js <EMAIL> <PASSWORD>\n');
      console.log('Example:');
      console.log('  node src/scripts/test-onboarding-api.js user@example.com password123\n');
      process.exit(1);
    }

    // Step 1: Login
    console.log('🔐 Step 1: Logging in...');
    console.log(`   Email: ${email}`);

    const loginResponse = await axios.post(`${API_URL}/api/v1/auth/login`, {
      email,
      password
    });

    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data.message);
      process.exit(1);
    }

    const token = loginResponse.data.data.accessToken;
    const user = loginResponse.data.data.user;

    console.log('✅ Login successful');
    console.log(`   User: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Organization ID: ${user.organizationId}\n`);

    // Step 2: Fetch onboarding tasks
    console.log('📋 Step 2: Fetching onboarding tasks...');

    const tasksResponse = await axios.get(`${API_URL}/api/v1/onboarding`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!tasksResponse.data.success) {
      console.error('❌ Failed to fetch tasks:', tasksResponse.data.message);
      process.exit(1);
    }

    const tasks = tasksResponse.data.data;
    const stats = tasksResponse.data.stats;

    console.log('✅ Tasks fetched successfully\n');

    console.log('📊 STATISTICS:');
    console.log('─'.repeat(60));
    console.log(`Total Tasks: ${stats.total}`);
    console.log(`Completed: ${stats.completed}`);
    console.log(`Pending: ${stats.pending}`);
    console.log(`Progress: ${stats.percentage}%\n`);

    if (tasks.length === 0) {
      console.log('❌ NO TASKS FOUND!');
      console.log('\nThis means the user\'s organization has no OnboardingTask records.');
      console.log('To fix this, run:');
      console.log(`  node src/scripts/seed-onboarding-for-org.js ${user.organizationId}\n`);
      process.exit(0);
    }

    console.log('📝 TASKS:');
    console.log('─'.repeat(60));
    tasks.forEach((task, i) => {
      const status = task.completed ? '✅' : '⬜';
      const mandatory = task.mandatory ? '[MANDATORY]' : '[OPTIONAL]';
      console.log(`${i + 1}. ${status} ${task.title} ${mandatory}`);
      console.log(`   Category: ${task.category} | Priority: ${task.priority}`);
      if (task.dueDate) {
        console.log(`   Due: ${new Date(task.dueDate).toLocaleDateString()}`);
      }
      if (task.completedAt) {
        console.log(`   Completed: ${new Date(task.completedAt).toLocaleDateString()}`);
      }
      console.log('');
    });

    // Step 3: Test marking a task as complete
    if (tasks.length > 0 && !tasks[0].completed) {
      console.log('🧪 Step 3: Testing task completion...');
      const taskToComplete = tasks[0];

      const updateResponse = await axios.put(
        `${API_URL}/api/v1/onboarding/${taskToComplete._id}`,
        { completed: true, notes: 'Completed via API test' },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (updateResponse.data.success) {
        console.log(`✅ Successfully marked "${taskToComplete.title}" as complete\n`);
      } else {
        console.log(`❌ Failed to update task: ${updateResponse.data.message}\n`);
      }
    }

    // Step 4: Get progress summary
    console.log('📈 Step 4: Fetching progress summary...');

    const progressResponse = await axios.get(`${API_URL}/api/v1/onboarding/progress`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (progressResponse.data.success) {
      const progress = progressResponse.data.data;
      console.log('✅ Progress fetched');
      console.log(`   ${progress.completed}/${progress.total} tasks (${progress.percentage}%)\n`);
    }

    console.log('═'.repeat(60));
    console.log('✅ ALL TESTS PASSED!\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testOnboardingAPI();
