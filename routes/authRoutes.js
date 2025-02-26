const express = require('express');
const authController = require('../controllers/authcontroller');
const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.delete('/logout', authController.logout);
router.get('/verify/:token', authController.verifyUser);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-code', authController.verifyResetCode);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
