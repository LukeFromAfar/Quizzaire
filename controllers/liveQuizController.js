const Quiz = require('../models/Quiz');
const LiveSession = require('../models/LiveSession');
const mongoose = require('mongoose');

const liveQuizController = {
  // Create a new live session
  createLiveSession: async (req, res) => {
    try {
      const { quizId } = req.params;
      
      // Check if quiz exists
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return res.status(404).render('error', { error: 'Quiz not found' });
      }
      
      // Generate a unique code
      const code = await LiveSession.generateUniqueCode();
      
      // Create new session with the generated code
      const session = new LiveSession({
        quiz: quizId,
        host: req.session.user.id,
        status: 'waiting',
        code: code
      });
      
      await session.save();
      
      res.redirect(`/live/host/session/${session._id}`);
    } catch (error) {
      console.error('Error creating live session:', error);
      res.status(500).render('error', { error: 'Error creating live session: ' + error.message });
    }
  },

  // Host view for managing a live session
  hostSession: async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      // Get session with quiz data
      const session = await LiveSession.findById(sessionId)
        .populate('quiz')
        .populate('host', 'username');
      
      if (!session) {
        return res.status(404).render('error', { error: 'Session not found' });
      }
      
      // Check if user is the host
      if (session.host._id.toString() !== req.session.user.id) {
        return res.status(403).render('error', { error: 'Unauthorized: You are not the host of this session' });
      }
      
      res.render('live/host-session', { session });
    } catch (error) {
      console.error('Error loading host session:', error);
      res.status(500).render('error', { error: 'Error loading live session' });
    }
  },

  // End a live session
  endSession: async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const session = await LiveSession.findById(sessionId);
      
      if (!session) {
        return res.status(404).render('error', { error: 'Session not found' });
      }
      
      // Check if user is the host
      if (session.host.toString() !== req.session.user.id) {
        return res.status(403).render('error', { error: 'Unauthorized: You are not the host of this session' });
      }
      
      // Update session status and end time
      session.status = 'completed';
      session.endedAt = Date.now();
      await session.save();
      
      // Redirect to the quiz page
      res.redirect(`/quizzes/${session.quiz}`);
    } catch (error) {
      console.error('Error ending session:', error);
      res.status(500).render('error', { error: 'Error ending live session' });
    }
  },

  // Join page for participants
  getJoinPage: (req, res) => {
    res.render('live/join', { error: null });
  },

  // Process join request
  joinSession: async (req, res) => {
    try {
      const { code, username } = req.body;
      
      if (!code || code.length !== 6) {
        return res.render('live/join', {
          error: 'Please enter a valid 6-digit game PIN',
          values: { code, username }
        });
      }

      if (!username || username.trim() === '') {
        return res.render('live/join', {
          error: 'Please enter a nickname',
          values: { code, username }
        });
      }
      
      // Find session by code
      const session = await LiveSession.findOne({ code, status: { $ne: 'completed' } });
      
      if (!session) {
        return res.render('live/join', { 
          error: 'Invalid game PIN or the session has ended',
          values: { code, username }
        });
      }
      
      // Store session info in the session
      req.session.liveSession = {
        sessionId: session._id,
        code,
        username: username.trim()
      };
      
      // Make sure the session is saved before redirecting
      req.session.save((err) => {
        if (err) {
          return res.render('live/join', {
            error: 'Error joining session. Please try again.',
            values: { code, username }
          });
        }
        
        res.redirect(`/live/session/${session._id}`);
      });
    } catch (error) {
      console.error('Error joining session:', error);
      res.render('live/join', { 
        error: 'Error joining session. Please try again.',
        values: req.body
      });
    }
  },

  // Participant view for participating in a session
  participantSession: async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      // Check if user has joined this session
      if (!req.session.liveSession || req.session.liveSession.sessionId.toString() !== sessionId) {
        return res.redirect('/live/join');
      }
      
      const session = await LiveSession.findById(sessionId)
        .populate('quiz', 'title');
      
      if (!session) {
        return res.status(404).render('error', { error: 'Session not found' });
      }
      
      if (session.status === 'completed') {
        return res.render('live/session-ended', { session });
      }
      
      res.render('live/participant-session', { 
        session, 
        participant: req.session.liveSession
      });
    } catch (error) {
      console.error('Error loading participant session:', error);
      res.status(500).render('error', { error: 'Error loading session' });
    }
  }
};

module.exports = liveQuizController;
