// config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

const setupPassport = () => {
  // DEBUG: print env values (only show truncated / present/missing — don't print secrets)
  const envShow = (name) => {
    const v = process.env[name];
    if (!v) return '<MISSING>';
    // print small prefix to confirm presence without leaking secret in logs
    return `${v.length} chars`;
  };

  console.log('Passport ENV debug: GOOGLE_CLIENT_ID=', envShow('GOOGLE_CLIENT_ID'));
  console.log('Passport ENV debug: GOOGLE_CLIENT_SECRET=', envShow('GOOGLE_CLIENT_SECRET'));
  console.log('Passport ENV debug: GOOGLE_CALLBACK_URL=', process.env.GOOGLE_CALLBACK_URL || '<MISSING>');
  console.log('Passport ENV debug: GITHUB_CLIENT_ID=', envShow('GITHUB_CLIENT_ID'));
  console.log('Passport ENV debug: GITHUB_CLIENT_SECRET=', envShow('GITHUB_CLIENT_SECRET'));
  console.log('Passport ENV debug: GITHUB_CALLBACK_URL=', process.env.GITHUB_CALLBACK_URL || '<MISSING>');

  // GOOGLE
  const gId = process.env.GOOGLE_CLIENT_ID;
  const gSecret = process.env.GOOGLE_CLIENT_SECRET;
  const gCallback = process.env.GOOGLE_CALLBACK_URL;

  if (gId && gSecret && gCallback) {
    try {
      passport.use(new GoogleStrategy({
        clientID: gId,
        clientSecret: gSecret,
        callbackURL: gCallback
      }, async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails[0] && profile.emails[0].value;
          const avatar = profile.photos && profile.photos[0] && profile.photos[0].value;
          const providerId = profile.id;

          // SECURITY FIX: Strictly require email verification from Google
          // profile._json.email_verified is the raw claim from Google OIDC
          if (profile._json.email_verified !== true) {
            console.error(`Passport: Google login rejected for ${email} - Email not verified.`);
            return done(null, false, { message: 'Google account email must be verified.' });
          }

          let user = await User.findOne({ 'providers.provider': 'google', 'providers.providerId': providerId });

          if (!user && email) {
            user = await User.findOne({ email: email.toLowerCase() });
          }

          if (!user) {
            user = new User({
              name: profile.displayName || (email ? email.split('@')[0] : 'Google User'),
              email: email ? email.toLowerCase() : `no-email-${providerId}@oauth.local`,
              avatarUrl: avatar || '',
              providers: [{
                provider: 'google',
                providerId,
                email,
                avatarUrl: avatar
              }]
            });
          } else {
            const hasProvider = (user.providers || []).some(p => p.provider === 'google' && p.providerId === providerId);
            if (!hasProvider) {
              user.providers = user.providers || [];
              user.providers.push({
                provider: 'google',
                providerId,
                email,
                avatarUrl: avatar
              });
            }
            if (!user.avatarUrl && avatar) user.avatarUrl = avatar;
            if (!user.name && profile.displayName) user.name = profile.displayName;
          }

          await user.save();
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }));
      console.log('Passport: Google strategy configured');
    } catch (err) {
      console.error('Passport: failed to configure Google strategy:', err && err.message ? err.message : err);
    }
  } else {
    console.warn('Passport: Google strategy skipped (missing required env).');
  }

  // GITHUB
  const ghId = process.env.GITHUB_CLIENT_ID;
  const ghSecret = process.env.GITHUB_CLIENT_SECRET;
  const ghCallback = process.env.GITHUB_CALLBACK_URL;

  if (ghId && ghSecret && ghCallback) {
    try {
      passport.use(new GitHubStrategy({
        clientID: ghId,
        clientSecret: ghSecret,
        callbackURL: ghCallback,
        scope: ['user:email']
      }, async (accessToken, refreshToken, profile, done) => {
        try {
          const emails = profile.emails || [];
          const primaryEmailObj = emails.find(e => e.primary) || emails[0] || null;
          const email = primaryEmailObj ? primaryEmailObj.value : null;
          const avatar = profile.photos && profile.photos[0] && profile.photos[0].value;
          const providerId = profile.id;

          let user = await User.findOne({ 'providers.provider': 'github', 'providers.providerId': providerId });

          if (!user && email) {
            user = await User.findOne({ email: email.toLowerCase() });
          }

          if (!user) {
            user = new User({
              name: profile.displayName || profile.username || (email ? email.split('@')[0] : 'GitHub User'),
              email: email ? email.toLowerCase() : `no-email-${providerId}@oauth.local`,
              avatarUrl: avatar || '',
              providers: [{
                provider: 'github',
                providerId,
                email,
                avatarUrl: avatar
              }]
            });
          } else {
            const hasProvider = (user.providers || []).some(p => p.provider === 'github' && p.providerId === providerId);
            if (!hasProvider) {
              user.providers = user.providers || [];
              user.providers.push({
                provider: 'github',
                providerId,
                email,
                avatarUrl: avatar
              });
            }
            if (!user.avatarUrl && avatar) user.avatarUrl = avatar;
            if (!user.name && (profile.displayName || profile.username)) user.name = profile.displayName || profile.username;
          }

          await user.save();
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }));
      console.log('Passport: GitHub strategy configured');
    } catch (err) {
      console.error('Passport: failed to configure GitHub strategy:', err && err.message ? err.message : err);
    }
  } else {
    console.warn('Passport: GitHub strategy skipped (missing required env).');
  }

  // No-op serializers (safe)
  try {
    passport.serializeUser && passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser && passport.deserializeUser((id, done) => {
      User.findById(id).then(u => done(null, u)).catch(err => done(err, null));
    });
  } catch (e) {
    // ignore if passport doesn't expose these
  }
};

module.exports = setupPassport;
