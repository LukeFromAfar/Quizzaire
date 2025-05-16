const Quiz = require('../models/Quiz');

// Category configuration object with titles, descriptions and filter values
const categories = [
  {
    title: "Programming",
    description: "Test your knowledge on various programming languages, algorithms, and coding concepts.",
    value: "programming"
  },
  {
    title: "Networking",
    description: "Challenge yourself with quizzes on network protocols, topologies, and configurations.",
    value: "networking"
  },
  {
    title: "Databases",
    description: "Explore quizzes on SQL, database management systems, and data modeling.",
    value: "databases"
  },
  {
    title: "Cybersecurity",
    description: "Test your knowledge of security principles, threats, vulnerabilities, and defense mechanisms.",
    value: "cybersecurity"
  },
  {
    title: "Web Development",
    description: "Challenge yourself with quizzes on frontend, backend, and full-stack web development.",
    value: "web-development"
  },
  {
    title: "Other IT Topics",
    description: "Explore various IT topics including hardware, software, and emerging technologies.",
    value: "other"
  }
];

const staticController = {
  // Render home page
  getHomePage: async (req, res) => {
    try {
      // Get some featured quizzes
      const featuredQuizzes = await Quiz.find({ isPublic: true })
        .sort({ attempts: -1 })
        .limit(6)
        .populate('creator', 'username');
      
      // Randomly select 3 unique categories for the buttons
      let randomCategories = [...categories];
      for (let i = randomCategories.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [randomCategories[i], randomCategories[j]] = [randomCategories[j], randomCategories[i]];
      }
      randomCategories = randomCategories.slice(0, 3);
      
      res.render('index', { featuredQuizzes, randomCategories });
    } catch (error) {
      console.error('Error loading homepage:', error);
      res.status(500).render('error', { error: 'Error loading homepage' });
    }
  },
  
  // Render FAQ page
  getFaqPage: (req, res) => {
    // Hard-coded FAQ data
    const faqs = [
      {
        question: 'How do I create a quiz?',
        answer: 'After logging in, navigate to your dashboard and click "Create Quiz". You can add a title, description, cover image, category, and tags. Then add multiple-choice, true/false, or short-answer questions. Each question can include an optional image, point value, and time limit.'
      },
      {
        question: 'What question types are supported in Quizzaire?',
        answer: 'Quizzaire supports three question types: multiple-choice (with customizable options), true/false, and short-answer questions. For short-answer questions, you provide the exact text that will be considered correct.'
      },
      {
        question: 'Can I host a live quiz session?',
        answer: 'Yes! When viewing a quiz you\'ve created or any public quiz, click "Host Live Session". Participants can join using the displayed session code, and you can control the pace of the quiz as everyone answers in real-time.'
      },
      {
        question: 'How are quizzes scored?',
        answer: 'Each question has a customizable point value (default is 10 points). For live sessions, scoring also factors in how quickly participants answer correctly. Your final score is calculated as a percentage of the maximum possible score.'
      },
      {
        question: 'Can I edit a quiz after creating it?',
        answer: 'Yes, quiz creators can edit their quizzes at any time. You can modify the title, description, questions, answers, point values, time limits, and images. Administrators can edit any quiz in the system.'
      },
      {
        question: 'How do I view my quiz history and results?',
        answer: 'Access your dashboard to see both quizzes you\'ve created and attempted. Click on any past attempt to view detailed results including your score, time taken, and a breakdown of which questions you answered correctly or incorrectly.'
      },
      {
        question: 'Can I upload images for my quiz questions?',
        answer: 'Yes, you can upload images for both the quiz cover and individual questions. This is useful for questions that require visual elements like code snippets, network diagrams, or other technical illustrations.'
      }
    ];
    
    res.render('faq', { faqs });
  }
};

module.exports = staticController;
