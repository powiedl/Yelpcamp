const express = require('express');
const router = express.Router();
const User = require('../models/user');
const passport = require('passport');
const catchAsync = require('../utils/catchAsync');
const users = require('../controllers/user');

const { storeReturnTo, isLoggedIn } = require('../middleware');

router.route('/register')
    .get(users.renderRegisterForm)
    .post(catchAsync(users.register));

router.route('/login')
    .get(users.renderLoginForm)
    .post(storeReturnTo,
        users.usernameToLowerCase,
        passport.authenticate('local',
        {failureFlash: true,
        failureRedirect: '/login'}),
        users.login);

router.get('/logout', users.logout);

router.route('/edit')
    .get(isLoggedIn,users.renderEditForm)
    .post(isLoggedIn,catchAsync(users.update));

router.route('/change-password')
    .get(isLoggedIn,users.renderChangePasswordForm)
    .post(isLoggedIn,catchAsync(users.changePassword));

module.exports = router;