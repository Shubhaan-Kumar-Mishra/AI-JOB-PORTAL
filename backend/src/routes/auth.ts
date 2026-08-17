import { Router } from 'express';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireDB } from '../middleware/dbCheckMiddleware.js';
import { registerSchema, loginSchema, profileUpdateSchema } from '../validators/authValidators.js';
import { register, login, getMe, updateProfile, logout } from '../controllers/authController.js';

export const authRouter = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account
 * @access  Public
 */
authRouter.post('/register', requireDB, validateRequest(registerSchema), register);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and obtain JWT token
 * @access  Public
 */
authRouter.post('/login', requireDB, validateRequest(loginSchema), login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private
 */
authRouter.get('/me', authMiddleware, getMe);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update candidate profile details (skills, education, experience)
 * @access  Private
 */
authRouter.put('/profile', authMiddleware, requireDB, validateRequest(profileUpdateSchema), updateProfile);

/**
 * @route   POST /api/auth/logout
 * @desc    Log out current session
 * @access  Public / Private
 */
authRouter.post('/logout', logout);
