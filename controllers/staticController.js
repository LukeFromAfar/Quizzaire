const Quiz = require('../models/Quiz');

const staticController = {
  // Render home page
  getHomePage: async (req, res) => {
    try {
      // Get some featured quizzes
      const featuredQuizzes = await Quiz.find({ isPublic: true })
        .sort({ attempts: -1 })
        .limit(6)
        .populate('creator', 'username');
      
      res.render('index', { featuredQuizzes });
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
