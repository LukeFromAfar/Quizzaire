const User = require('../models/User');
const Quiz = require('../models/Quiz');
const path = require('path');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');

const userController = {
  // Get user dashboard
  getDashboard: async (req, res) => {
    try {
      const user = await User.findById(req.session.user.id)
        .populate('createdQuizzes')
        .populate({
          path: 'attemptedQuizzes',
          populate: {
            path: 'quiz',
            select: 'title category'
          }
        });
      
      if (!user) {
        return res.status(404).render('error', { error: 'User not found', message: 'Could not find user data' });
      }
      
      res.render('users/dashboard', { 
        user, 
        title: 'Dashboard'
      });
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      res.status(500).render('error', { 
        error: process.env.NODE_ENV === 'development' ? error : {}, 
        message: 'Error loading dashboard'
      });
    }
  },
  
  // Get admin dashboard
  getAdminDashboard: async (req, res) => {
    try {
      // Check if user is admin
      if (req.session.user.role !== 'admin') {
        return res.status(403).render('error', { 
          error: {}, 
          message: 'Access denied: Admin privileges required'
        });
      }
      
      const users = await User.find().select('-password');
      const quizzes = await Quiz.find().populate('creator', 'username');
      
      res.render('admin/dashboard', { 
        users, 
        quizzes, 
        title: 'Admin Dashboard',
        currentUser: req.session.user, // Pass current user to the template
        resetSuccess: req.query.reset === 'success' // Pass the reset success flag
      });
    } catch (error) {
      console.error('Error fetching admin dashboard:', error);
      res.status(500).render('error', { 
        error: process.env.NODE_ENV === 'development' ? error : {},
        message: 'Error loading admin dashboard'
      });
    }
  },
  
  // Delete user (admin only)
  deleteUser: async (req, res) => {
    try {
      // Check if user is admin
      if (req.session.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      const userId = req.params.id;
      
      // Get the user to access their session data
      const userToDelete = await User.findById(userId);
      
      if (!userToDelete) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Delete user's quizzes
      await Quiz.deleteMany({ creator: userId });
      
      // Find and destroy user's sessions from MongoDB store
      const sessionStore = MongoStore.create({ 
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions'
      });
      
      // Use the session store to find and delete the user's sessions
      sessionStore.all((err, sessions) => {
        if (err) {
          console.error('Error accessing sessions:', err);
          return;
        }
        
        if (sessions) {
          Object.values(sessions).forEach(session => {
            if (session.user && session.user.id === userId) {
              sessionStore.destroy(session._id);
            }
          });
        }
      });
      
      // Delete the user
      await User.findByIdAndDelete(userId);
      
      res.redirect('/users/admin/dashboard');
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).render('error', { error: 'Error deleting user' });
    }
  },
  
  // Get user profile
  getUserProfile: async (req, res) => {
    try {
      const user = await User.findById(req.session.user.id).select('-password');
      
      if (!user) {
        return res.status(404).render('error', { error: 'User not found' });
      }
      
      res.render('users/profile', { user, success: req.query.success });
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).render('error', { error: 'Error loading profile' });
    }
  },
  
  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const { username, email } = req.body;
      
      // Check if username or email is already taken
      const existingUser = await User.findOne({
        $or: [
          { username },
          { email }
        ],
        _id: { $ne: req.session.user.id }
      });
      
      if (existingUser) {
        return res.status(400).render('users/profile', {
          user: await User.findById(req.session.user.id),
          error: 'Username or email already taken'
        });
      }
      
      // Handle profile image upload
      let profileImage = req.body.currentProfileImage;
      if (req.files && req.files.profileImage) {
        const file = req.files.profileImage;
        const fileName = `${Date.now()}_${file.name}`;
        const uploadPath = `${__dirname}/../public/uploads/${fileName}`;
        
        await file.mv(uploadPath);
        profileImage = `/uploads/${fileName}`;
      }
      
      // Update user
      const updatedUser = await User.findByIdAndUpdate(
        req.session.user.id,
        { username, email, profileImage },
        { new: true }
      );
      
      // Update session
      req.session.user.username = updatedUser.username;
      req.session.user.email = updatedUser.email;
      
      res.redirect('/users/profile?success=true');
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).render('users/profile', {
        user: await User.findById(req.session.user.id),
        error: 'Error updating profile'
      });
    }
  },
  
  // Delete quiz
  deleteQuiz: async (req, res) => {
    try {
      const quizId = req.params.id;
      const userId = req.session.user.id;
      
      // Find the quiz
      const quiz = await Quiz.findById(quizId);
      
      if (!quiz) {
        return res.status(404).render('error', { error: 'Quiz not found' });
      }
      
      // Check if user is admin or the quiz creator
      if (req.session.user.role !== 'admin' && quiz.creator.toString() !== userId) {
        return res.status(403).render('error', { error: 'Unauthorized' });
      }
      
      // Delete the quiz
      await Quiz.findByIdAndDelete(quizId);
      
      // Remove quiz from user's created quizzes
      await User.findByIdAndUpdate(quiz.creator, {
        $pull: { createdQuizzes: quizId }
      });
      
      // Redirect based on role
      if (req.session.user.role === 'admin') {
        res.redirect('/users/admin/dashboard');
      } else {
        res.redirect('/users/dashboard');
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
      res.status(500).render('error', { error: 'Error deleting quiz' });
    }
  },
  
  // Reset database (admin only)
  resetDatabase: async (req, res) => {
    try {
      // Check if user is admin
      if (req.session.user.role !== 'admin') {
        return res.status(403).render('error', { error: 'Unauthorized: Admin access required' });
      }
      
      const currentUserId = req.session.user.id;
      
      // Store current user info to recreate after DB reset
      const currentUser = await User.findById(currentUserId).lean();
      if (!currentUser) {
        return res.status(404).render('error', { error: 'User not found' });
      }
      
      // Get all collections
      const collections = await mongoose.connection.db.collections();
      
      // Drop all collections except sessions
      for (const collection of collections) {
        if (collection.collectionName !== 'sessions') {
          try {
            await collection.drop();
            console.log(`Admin reset: Dropped collection ${collection.collectionName}`);
          } catch (err) {
            console.error(`Error dropping collection ${collection.collectionName}:`, err);
          }
        }
      }
      
      // Recreate the admin user
      const hashedPassword = currentUser.password; // Reuse the same hashed password
      
      const newAdmin = new User({
        username: currentUser.username,
        email: currentUser.email,
        password: hashedPassword,
        role: 'admin' // Ensure admin role
      });
      
      await newAdmin.save();
      
      // Update the session with the new user ID
      req.session.user.id = newAdmin._id;
      
      await req.session.save();
      
      res.redirect('/users/admin/dashboard?reset=success');
    } catch (error) {
      console.error('Error resetting database:', error);
      res.status(500).render('error', { error: 'Error resetting database: ' + error.message });
    }
  }
};

module.exports = userController;
