const express = require('express');
const router = express.Router();
const liveQuizController = require('../controllers/liveQuizController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// Host routes (require authentication)
router.get('/host/create/:quizId', isAuthenticated, liveQuizController.createLiveSession);
router.get('/host/session/:sessionId', isAuthenticated, liveQuizController.hostSession);
router.post('/host/session/:sessionId/end', isAuthenticated, liveQuizController.endSession);

// Participant routes (no authentication required)
router.get('/join', liveQuizController.getJoinPage);
router.post('/join', liveQuizController.joinSession);
router.get('/session/:sessionId', liveQuizController.participantSession);

module.exports = router;
