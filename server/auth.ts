import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { storage } from './storage';
import { RegisterRequest, LoginRequest, AuthResponse, User } from '@shared/schema';
import { z } from 'zod';

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'nudge-app-development-secret';

// JWT token expiration (1 day)
const TOKEN_EXPIRATION = '1d';

// Define schema for registration validation
const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6)
});

// Define schema for login validation
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// Helper to generate JWT token
export const generateToken = (user: User): string => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email 
    }, 
    JWT_SECRET, 
    { expiresIn: TOKEN_EXPIRATION }
  );
};

// Middleware to verify JWT token
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from cookie
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
    
    // Get user from database
    const user = await storage.getUserById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid authentication token' });
    }
    
    // Attach user to request object
    (req as any).user = {
      id: user.id,
      username: user.username,
      email: user.email
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

// Handler for user registration
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body as RegisterRequest;
    
    // Validate request body
    const validationResult = registerSchema.safeParse({ username, email, password });
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validationResult.error.errors 
      });
    }
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    // Create new user
    const user = await storage.createUser(username, email, password);
    
    // Generate token
    const token = generateToken(user);
    
    // Set token as HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    
    // Return user info (excluding password)
    const response: AuthResponse = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    };
    
    return res.status(201).json(response);
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Error registering user' });
  }
};

// Handler for user login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as LoginRequest;
    
    // Validate request body
    const validationResult = loginSchema.safeParse({ email, password });
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validationResult.error.errors 
      });
    }
    
    // Find user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = generateToken(user);
    
    // Set token as HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    
    // Return user info
    const response: AuthResponse = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    };
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Error during login' });
  }
};

// Handler for user logout
export const logout = (req: Request, res: Response) => {
  // Clear the cookie
  res.clearCookie('token');
  return res.status(200).json({ message: 'Logged out successfully' });
};

// Handler to check current authenticated user
export const getCurrentUser = (req: Request, res: Response) => {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  return res.status(200).json({ user });
};

// Helper to extract user ID from request
export const getUserId = (req: Request): number => {
  return (req as any).user?.id;
};