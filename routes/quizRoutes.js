const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// Browse quizzes (this should be the first route to prevent conflicts with /:id)
router.get('/', quizController.getAllQuizzes);

// Create quiz (protected)
router.get('/create/new', isAuthenticated, quizController.renderCreateQuiz);
router.post('/create', isAuthenticated, quizController.createQuiz);

// Edit quiz (protected)
router.get('/:id/edit', isAuthenticated, quizController.renderEditQuiz);
router.post('/:id/update', isAuthenticated, quizController.updateQuiz);

// Delete quiz (protected)
router.post('/:id/delete', isAuthenticated, quizController.deleteQuiz);

// Quiz attempt (protected)
router.get('/attempt/:attemptId', isAuthenticated, quizController.displayQuizAttempt);
router.post('/attempt/:attemptId/submit', isAuthenticated, quizController.submitQuizAttempt);

// Quiz results (protected)
router.get('/results/:attemptId', isAuthenticated, quizController.displayQuizResults);

// Start quiz attempt (protected)
router.post('/:id/start', isAuthenticated, quizController.startQuiz);

// View specific quiz (this should be last to avoid conflicting with other routes)
router.get('/:id', quizController.getQuizById);

module.exports = router;
