/**
 * Course Seeder
 * Run this script to populate the database with sample courses
 *
 * Usage: node src/seeders/seed-courses.js
 */

const { Course } = require('../models');
const { sequelize } = require('../config/database');

const sampleCourses = [
  {
    title: 'Flutter Development Fundamentals',
    description: 'Learn the basics of Flutter development from scratch. This comprehensive course covers widgets, state management, navigation, and more.',
    category: 'Development',
    duration: 20,
    level: 'beginner',
    instructorName: 'John Smith',
    maxEnrollments: 50,
    thumbnailUrl: 'https://picsum.photos/seed/flutter1/400/300',
    isActive: true,
    content: {
      modules: [
        {
          id: 1,
          title: 'Introduction to Flutter',
          lessons: [
            { id: 1, title: 'What is Flutter?', duration: 15 },
            { id: 2, title: 'Setting up your environment', duration: 30 },
            { id: 3, title: 'Your first Flutter app', duration: 45 }
          ]
        },
        {
          id: 2,
          title: 'Flutter Widgets',
          lessons: [
            { id: 1, title: 'StatelessWidget vs StatefulWidget', duration: 30 },
            { id: 2, title: 'Common widgets', duration: 60 },
            { id: 3, title: 'Building layouts', duration: 45 }
          ]
        }
      ]
    }
  },
  {
    title: 'Advanced State Management with Riverpod',
    description: 'Master state management in Flutter using Riverpod. Learn about providers, state notifiers, and best practices.',
    category: 'Development',
    duration: 15,
    level: 'advanced',
    instructorName: 'Sarah Johnson',
    maxEnrollments: 30,
    thumbnailUrl: 'https://picsum.photos/seed/riverpod/400/300',
    isActive: true,
    content: {
      modules: [
        {
          id: 1,
          title: 'Introduction to Riverpod',
          lessons: [
            { id: 1, title: 'Why Riverpod?', duration: 20 },
            { id: 2, title: 'Provider types', duration: 40 }
          ]
        }
      ]
    }
  },
  {
    title: 'UI/UX Design Principles',
    description: 'Learn the fundamentals of user interface and user experience design. Create beautiful and intuitive applications.',
    category: 'Design',
    duration: 12,
    level: 'beginner',
    instructorName: 'Emily Davis',
    maxEnrollments: 40,
    thumbnailUrl: 'https://picsum.photos/seed/uiux/400/300',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    materialUrl: 'https://www.example.com/uiux-guide.pdf',
    isActive: true,
    content: {
      modules: [
        {
          id: 1,
          title: 'Design Fundamentals',
          lessons: [
            { id: 1, title: 'Introduction to UI/UX', duration: 20, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            { id: 2, title: 'Color Theory', duration: 30, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            { id: 3, title: 'Typography Basics', duration: 25, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
          ]
        },
        {
          id: 2,
          title: 'User Research',
          lessons: [
            { id: 1, title: 'Understanding Users', duration: 35, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            { id: 2, title: 'Creating User Personas', duration: 40, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
          ]
        }
      ]
    }
  },
  {
    title: 'RESTful API Development with Node.js',
    description: 'Build scalable RESTful APIs using Node.js and Express. Learn about middleware, authentication, and database integration.',
    category: 'Backend',
    duration: 25,
    level: 'intermediate',
    instructorName: 'Michael Brown',
    maxEnrollments: 35,
    thumbnailUrl: 'https://picsum.photos/seed/nodejs/400/300',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    materialUrl: 'https://www.example.com/nodejs-api-guide.pdf',
    isActive: true,
    content: {
      modules: [
        {
          id: 1,
          title: 'Getting Started with Node.js',
          lessons: [
            { id: 1, title: 'Introduction to Node.js', duration: 25, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            { id: 2, title: 'Setting up Express', duration: 30, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            { id: 3, title: 'Building your first API', duration: 45, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
          ]
        },
        {
          id: 2,
          title: 'Authentication & Security',
          lessons: [
            { id: 1, title: 'JWT Authentication', duration: 40, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            { id: 2, title: 'API Security Best Practices', duration: 35, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
          ]
        }
      ]
    }
  },
  {
    title: 'Git & Version Control Mastery',
    description: 'Master Git version control from basic commands to advanced workflows. Learn branching, merging, and collaboration.',
    category: 'Tools',
    duration: 8,
    level: 'beginner',
    instructorName: 'David Wilson',
    maxEnrollments: 60,
    thumbnailUrl: 'https://picsum.photos/seed/git/400/300',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    materialUrl: 'https://www.example.com/git-cheatsheet.pdf',
    isActive: true,
    content: {
      modules: [
        {
          id: 1,
          title: 'Git Basics',
          lessons: [
            { id: 1, title: 'What is Version Control?', duration: 15, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            { id: 2, title: 'Git Commands Essentials', duration: 30, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            { id: 3, title: 'Working with Remotes', duration: 25, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
          ]
        },
        {
          id: 2,
          title: 'Advanced Git',
          lessons: [
            { id: 1, title: 'Branching Strategies', duration: 35, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            { id: 2, title: 'Resolving Conflicts', duration: 40, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
          ]
        }
      ]
    }
  },
  {
    title: 'Mobile App Security Best Practices',
    description: 'Learn how to secure your mobile applications. Covers encryption, authentication, secure storage, and OWASP guidelines.',
    category: 'Security',
    duration: 18,
    level: 'advanced',
    instructorName: 'Lisa Anderson',
    maxEnrollments: 25,
    thumbnailUrl: 'https://picsum.photos/seed/security/400/300',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    materialUrl: 'https://www.example.com/mobile-security-guide.pdf',
    isActive: true,
    content: {
      modules: [
        {
          id: 1,
          title: 'Security Fundamentals',
          lessons: [
            { id: 1, title: 'Mobile Security Landscape', duration: 30, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            { id: 2, title: 'OWASP Mobile Top 10', duration: 45, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
          ]
        },
        {
          id: 2,
          title: 'Encryption & Storage',
          lessons: [
            { id: 1, title: 'Data Encryption Techniques', duration: 50, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            { id: 2, title: 'Secure Storage Implementation', duration: 40, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
          ]
        }
      ]
    }
  },
  {
    title: 'Agile & Scrum Fundamentals',
    description: 'Understand Agile methodology and Scrum framework. Learn about sprints, stand-ups, and iterative development.',
    category: 'Management',
    duration: 10,
    level: 'beginner',
    instructorName: 'Robert Taylor',
    maxEnrollments: 50,
    thumbnailUrl: 'https://picsum.photos/seed/agile/400/300',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    materialUrl: 'https://www.example.com/agile-handbook.pdf',
    isActive: true,
    content: {
      modules: [
        {
          id: 1,
          title: 'Agile Methodology',
          lessons: [
            { id: 1, title: 'Introduction to Agile', duration: 20, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            { id: 2, title: 'Agile Principles', duration: 25, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
          ]
        },
        {
          id: 2,
          title: 'Scrum Framework',
          lessons: [
            { id: 1, title: 'Scrum Roles & Ceremonies', duration: 30, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            { id: 2, title: 'Sprint Planning & Execution', duration: 35, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
          ]
        }
      ]
    }
  },
  {
    title: 'Database Design & Optimization',
    description: 'Learn database design principles, normalization, indexing, and query optimization techniques.',
    category: 'Database',
    duration: 22,
    level: 'intermediate',
    instructorName: 'Jennifer Martinez',
    maxEnrollments: 30,
    thumbnailUrl: 'https://picsum.photos/seed/database/400/300',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    materialUrl: 'https://www.example.com/database-design.pdf',
    isActive: true,
    content: {
      modules: [
        {
          id: 1,
          title: 'Database Design',
          lessons: [
            { id: 1, title: 'Database Normalization', duration: 40, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            { id: 2, title: 'ER Modeling', duration: 35, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
          ]
        },
        {
          id: 2,
          title: 'Performance Optimization',
          lessons: [
            { id: 1, title: 'Indexing Strategies', duration: 45, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            { id: 2, title: 'Query Optimization', duration: 50, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
          ]
        }
      ]
    }
  },
  {
    title: 'Cloud Computing with AWS',
    description: 'Introduction to Amazon Web Services. Learn about EC2, S3, Lambda, and deploying scalable applications.',
    category: 'Cloud',
    duration: 30,
    level: 'intermediate',
    instructorName: 'Chris Anderson',
    maxEnrollments: 40,
    thumbnailUrl: 'https://picsum.photos/seed/aws/400/300',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    materialUrl: 'https://www.example.com/aws-guide.pdf',
    isActive: true,
    content: {
      modules: [
        {
          id: 1,
          title: 'AWS Fundamentals',
          lessons: [
            { id: 1, title: 'Introduction to AWS', duration: 30, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            { id: 2, title: 'AWS Core Services', duration: 45, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
          ]
        },
        {
          id: 2,
          title: 'Deploying Applications',
          lessons: [
            { id: 1, title: 'EC2 & Load Balancing', duration: 50, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            { id: 2, title: 'S3 & CloudFront', duration: 40, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            { id: 3, title: 'Lambda Functions', duration: 55, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
          ]
        }
      ]
    }
  },
  {
    title: 'Machine Learning Basics',
    description: 'Get started with machine learning. Understand algorithms, training models, and practical applications.',
    category: 'AI/ML',
    duration: 35,
    level: 'advanced',
    instructorName: 'Dr. Patricia Lee',
    maxEnrollments: 20,
    thumbnailUrl: 'https://picsum.photos/seed/ml/400/300',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    materialUrl: 'https://www.example.com/ml-guide.pdf',
    isActive: true,
    content: {
      modules: [
        {
          id: 1,
          title: 'Introduction to Machine Learning',
          lessons: [
            { id: 1, title: 'What is Machine Learning?', duration: 40, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            { id: 2, title: 'Types of ML Algorithms', duration: 50, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
          ]
        },
        {
          id: 2,
          title: 'Building ML Models',
          lessons: [
            { id: 1, title: 'Data Preparation', duration: 45, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            { id: 2, title: 'Training & Evaluation', duration: 60, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
            { id: 3, title: 'Model Deployment', duration: 55, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
          ]
        }
      ]
    }
  }
];

async function seedCourses() {
  try {
    console.log('🌱 Starting course seeding...\n');

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Get the first organization and admin user from database
    const [organizations] = await sequelize.query('SELECT id FROM "Organizations" LIMIT 1');
    const [users] = await sequelize.query('SELECT id FROM "Users" WHERE role IN (\'admin\', \'hr\', \'manager\') LIMIT 1');

    if (!organizations || organizations.length === 0) {
      console.log('❌ No organizations found in database. Please create an organization first.');
      process.exit(1);
    }

    if (!users || users.length === 0) {
      console.log('❌ No admin/hr/manager users found. Please create a user with appropriate role.');
      process.exit(1);
    }

    const organizationId = organizations[0].id;
    const createdBy = users[0].id;

    console.log(`✅ Using organizationId: ${organizationId}`);
    console.log(`✅ Using createdBy: ${createdBy}\n`);

    // Delete existing courses (optional - comment out if you want to keep existing)
    // await Course.destroy({ where: {} });
    // console.log('🗑️  Cleared existing courses');

    // Create sample courses
    let created = 0;
    for (const courseData of sampleCourses) {
      try {
        await Course.create({
          ...courseData,
          organizationId,
          createdBy
        });
        created++;
        console.log(`✅ Created: ${courseData.title}`);
      } catch (error) {
        console.log(`❌ Failed to create: ${courseData.title} - ${error.message}`);
      }
    }

    console.log(`\n🎉 Successfully created ${created} out of ${sampleCourses.length} courses`);
    console.log('✅ Course seeding completed!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding courses:', error);
    process.exit(1);
  }
}

// Run the seeder
seedCourses();
