import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

/**
 * POST /api/auth/register
 * Registers a new user with hashed password and returns JWT token.
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Email is already registered. Please sign in instead.',
        },
      });
      return;
    }

    // Create user (password will be hashed via pre-save hook)
    const user = new User({
      name,
      email: normalizedEmail,
      password,
      role: 'candidate',
      skills: [],
      education: [],
      experience: [],
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(user._id.toString(), user.role);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: user.toSafeUser(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/login
 * Verifies credentials and returns JWT token.
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Find user and explicitly select password field
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid email or password',
        },
      });
      return;
    }

    // Compare password hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid email or password',
        },
      });
      return;
    }

    // Generate JWT token
    const token = generateToken(user._id.toString(), user.role);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: user.toSafeUser(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 * Protected: Returns safe profile data for authenticated user.
 */
export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Not authenticated' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: req.user.toSafeUser(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/auth/profile
 * Protected: Updates profile fields (name, skills, education, experience).
 * Rejects modifications to role, password, _id, or createdAt.
 */
export async function updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        error: { message: 'Not authenticated' },
      });
      return;
    }

    const { name, skills, education, experience, role, password } = req.body;

    // Security check: Ignore or prevent role/password elevation through general profile update
    if (role !== undefined && role !== user.role) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Modifying user role is not permitted through this endpoint',
        },
      });
      return;
    }

    if (password !== undefined) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Password cannot be updated through profile update endpoint',
        },
      });
      return;
    }

    // Update allowed fields
    if (name !== undefined) user.name = name;
    if (skills !== undefined) user.skills = skills;
    if (education !== undefined) user.education = education;
    if (experience !== undefined) user.experience = experience;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: user.toSafeUser(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/logout
 * Stateless JWT Logout endpoint.
 */
export async function logout(req: Request, res: Response): Promise<void> {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully. Token discarded.',
  });
}
