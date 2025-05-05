// Authentication middleware

// Check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
};

// Check if user is an admin
const isAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).render('error', { error: 'Unauthorized: Admin access required' });
  }
  next();
};

module.exports = { isAuthenticated, isAdmin };
