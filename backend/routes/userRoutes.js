const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/logout', userController.logoutUser);
router.get('/history', userController.getLoginHistory);
router.get('/profile/:username', userController.getUserProfile);
router.put('/profile/:username', userController.updateUserProfile);

// Admin / User management routes
router.get('/', userController.getAllUsers);
router.put('/:id/password', userController.changePassword);

module.exports = router;
