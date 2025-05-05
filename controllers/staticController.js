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
        answer: 'After logging in, go to your dashboard and click on "Create Quiz". Fill in the required information and add questions to your quiz.'
      },
      {
        question: 'What types of questions can I create?',
        answer: 'You can create multiple-choice questions, true/false questions, and short-answer questions.'
      },
      {
        question: 'How are quizzes scored?',
        answer: 'Each question has a point value. Your score is calculated based on the number of questions you answer correctly.'
      },
      {
        question: 'Can I see my previous quiz attempts?',
        answer: 'Yes, you can view all your quiz attempts from your dashboard.'
      },
      {
        question: 'What IT topics are covered in the quizzes?',
        answer: 'Quizzes cover topics from Vg2 IT programfag including programming, networking, databases, cybersecurity, and web development.'
      }
    ];
    
    res.render('faq', { faqs });
  }
};

module.exports = staticController;
