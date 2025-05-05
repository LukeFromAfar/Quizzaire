const User = require('../models/User');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');

const authController = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).render('auth/login', {
          error: 'Invalid email or password',
          values: { email }
        });
      }
      
      // Verify password
      const validPassword = await argon2.verify(user.password, password);
      if (!validPassword) {
        return res.status(400).render('auth/login', {
          error: 'Invalid email or password',
          values: { email }
        });
      }
      
      // Create session
      req.session.user = {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      };
      
      // Save session and redirect
      req.session.save(err => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).render('auth/login', {
            error: 'An error occurred during login',
            values: { email }
          });
        }
        
        // Redirect based on role with cache control
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        if (user.role === 'admin') {
          return res.redirect(302, '/users/admin/dashboard');
        }
        return res.redirect(302, '/users/dashboard');
      });
      
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).render('auth/login', {
        error: 'An error occurred during login',
        values: req.body
      });
    }
  },
  
  register: async (req, res) => {
    try {
      const { username, email, password, confirmPassword } = req.body;
      
      // Validation
      if (password !== confirmPassword) {
        return res.status(400).render('auth/register', {
          error: 'Passwords do not match',
          values: { username, email }
        });
      }
      
      // Check if user already exists
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        return res.status(400).render('auth/register', {
          error: 'Email or username already in use',
          values: { username, email }
        });
      }
      
      // Hash password
      const hashedPassword = await argon2.hash(password);
      
      // Create new user
      const newUser = new User({
        username,
        email,
        password: hashedPassword
      });
      
      await newUser.save();
      
      // Auto login after registration
      req.session.user = {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      };
      
      // Save session and redirect with cache control headers
      req.session.save(err => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).render('auth/register', {
            error: 'Registration successful but error on automatic login',
            values: { username, email }
          });
        }
        
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.redirect(302, '/users/dashboard');
      });
      
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).render('auth/register', {
        error: 'An error occurred during registration',
        values: req.body
      });
    }
  },
  
  logout: async (req, res) => {
    try {
      // Destroy session
      req.session.destroy(err => {
        if (err) {
          console.error('Logout error:', err);
          return res.status(500).render('error', {
            error: 'An error occurred during logout'
          });
        }
        res.clearCookie('connect.sid');
        
        // Redirect with cache control headers
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.redirect(302, '/');
      });
      
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).render('error', {
        error: 'An error occurred during logout'
      });
    }
  },
  
  renderLogin: (req, res) => {
    // If user is already logged in, redirect to dashboard
    if (req.session.user) {
      return res.redirect('/users/dashboard');
    }
    res.render('auth/login', { error: null, values: {} });
  },
  
  renderRegister: (req, res) => {
    // If user is already logged in, redirect to dashboard
    if (req.session.user) {
      return res.redirect('/users/dashboard');
    }
    res.render('auth/register', { error: null, values: {} });
  }
};

module.exports = authController;
