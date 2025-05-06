// Disable deprecation warnings related to punycode
const originalEmit = process.emit;
process.emit = function(name, data, ...args) {
  // Skip punycode deprecation warnings only
  if (name === 'warning' && data && data.name === 'DeprecationWarning' && data.message && data.message.includes('punycode')) {
    return false;
  }
  return originalEmit.call(process, name, data, ...args);
};

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const morgan = require('morgan');
const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');
const fs = require('fs');
const http = require('http');
const socketIO = require('socket.io');

// Ensure uploads and images directories exist
const uploadsDir = path.join(__dirname, 'public', 'uploads');
const imagesDir = path.join(__dirname, 'public', 'images');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory');
}

if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log('Created images directory');
}

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server with Express
const server = http.createServer(app);

// Initialize Socket.io with the server
const io = socketIO(server);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 15000, // Timeout for server selection (increased from default)
  socketTimeoutMS: 45000,          // How long sockets stay idle before timing out
  connectTimeoutMS: 30000,         // Timeout for initial connection
  heartbeatFrequencyMS: 10000,     // How often to check the connection status
  retryWrites: true,               // Retry failed write operations
  maxPoolSize: 10                  // Maximum number of connections in the pool
})
.then(() => console.log('MongoDB Connected Successfully'))
.catch(err => {
  console.error('MongoDB Connection Error:', err);
  // Log more detailed information about the error
  if (err.name === 'MongoServerSelectionError') {
    console.error('Could not connect to any MongoDB server in the replicaset');
    console.error('Please check that MongoDB is running and network connectivity');
  }
  // Don't crash the application, but log the error
});

// Add a connection event listener to handle disconnections
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected, attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected successfully');
});
// Custom logging middleware - completely remove socket.io logs
app.use(morgan('dev', {
  skip: (req, res) => req.url.includes('/socket.io')
}));

// Rest of middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Configure file upload with proper error handling
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  abortOnLimit: true,
  debug: process.env.NODE_ENV === 'development'
}));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGODB_URI,
    ttl: 60 * 60 * 24 // 1 day
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 1000 // 1 hour
  }
}));

// View engine setup
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');
app.use(express.static(path.join(__dirname, 'public')));

// Add cache control middleware to prevent caching for authenticated routes
app.use((req, res, next) => {
  // Check if this is a route that should be protected from caching
  if (req.session && req.session.user) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

// Make user available to all templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Completely block socket.io requests to prevent any console logs
app.use('/socket.io', (req, res) => {
  // End the request immediately with a 200 status but no content
  return res.status(200).end();
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Handle host creating a new live session
  socket.on('create-session', (sessionData) => {
    console.log('Session created:', sessionData.code);
    socket.join(sessionData.code);
    socket.sessionCode = sessionData.code;
    socket.isHost = true;
  });
  
  // Handle participant joining a session
  socket.on('join-session', (data) => {
    console.log(`Participant ${data.username} joining session ${data.code}`);
    socket.join(data.code);
    socket.sessionCode = data.code;
    socket.username = data.username;
    socket.isHost = false;
    
    // Notify host that a participant has joined
    io.to(data.code).emit('participant-joined', {
      username: data.username,
      id: socket.id
    });
  });
  
  // Handle host starting a question
  socket.on('start-question', (data) => {
    io.to(data.code).emit('question-started', {
      questionIndex: data.questionIndex,
      timeLimit: data.timeLimit
    });
  });
  
  // Handle participant submitting an answer
  socket.on('submit-answer', (data) => {
    io.to(data.code).emit('answer-received', {
      participantId: socket.id,
      username: socket.username,
      answer: data.answer,
      questionIndex: data.questionIndex,
      timeElapsed: data.timeElapsed // Forward timeElapsed
    });
  });
  
  // Handle host ending a question
  socket.on('end-question', (data) => {
    // Make sure we're sending the full correct answer to participants
    const correctAnswer = data.correctAnswer || 
      (data.results && data.results.correctAnswer) ||
      "No correct answer provided";
    
    io.to(data.code).emit('question-ended', {
      questionIndex: data.questionIndex,
      results: data.results,
      correctAnswer: correctAnswer
    });
  });
  
  // Handle host showing final results
  socket.on('show-final-results', (data) => {
    io.to(data.code).emit('final-results', {
      leaderboard: data.leaderboard
    });
  });
  
  // Handle get-question event for participants
  socket.on('get-question', async (data) => {
    try {
      const session = await mongoose.model('LiveSession').findOne({ code: data.code })
        .populate('quiz');
      
      if (session && session.quiz && session.quiz.questions[data.questionIndex]) {
        const question = session.quiz.questions[data.questionIndex];
        
        // Make sure we send correct data structure for all question types
        let questionData = {
          questionText: question.questionText,
          questionType: question.questionType,
          timeLimit: question.timeLimit || 30,
          points: question.points
        };
        
        // Add question image if exists
        if (question.questionImage) {
          questionData.questionImage = question.questionImage;
        }
        
        // Add options for multiple-choice and true-false
        if (question.questionType === 'multiple-choice' || question.questionType === 'true-false') {
          questionData.options = question.options;
        } else if (question.questionType === 'short-answer') {
          questionData.correctAnswer = question.correctAnswer;
        }
        
        socket.emit('question-data', { question: questionData });
      }
    } catch (error) {
      console.error('Error getting question data:', error);
    }
  });
  
  // Handle ending the session
  socket.on('end-session', (data) => {
    io.to(data.code).emit('session-ended', {
      message: 'Session has ended'
    });
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    if (socket.sessionCode && socket.username && !socket.isHost) {
      // Notify the host that a participant has left
      io.to(socket.sessionCode).emit('participant-left', {
        username: socket.username,
        id: socket.id
      });
    }
  });
});

// Routes
const authRoutes = require('./routes/authRoutes');
const quizRoutes = require('./routes/quizRoutes');
const userRoutes = require('./routes/userRoutes');
const staticRoutes = require('./routes/staticRoutes');
const liveQuizRoutes = require('./routes/liveQuizRoutes');

app.use('/auth', authRoutes);
app.use('/quizzes', quizRoutes);
app.use('/users', userRoutes);
app.use('/live', liveQuizRoutes);
app.use('/', staticRoutes);

// Error handling middleware for file uploads
app.use((err, req, res, next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).render('error', {
      message: 'File too large! Maximum size is 10MB.',
      error: {}
    });
  }
  next(err);
});

// General error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    error: process.env.NODE_ENV === 'development' ? err : {},
    message: 'Something went wrong!'
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
