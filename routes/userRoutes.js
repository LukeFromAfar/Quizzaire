const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

// User dashboard (protected)
router.get('/dashboard', isAuthenticated, userController.getDashboard);

// Admin dashboard (admin only)
router.get('/admin/dashboard', isAuthenticated, isAdmin, userController.getAdminDashboard);

// Delete user (admin only)
router.post('/delete/:id', isAuthenticated, isAdmin, userController.deleteUser);

// User profile (protected)
router.get('/profile', isAuthenticated, userController.getUserProfile);
router.post('/profile/update', isAuthenticated, userController.updateProfile);

// Delete quiz (admin + quiz creator)
router.post('/quizzes/delete/:id', isAuthenticated, userController.deleteQuiz);

// Reset database (admin only)
router.post('/admin/reset-database', isAuthenticated, isAdmin, userController.resetDatabase);

module.exports = router;
