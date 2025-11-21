const Parse = require('parse/node');

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const sessionHeader = req.headers['x-session-token'];
    let token = null;

    if (header.startsWith('Bearer ')) {
      token = header.replace('Bearer ', '').trim();
    } else if (sessionHeader) {
      token = sessionHeader;
    }

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await Parse.User.become(token);
    req.user = user;
    req.sessionToken = token;
    next();
  } catch (err) {
    console.error('Auth error', err);
    return res.status(401).json({ message: 'Invalid session' });
  }
}

function requireRole(roles = []) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const userRole = req.user.get('role');
    if (roles.length > 0 && !roles.includes(userRole)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
