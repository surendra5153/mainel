const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // 1) check Authorization header
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    // 2) fallback to cookie
    if (!token && req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        return next(); // Just continue as guest
    }

    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error('JWT secret not configured');
        const decoded = jwt.verify(token, secret);
        req.user = { id: decoded.id };
        next();
    } catch (err) {
        // If token is invalid, just ignore it and continue as guest
        // (Or could log it, but don't block)
        next();
    }
};
