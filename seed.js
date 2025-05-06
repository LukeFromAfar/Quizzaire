const mongoose = require('mongoose');
const argon2 = require('argon2');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Import models
const User = require('./models/User');
const Quiz = require('./models/Quiz');

// Sample quiz data
const quizzes = [
  {
    title: 'Programming Fundamentals',
    description: 'Test your knowledge of programming basics, including variables, loops, and functions.',
    category: 'programming',
    isPublic: true,
    tags: ['javascript', 'python', 'programming', 'basics'],
    questions: [
      {
        questionText: 'True or False: A variable in programming is a value that, once set, cannot be changed.',
        questionType: 'true-false',
        options: [
          { optionText: 'True', isCorrect: false },
          { optionText: 'False', isCorrect: true }
        ],
        points: 10,
        timeLimit: 20
      },
      {
        questionText: 'Which of the following is a loop structure?',
        questionType: 'multiple-choice',
        options: [
          { optionText: 'if-else', isCorrect: false },
          { optionText: 'for', isCorrect: true },
          { optionText: 'switch', isCorrect: false },
          { optionText: 'array', isCorrect: false }
        ],
        points: 10,
        timeLimit: 30
      },
      {
        questionText: 'What does the "return" keyword do in a function?',
        questionType: 'multiple-choice',
        options: [
          { optionText: 'Ends the program', isCorrect: false },
          { optionText: 'Outputs values to the console', isCorrect: false },
          { optionText: 'Specifies the value to be returned from the function', isCorrect: true },
          { optionText: 'Creates a loop', isCorrect: false }
        ],
        points: 15,
        timeLimit: 45
      },
      {
        questionText: 'In JavaScript, what is the correct way to declare a variable that cannot be changed?',
        questionType: 'multiple-choice',
        options: [
          { optionText: 'var', isCorrect: false },
          { optionText: 'let', isCorrect: false },
          { optionText: 'const', isCorrect: true },
          { optionText: 'static', isCorrect: false }
        ],
        points: 10,
        timeLimit: 30
      },
      {
        questionText: 'What is the result of 5 + "5" in JavaScript?',
        questionType: 'short-answer',
        correctAnswer: '55',
        options: [
          { optionText: 'Not applicable for short answer', isCorrect: false },
          { optionText: 'Not applicable for short answer', isCorrect: false }
        ],
        points: 20,
        timeLimit: 40
      }
    ]
  },
  {
    title: 'Networking Basics',
    description: 'Learn about network protocols, IP addressing, and basic networking concepts.',
    category: 'networking',
    isPublic: true,
    tags: ['networking', 'ip', 'protocols', 'internet'],
    questions: [
      {
        questionText: 'What does IP stand for in networking?',
        questionType: 'multiple-choice',
        options: [
          { optionText: 'Internet Protocol', isCorrect: true },
          { optionText: 'Internet Provider', isCorrect: false },
          { optionText: 'Internal Protocol', isCorrect: false },
          { optionText: 'Interface Port', isCorrect: false }
        ],
        points: 10,
        timeLimit: 30
      },
      {
        questionText: 'True or False: HTTP is the primary protocol used for secure web browsing.',
        questionType: 'true-false',
        options: [
          { optionText: 'True', isCorrect: false },
          { optionText: 'False', isCorrect: true }
        ],
        points: 10,
        timeLimit: 20
      },
      {
        questionText: 'What is the default port number for HTTP?',
        questionType: 'short-answer',
        correctAnswer: '80',
        options: [
          { optionText: 'Not applicable for short answer', isCorrect: false },
          { optionText: 'Not applicable for short answer', isCorrect: false }
        ],
        points: 15,
        timeLimit: 30
      },
      {
        questionText: 'Which of the following is a private IP address range?',
        questionType: 'multiple-choice',
        options: [
          { optionText: '1.0.0.0 - 1.255.255.255', isCorrect: false },
          { optionText: '192.168.0.0 - 192.168.255.255', isCorrect: true },
          { optionText: '209.0.0.0 - 209.255.255.255', isCorrect: false },
          { optionText: '11.0.0.0 - 11.255.255.255', isCorrect: false }
        ],
        points: 15,
        timeLimit: 45
      },
      {
        questionText: 'What device connects different networks together?',
        questionType: 'multiple-choice',
        options: [
          { optionText: 'Hub', isCorrect: false },
          { optionText: 'Switch', isCorrect: false },
          { optionText: 'Router', isCorrect: true },
          { optionText: 'Modem', isCorrect: false }
        ],
        points: 10,
        timeLimit: 30
      }
    ]
  },
  {
    title: 'Database Management',
    description: 'Explore SQL, NoSQL, and database design principles.',
    category: 'databases',
    isPublic: true,
    tags: ['sql', 'nosql', 'database', 'mongodb', 'mysql'],
    questions: [
      {
        questionText: 'What does SQL stand for?',
        questionType: 'multiple-choice',
        options: [
          { optionText: 'Structured Query Language', isCorrect: true },
          { optionText: 'Simple Query Language', isCorrect: false },
          { optionText: 'Sequential Query Language', isCorrect: false },
          { optionText: 'System Query Language', isCorrect: false }
        ],
        points: 10,
        timeLimit: 30
      },
      {
        questionText: 'Which of the following is a NoSQL database?',
        questionType: 'multiple-choice',
        options: [
          { optionText: 'MySQL', isCorrect: false },
          { optionText: 'PostgreSQL', isCorrect: false },
          { optionText: 'MongoDB', isCorrect: true },
          { optionText: 'Oracle', isCorrect: false }
        ],
        points: 10,
        timeLimit: 30
      },
      {
        questionText: 'What SQL command is used to retrieve data from a database?',
        questionType: 'multiple-choice',
        options: [
          { optionText: 'GET', isCorrect: false },
          { optionText: 'RETRIEVE', isCorrect: false },
          { optionText: 'SELECT', isCorrect: true },
          { optionText: 'FETCH', isCorrect: false }
        ],
        points: 10,
        timeLimit: 30
      },
      {
        questionText: 'In a relational database, what is a foreign key?',
        questionType: 'multiple-choice',
        options: [
          { optionText: 'A key from a foreign country', isCorrect: false },
          { optionText: 'A field that uniquely identifies each record in a table', isCorrect: false },
          { optionText: 'A field that links to the primary key of another table', isCorrect: true },
          { optionText: 'A key that cannot be accessed by users', isCorrect: false }
        ],
        points: 15,
        timeLimit: 45
      },
      {
        questionText: 'What is the MongoDB equivalent of a SQL database table?',
        questionType: 'short-answer',
        correctAnswer: 'collection',
        options: [
          { optionText: 'Not applicable for short answer', isCorrect: false },
          { optionText: 'Not applicable for short answer', isCorrect: false }
        ],
        points: 20,
        timeLimit: 40
      }
    ]
  },
  {
    title: 'Cybersecurity Essentials',
    description: 'Learn about security threats, encryption, and best practices for staying safe online.',
    category: 'cybersecurity',
    isPublic: true,
    tags: ['security', 'encryption', 'threats', 'protection'],
    questions: [
      {
        questionText: 'What is phishing?',
        questionType: 'multiple-choice',
        options: [
          { optionText: 'A type of fishing in the ocean', isCorrect: false },
          { optionText: 'A cybersecurity protection tool', isCorrect: false },
          { optionText: 'An attempt to acquire sensitive information by disguising as a trustworthy entity', isCorrect: true },
          { optionText: 'A method of encrypting data', isCorrect: false }
        ],
        points: 10,
        timeLimit: 30
      },
      {
        questionText: 'What does HTTPS provide that HTTP does not?',
        questionType: 'multiple-choice',
        options: [
          { optionText: 'Faster loading speeds', isCorrect: false },
          { optionText: 'Encryption', isCorrect: true },
          { optionText: 'Better image quality', isCorrect: false },
          { optionText: 'More server capacity', isCorrect: false }
        ],
        points: 10,
        timeLimit: 30
      },
      {
        questionText: 'True or False: A firewall is a software or hardware device that blocks unauthorized access to a network.',
        questionType: 'true-false',
        options: [
          { optionText: 'True', isCorrect: true },
          { optionText: 'False', isCorrect: false }
        ],
        points: 10,
        timeLimit: 20
      },
      {
        questionText: 'What is two-factor authentication?',
        questionType: 'multiple-choice',
        options: [
          { optionText: 'Using two different passwords', isCorrect: false },
          { optionText: 'Requiring two different people to authenticate', isCorrect: false },
          { optionText: 'Using two different security methods to verify identity', isCorrect: true },
          { optionText: 'Logging in twice for extra security', isCorrect: false }
        ],
        points: 15,
        timeLimit: 45
      },
      {
        questionText: 'Which of the following is a strong password practice?',
        questionType: 'multiple-choice',
        options: [
          { optionText: 'Using your pet\'s name', isCorrect: false },
          { optionText: 'Using "password123"', isCorrect: false },
          { optionText: 'Using a mix of uppercase, lowercase, numbers, and symbols', isCorrect: true },
          { optionText: 'Writing your password on a sticky note', isCorrect: false }
        ],
        points: 10,
        timeLimit: 30
      }
    ]
  },
  {
    title: 'Web Development Fundamentals',
    description: 'Explore HTML, CSS, JavaScript and the basics of building websites.',
    category: 'web-development',
    isPublic: true,
    tags: ['html', 'css', 'javascript', 'web', 'frontend'],
    questions: [
      {
        questionText: 'What does HTML stand for?',
        questionType: 'multiple-choice',
        options: [
          { optionText: 'Hyper Text Markup Language', isCorrect: true },
          { optionText: 'High Technical Modern Language', isCorrect: false },
          { optionText: 'Hyperlinks and Text Markup Language', isCorrect: false },
          { optionText: 'Home Tool Markup Language', isCorrect: false }
        ],
        points: 10,
        timeLimit: 30
      },
      {
        questionText: 'Which language is used for styling web pages?',
        questionType: 'multiple-choice',
        options: [
          { optionText: 'HTML', isCorrect: false },
          { optionText: 'CSS', isCorrect: true },
          { optionText: 'JavaScript', isCorrect: false },
          { optionText: 'PHP', isCorrect: false }
        ],
        points: 10,
        timeLimit: 30
      },
      {
        questionText: 'Which HTML tag is used for creating a link?',
        questionType: 'multiple-choice',
        options: [
          { optionText: '<link>', isCorrect: false },
          { optionText: '<href>', isCorrect: false },
          { optionText: '<a>', isCorrect: true },
          { optionText: '<url>', isCorrect: false }
        ],
        points: 10,
        timeLimit: 30
      },
      {
        questionText: 'Which JavaScript method is used to select an HTML element by its id?',
        questionType: 'multiple-choice',
        options: [
          { optionText: 'document.querySelector()', isCorrect: false },
          { optionText: 'document.getElement()', isCorrect: false },
          { optionText: 'document.getElementById()', isCorrect: true },
          { optionText: 'document.findId()', isCorrect: false }
        ],
        points: 15,
        timeLimit: 45
      },
      {
        questionText: 'What HTML tag is used to define the main content area of an HTML document?',
        questionType: 'short-answer',
        correctAnswer: 'body',
        options: [
          { optionText: 'Not applicable for short answer', isCorrect: false },
          { optionText: 'Not applicable for short answer', isCorrect: false }
        ],
        points: 10,
        timeLimit: 30
      }
    ]
  }
];

// Function to clear the uploads directory
const clearUploadsDirectory = async () => {
  const uploadsDir = path.join(__dirname, 'public/uploads');
  try {
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        // Optionally, keep .gitkeep or other specific files
        if (file === '.gitkeep') continue;
        fs.unlinkSync(path.join(uploadsDir, file));
      }
      console.log('Uploads directory cleared.');
    } else {
      console.log('Uploads directory does not exist, creating it.');
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  } catch (err) {
    console.error('Error clearing uploads directory:', err);
  }
};

// Connect to the database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quizzaire')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Clean existing data
      await User.deleteOne({ email: 'admin@quiz.com' });
      console.log('Removed existing admin user if present');
      
      // Clear uploads directory
      await clearUploadsDirectory();

      // Hash password
      const hashedPassword = await argon2.hash('123');
      console.log('Password hashed successfully');
      
      // Create admin user
      const admin = new User({
        username: 'Lukasz',
        email: 'admin@quiz.com',
        password: hashedPassword,
        role: 'admin'
      });
      
      const savedUser = await admin.save();
      console.log(`Created admin user: ${savedUser.username}`);
      
      // Create quizzes
      for (const quizData of quizzes) {
        // Add creator to each quiz
        quizData.creator = savedUser._id;
        
        const quiz = new Quiz(quizData);
        const savedQuiz = await quiz.save();
        
        // Update user's createdQuizzes
        savedUser.createdQuizzes.push(savedQuiz._id);
        
        console.log(`Created quiz: ${savedQuiz.title}`);
      }
      
      // Save updated user
      await savedUser.save();
      console.log('Updated user with created quizzes');
      
      console.log('Seed completed successfully!');
    } catch (error) {
      console.error('Error during seeding:', error);
    } finally {
      // Close the database connection
      mongoose.connection.close();
      console.log('Database connection closed');
    }
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });
