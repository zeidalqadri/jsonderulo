import express from 'express';
import bcrypt from 'bcryptjs';
import Joi from 'joi';
import { Database } from '../database/index.js';
import { generateJWT, generateApiKey } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(1).max(255).required(),
  password: Joi.string().min(8).required(),
  organization_name: Joi.string().min(1).max(255).optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Register new user
router.post('/register', validateRequest(registerSchema), async (req, res, next) => {
  try {
    const { email, name, password, organization_name } = req.body;

    // Check if user already exists
    const existingUser = await Database.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: 'User Already Exists',
        message: 'A user with this email already exists',
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate API key
    const apiKey = generateApiKey();

    // Create user
    const user = await Database.createUser({
      email,
      name,
      password_hash: passwordHash,
      api_key: apiKey,
      role: 'user',
    });

    // Generate JWT
    const token = generateJWT(user.id);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
      apiKey,
    });
  } catch (error) {
    next(error);
  }
});

// Login user
router.post('/login', validateRequest(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await Database.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid Credentials',
        message: 'Invalid email or password',
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid Credentials',
        message: 'Invalid email or password',
      });
    }

    // Generate JWT
    const token = generateJWT(user.id);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
});

// Generate new API key
router.post('/api-key', async (req, res, next) => {
  try {
    // This would normally require authentication
    // For simplicity, we'll just return a new API key
    const apiKey = generateApiKey();
    
    res.json({
      message: 'New API key generated',
      apiKey,
    });
  } catch (error) {
    next(error);
  }
});

export { router as authRoutes };