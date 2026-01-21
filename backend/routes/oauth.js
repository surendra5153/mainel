// routes/oauth.js (modify callback handlers)
const express = require('express');
const passport = require('passport');
const { createAccessToken, createRefreshToken } = require('../utils/tokenService');
const RefreshToken = require('../models/RefreshToken');

const router = express.Router();

// start flows...
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/api/oauth/failure' }),
  async (req, res) => {
    // set cookies
    const user = req.user;
    const accessToken = createAccessToken({ id: user._id });
    const refreshToken = await createRefreshToken(user._id);

    const parseTTL = (ttl) => {
      if (!ttl) return 15 * 60 * 1000;
      if (ttl.endsWith('d')) return parseInt(ttl.slice(0, -1), 10) * 24 * 60 * 60 * 1000;
      if (ttl.endsWith('h')) return parseInt(ttl.slice(0, -1), 10) * 60 * 60 * 1000;
      if (ttl.endsWith('m')) return parseInt(ttl.slice(0, -1), 10) * 60 * 1000;
      return 15 * 60 * 1000;
    };

    const accessTTL = parseTTL(process.env.ACCESS_TOKEN_EXPIRES_IN || '15m');
    const refreshTTL = parseTTL(process.env.REFRESH_TOKEN_EXPIRES_IN || '7d');

    const secure = process.env.COOKIE_SECURE === 'true';
    const sameSite = secure ? 'none' : 'lax';
    const domain = process.env.COOKIE_DOMAIN && process.env.COOKIE_DOMAIN.length ? process.env.COOKIE_DOMAIN : undefined;

    const cookieOpts = {
      httpOnly: true,
      secure,
      sameSite,
      maxAge: accessTTL
    };
    const cookieOptsRefresh = {
      httpOnly: true,
      secure,
      sameSite,
      maxAge: refreshTTL
    };
    if (domain) { cookieOpts.domain = domain; cookieOptsRefresh.domain = domain; }

    res.cookie('accessToken', accessToken, cookieOpts);
    res.cookie('refreshToken', refreshToken, cookieOptsRefresh);

    // redirect to frontend without tokens in URL
    const redirectBase = process.env.OAUTH_REDIRECT_URL || 'http://localhost:5173/auth/callback';
    return res.redirect(redirectBase + '?oauth=success');
  }
);

// github similarly
router.get('/github', passport.authenticate('github', { scope: ['user:email'], session: false }));

router.get('/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/api/oauth/failure' }),
  async (req, res) => {
    const user = req.user;
    const accessToken = createAccessToken({ id: user._id });
    const refreshToken = await createRefreshToken(user._id);

    // set cookies same as above
    const parseTTL = (ttl) => {
      if (!ttl) return 15 * 60 * 1000;
      if (ttl.endsWith('d')) return parseInt(ttl.slice(0, -1), 10) * 24 * 60 * 60 * 1000;
      if (ttl.endsWith('h')) return parseInt(ttl.slice(0, -1), 10) * 60 * 60 * 1000;
      if (ttl.endsWith('m')) return parseInt(ttl.slice(0, -1), 10) * 60 * 1000;
      return 15 * 60 * 1000;
    };

    const accessTTL = parseTTL(process.env.ACCESS_TOKEN_EXPIRES_IN || '15m');
    const refreshTTL = parseTTL(process.env.REFRESH_TOKEN_EXPIRES_IN || '7d');

    const secure = process.env.COOKIE_SECURE === 'true';
    const sameSite = secure ? 'none' : 'lax';
    const domain = process.env.COOKIE_DOMAIN && process.env.COOKIE_DOMAIN.length ? process.env.COOKIE_DOMAIN : undefined;

    const cookieOpts = {
      httpOnly: true,
      secure,
      sameSite,
      maxAge: accessTTL
    };
    const cookieOptsRefresh = {
      httpOnly: true,
      secure,
      sameSite,
      maxAge: refreshTTL
    };
    if (domain) { cookieOpts.domain = domain; cookieOptsRefresh.domain = domain; }

    res.cookie('accessToken', accessToken, cookieOpts);
    res.cookie('refreshToken', refreshToken, cookieOptsRefresh);

    const redirectBase = process.env.OAUTH_REDIRECT_URL || 'http://localhost:5173/auth/callback';
    return res.redirect(redirectBase + '?oauth=success');
  }
);

router.get('/failure', (req, res) => {
  return res.status(401).json({ message: 'OAuth authentication failed' });
});

module.exports = router;
