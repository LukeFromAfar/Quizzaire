const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const quizController = {
  // Get all quizzes for the browse page
  getAllQuizzes: async (req, res) => {
    try {
      const { search, category, sort, page = 1 } = req.query;
      const limit = 9; // Number of quizzes per page
      const skip = (page - 1) * limit;
      
      // Build query based on filters
      const query = { isPublic: true };
      
      // Search filter
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [search.toLowerCase()] } }
        ];
      }
      
      // Category filter
      if (category) {
        query.category = category;
      }
      
      // Sorting options
      let sortOption = { createdAt: -1 }; // Default: newest first
      if (sort === 'oldest') {
        sortOption = { createdAt: 1 };
      } else if (sort === 'popular') {
        sortOption = { attempts: -1 };
      }
      
      // Count total documents for pagination
      const totalQuizzes = await Quiz.countDocuments(query);
      const totalPages = Math.ceil(totalQuizzes / limit);
      
      // Execute query with pagination
      const quizzes = await Quiz.find(query)
        .populate('creator', 'username')
        .sort(sortOption)
        .skip(skip)
        .limit(limit);
      
      console.log(`Found ${quizzes.length} quizzes out of ${totalQuizzes} total`); // Debug info
      
      res.render('quizzes/browse', {
        quizzes,
        search,
        category,
        sort,
        page: parseInt(page),
        totalPages,
        title: 'Browse Quizzes'
      });
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      res.status(500).render('error', { 
        error: process.env.NODE_ENV === 'development' ? error : {},
        message: 'Error fetching quizzes'
      });
    }
  },
  
  // Get a single quiz by ID
  getQuizById: async (req, res) => {
    try {
      const quiz = await Quiz.findById(req.params.id)
        .populate('creator', 'username');
        
      if (!quiz) {
        return res.status(404).render('error', { error: 'Quiz not found' });
      }
      
      // Check if the current user is the creator or an admin
      const isOwner = req.session.user && req.session.user.id === quiz.creator._id.toString();
      const isAdmin = req.session.user && req.session.user.role === 'admin';
      
      res.render('quizzes/details', { 
        quiz,
        isOwner,
        isAdmin
      });
    } catch (error) {
      console.error('Error fetching quiz:', error);
      res.status(500).render('error', { error: 'Error fetching quiz details' });
    }
  },
  
  // Render quiz creation form
  renderCreateQuiz: (req, res) => {
    res.render('quizzes/create', { 
      error: null, 
      values: {},
      categories: ['programming', 'networking', 'databases', 'cybersecurity', 'web-development', 'other']
    });
  },
  
  // Create a new quiz
  createQuiz: async (req, res) => {
    try {
      const { title, description, category, isPublic, questions, tags } = req.body;
      
      // Handle cover image upload if present
      let coverImage = '';
      if (req.files && req.files.coverImage) {
        try {
          const file = req.files.coverImage;
          const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
          const uploadPath = path.join(__dirname, '../public/uploads/', fileName);
          
          await file.mv(uploadPath);
          coverImage = `/uploads/${fileName}`;
        } catch (err) {
          console.error('Error uploading cover image:', err);
          // Continue without the image
        }
      }

      // Parse questions
      const parsedQuestions = JSON.parse(questions);
      
      // Handle question images
      if (req.files) {
        for (let i = 0; i < parsedQuestions.length; i++) {
          const questionImageKey = `questionImage_${i}`;
          if (req.files[questionImageKey]) {
            try {
              const file = req.files[questionImageKey];
              const fileName = `${Date.now()}_question_${i}_${file.name.replace(/\s+/g, '_')}`;
              const uploadPath = path.join(__dirname, '../public/uploads/', fileName);
              
              await file.mv(uploadPath);
              parsedQuestions[i].questionImage = `/uploads/${fileName}`;
            } catch (err) {
              console.error(`Error uploading image for question ${i}:`, err);
              // Continue without the image
            }
          }
        }
      }
      
      // Process tags if provided
      let tagArray = [];
      if (tags && tags.trim() !== '') {
        tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      }

      // Create new quiz
      const newQuiz = new Quiz({
        title,
        description,
        coverImage,
        category,
        creator: req.session.user.id,
        isPublic: isPublic === 'true',
        questions: parsedQuestions,
        tags: tagArray
      });
      
      await newQuiz.save();
      
      // Add to user's created quizzes
      await mongoose.model('User').findByIdAndUpdate(
        req.session.user.id,
        { $push: { createdQuizzes: newQuiz._id } }
      );
      
      res.redirect(`/quizzes/${newQuiz._id}`);
    } catch (error) {
      console.error('Error creating quiz:', error);
      res.status(500).render('quizzes/create', { 
        error: 'Error creating quiz: ' + error.message,
        values: req.body,
        categories: ['programming', 'networking', 'databases', 'cybersecurity', 'web-development', 'other']
      });
    }
  },
  
  // Render quiz edit form
  renderEditQuiz: async (req, res) => {
    try {
      const quiz = await Quiz.findById(req.params.id)
        .populate('creator', 'username');
        
      if (!quiz) {
        return res.status(404).render('error', { error: 'Quiz not found' });
      }
      
      // Check if the user is the creator or an admin
      const isOwner = req.session.user.id === quiz.creator._id.toString();
      const isAdmin = req.session.user.role === 'admin';
      
      if (!isOwner && !isAdmin) {
        return res.status(403).render('error', { error: 'Unauthorized: You cannot edit this quiz' });
      }
      
      res.render('quizzes/edit', { 
        quiz,
        error: null,
        categories: ['programming', 'networking', 'databases', 'cybersecurity', 'web-development', 'other']
      });
    } catch (error) {
      console.error('Error preparing quiz edit:', error);
      res.status(500).render('error', { error: 'Error preparing quiz for editing' });
    }
  },
  
  // Update an existing quiz
  updateQuiz: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, category, isPublic, questions, tags } = req.body;
      
      // Find the quiz
      const quiz = await Quiz.findById(id);
      
      if (!quiz) {
        return res.status(404).render('error', { error: 'Quiz not found' });
      }
      
      // Check if the user is the creator or an admin
      const isOwner = req.session.user.id === quiz.creator.toString();
      const isAdmin = req.session.user.role === 'admin';
      
      if (!isOwner && !isAdmin) {
        return res.status(403).render('error', { error: 'Unauthorized: You cannot edit this quiz' });
      }
      
      // Handle cover image upload if present
      let coverImage = quiz.coverImage; // Keep existing image by default
      if (req.files && req.files.coverImage) {
        try {
          const file = req.files.coverImage;
          const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
          const uploadPath = path.join(__dirname, '../public/uploads/', fileName);
          
          await file.mv(uploadPath);
          
          // Delete old cover image if exists
          if (quiz.coverImage && quiz.coverImage !== '') {
            const oldImagePath = path.join(__dirname, '../public', quiz.coverImage);
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
          }
          
          coverImage = `/uploads/${fileName}`;
        } catch (err) {
          console.error('Error uploading cover image:', err);
          // Continue with existing image
        }
      }

      // Parse questions
      const parsedQuestions = JSON.parse(questions);
      
      // Handle question images
      if (req.files) {
        for (let i = 0; i < parsedQuestions.length; i++) {
          const questionImageKey = `questionImage_${i}`;
          
          // Keep existing image if available
          if (i < quiz.questions.length && quiz.questions[i].questionImage) {
            parsedQuestions[i].questionImage = quiz.questions[i].questionImage;
          }
          
          // Update image if new one is provided
          if (req.files[questionImageKey]) {
            try {
              const file = req.files[questionImageKey];
              const fileName = `${Date.now()}_question_${i}_${file.name.replace(/\s+/g, '_')}`;
              const uploadPath = path.join(__dirname, '../public/uploads/', fileName);
              
              await file.mv(uploadPath);
              
              // Delete old question image if exists and is being replaced
              if (i < quiz.questions.length && quiz.questions[i].questionImage) {
                const oldImagePath = path.join(__dirname, '../public', quiz.questions[i].questionImage);
                if (fs.existsSync(oldImagePath)) {
                  fs.unlinkSync(oldImagePath);
                }
              }
              
              parsedQuestions[i].questionImage = `/uploads/${fileName}`;
            } catch (err) {
              console.error(`Error uploading image for question ${i}:`, err);
              // Continue with existing image
            }
          }
        }
      }
      
      // Process tags if provided
      let tagArray = quiz.tags;
      if (tags && tags.trim() !== '') {
        tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      }

      // Update quiz
      const updatedQuiz = await Quiz.findByIdAndUpdate(
        id,
        {
          title,
          description,
          coverImage,
          category,
          isPublic: isPublic === 'true',
          questions: parsedQuestions,
          tags: tagArray,
          updatedAt: Date.now()
        },
        { new: true }
      );
      
      res.redirect(`/quizzes/${updatedQuiz._id}`);
    } catch (error) {
      console.error('Error updating quiz:', error);
      const quiz = await Quiz.findById(req.params.id);
      res.status(500).render('quizzes/edit', { 
        quiz,
        error: 'Error updating quiz: ' + error.message,
        categories: ['programming', 'networking', 'databases', 'cybersecurity', 'web-development', 'other']
      });
    }
  },
  
  // Delete a quiz
  deleteQuiz: async (req, res) => {
    try {
      const { id } = req.params;
      const quiz = await Quiz.findById(id);
      
      if (!quiz) {
        return res.status(404).render('error', { error: 'Quiz not found' });
      }
      
      // Check if user is authorized (creator or admin)
      const isOwner = req.session.user.id === quiz.creator.toString();
      const isAdmin = req.session.user.role === 'admin';
      
      if (!isOwner && !isAdmin) {
        return res.status(403).render('error', { error: 'Unauthorized: You cannot delete this quiz' });
      }
      
      // Delete quiz attempts
      await QuizAttempt.deleteMany({ quiz: id });
      
      // Remove from creator's list
      await mongoose.model('User').findByIdAndUpdate(
        quiz.creator,
        { $pull: { createdQuizzes: id } }
      );
      
      // Delete images
      if (quiz.coverImage) {
        const coverImagePath = path.join(__dirname, '../public', quiz.coverImage);
        if (fs.existsSync(coverImagePath)) {
          fs.unlinkSync(coverImagePath);
        }
      }
      
      // Delete question images
      quiz.questions.forEach(question => {
        if (question.questionImage) {
          const questionImagePath = path.join(__dirname, '../public', question.questionImage);
          if (fs.existsSync(questionImagePath)) {
            fs.unlinkSync(questionImagePath);
          }
        }
      });
      
      // Delete the quiz
      await Quiz.findByIdAndDelete(id);
      
      // Redirect based on user role
      if (isAdmin && !isOwner) {
        res.redirect('/users/admin/dashboard');
      } else {
        res.redirect('/users/dashboard');
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
      res.status(500).render('error', { error: 'Error deleting quiz' });
    }
  },
  
  // Start a quiz attempt
  startQuiz: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.session.user.id;
      
      const quiz = await Quiz.findById(id);
      
      if (!quiz) {
        return res.status(404).render('error', { error: 'Quiz not found' });
      }
      
      // Calculate max possible score
      const maxPossibleScore = quiz.questions.reduce((total, q) => total + q.points, 0);
      
      // Create a new quiz attempt
      const attempt = new QuizAttempt({
        quiz: id,
        user: userId,
        maxPossibleScore,
        answers: [] // Will be populated as the user answers questions
      });
      
      await attempt.save();
      
      // Add to user's attempted quizzes
      await mongoose.model('User').findByIdAndUpdate(
        userId,
        { $push: { attemptedQuizzes: attempt._id } }
      );
      
      res.redirect(`/quizzes/attempt/${attempt._id}`);
    } catch (error) {
      console.error('Error starting quiz:', error);
      res.status(500).render('error', { error: 'Error starting quiz' });
    }
  },
  
  // Display the quiz taking interface
  displayQuizAttempt: async (req, res) => {
    try {
      const { attemptId } = req.params;
      
      const attempt = await QuizAttempt.findById(attemptId)
        .populate({
          path: 'quiz',
          populate: { path: 'creator', select: 'username' }
        });
      
      if (!attempt) {
        return res.status(404).render('error', { error: 'Quiz attempt not found' });
      }
      
      if (attempt.completed) {
        return res.redirect(`/quizzes/results/${attemptId}`);
      }
      
      if (attempt.user.toString() !== req.session.user.id) {
        return res.status(403).render('error', { error: 'Unauthorized' });
      }
      
      res.render('quizzes/attempt', { attempt });
    } catch (error) {
      console.error('Error displaying quiz attempt:', error);
      res.status(500).render('error', { error: 'Error displaying quiz' });
    }
  },
  
  // Submit a quiz attempt
  submitQuizAttempt: async (req, res) => {
    try {
      const { attemptId } = req.params;
      const { answers, timeTaken } = req.body;
      
      const attempt = await QuizAttempt.findById(attemptId)
        .populate('quiz');
      
      if (!attempt) {
        return res.status(404).json({ error: 'Quiz attempt not found' });
      }
      
      if (attempt.completed) {
        return res.status(400).json({ error: 'Quiz already completed' });
      }
      
      if (attempt.user.toString() !== req.session.user.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      // Process answers and calculate score
      let totalScore = 0;
      const processedAnswers = [];
      
      // Process each question, whether answered or not
      attempt.quiz.questions.forEach(question => {
        const questionId = question._id.toString();
        const answer = answers[questionId];
        let isCorrect = false;
        let pointsAwarded = 0;
        let selectedOptions = [];
        let textAnswer = '';
        
        // Check if question was answered
        if (!answer || answer === 'unanswered') {
          // Handle unanswered question
          isCorrect = false;
          pointsAwarded = 0;
          textAnswer = 'Unanswered';
        } else if (question.questionType === 'multiple-choice' || question.questionType === 'true-false') {
          // Process multiple-choice or true-false answer
          const selectedOption = question.options.id(answer);
          if (selectedOption) {
            isCorrect = selectedOption.isCorrect;
            pointsAwarded = isCorrect ? question.points : 0;
            selectedOptions = [answer];
          }
        } else if (question.questionType === 'short-answer') {
          // Process short-answer (case-insensitive)
          textAnswer = answer;
          isCorrect = answer.toLowerCase() === question.correctAnswer.toLowerCase();
          pointsAwarded = isCorrect ? question.points : 0;
        }
        
        totalScore += pointsAwarded;
        
        processedAnswers.push({
          questionId,
          selectedOptions,
          textAnswer,
          isCorrect,
          pointsAwarded,
          timeSpent: 0 // We don't track individual question time in this implementation
        });
      });
      
      // Update the attempt
      attempt.answers = processedAnswers;
      attempt.totalScore = totalScore;
      attempt.timeTaken = timeTaken;
      attempt.completed = true;
      
      await attempt.save();
      
      // Update quiz attempts counter
      await Quiz.findByIdAndUpdate(attempt.quiz._id, { $inc: { attempts: 1 } });
      
      res.redirect(`/quizzes/results/${attemptId}`);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      res.status(500).json({ error: 'Error submitting quiz' });
    }
  },
  
  // Display quiz results
  displayQuizResults: async (req, res) => {
    try {
      const { attemptId } = req.params;
      
      const attempt = await QuizAttempt.findById(attemptId)
        .populate({
          path: 'quiz',
          populate: { path: 'creator', select: 'username' }
        });
      
      if (!attempt) {
        return res.status(404).render('error', { error: 'Quiz results not found' });
      }
      
      if (attempt.user.toString() !== req.session.user.id) {
        return res.status(403).render('error', { error: 'Unauthorized' });
      }
      
      res.render('quizzes/results', { attempt });
    } catch (error) {
      console.error('Error displaying results:', error);
      res.status(500).render('error', { error: 'Error displaying quiz results' });
    }
  }
};

module.exports = quizController;
