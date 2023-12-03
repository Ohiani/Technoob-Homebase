let express = require('express');
let router = express.Router();
let controller = require('../controllers/index');
let auth = controller.auth;
const passport = require('passport');




/* GET users listing. */
router.post('/login',passport.authenticate('local', {
    failureRedirect: '/login',
}), auth.login);

router.post('/register', auth.register);
router.post('/logout', auth.logout);
router.get('/verify-email', auth.verifyEmail)
router.post('/forgot-password', auth.forgotPasswordEmail)
router.post('/reset-password', auth.reset_password)
router.get('/change-password', auth.change_password)
router.get('/oauth2/google', auth.googlelogin);
router.get('/oauth2/google/callback', auth.googleCallback, (req, res) => { res.redirect('/api/v1/user/dashboard') });
router.get('/oauth2/github', auth.githublogin);
router.get('/oauth2/github/callback', auth.githubCallback, (req, res) => { res.redirect('/api/v1/user/dashboard') });

router.post('/oauth2/github/auth/email', auth.githubEmail);
router.get('/oauth2/github/auth/failed', auth.renderEmail);


module.exports = router;