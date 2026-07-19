import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import { generateToken } from '../utils/jwt';
import { buildBrandEmailTemplate, sendEmail } from '../utils/email';

const createOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendVerificationEmail = async (email: string, name: string, otp: string): Promise<void> => {
  const subject = 'Your verification code';
  const { html, text } = buildBrandEmailTemplate({
    title: 'Verify your account',
    greeting: `Hello ${name},`,
    intro: 'Use the verification code below to confirm your email address.',
    bodyHtml: `
      <div style="margin-top: 10px; padding: 18px 20px; background: #f8faf8; border: 1px solid #dce9df; border-radius: 14px; text-align: center;">
        <div style="font-size: 13px; letter-spacing: 0.24em; text-transform: uppercase; color: #6b7280; margin-bottom: 10px;">One-time code</div>
        <div style="font-size: 32px; font-weight: 700; letter-spacing: 0.24em; color: #1f5f3b;">${otp}</div>
      </div>
      <p style="margin-top: 16px; margin-bottom: 8px;">This code expires in 5 minutes.</p>
      <p style="margin: 0; color: #6b7280;">If you did not request this email, you can ignore it safely.</p>
    `,
    bodyText: `Hello ${name}. Use the verification code below to confirm your email address. Code: ${otp}. This code expires in 5 minutes. If you did not request this email, you can ignore it safely.`,
    footerNote: 'Need help? Reply to this email and our team will assist you.',
  });

  await sendEmail({ to: email, subject, html, text, replyTo: 'support@mokshyafoods.com' });
};

const createOtpForUser = async (user: IUser): Promise<void> => {
  const otp = createOtp();
  const hash = await bcrypt.hash(otp, 10);
  user.otpHash = hash;
  user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
  user.otpAttempts = 0;
  user.otpSentAt = new Date();
  await user.save();
  await sendVerificationEmail(user.email, user.name, otp);
};

export const register = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name, email, password, phone } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      phone?: string;
    };

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists',
      });
    }

    const user = new User({
      name,
      email,
      password,
      phone,
      isVerified: false,
    });

    await user.save();
    await createOtpForUser(user);

    const token = generateToken(user._id.toString(), user.role);
    const userResponse = user.toObject() as unknown as Record<string, unknown>;
    const { password: _password, otpHash: _otpHash, otpExpiresAt: _otpExpiresAt, otpAttempts: _otpAttempts, otpSentAt: _otpSentAt, ...safeUserResponse } = userResponse;

    return res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email.',
      token,
      user: safeUserResponse,
    });
  } catch (error: unknown) {
    console.error('Register error:', error);
    const message = error instanceof Error ? error.message : 'Registration failed';
    return res.status(500).json({
      success: false,
      message,
    });
  }
};

export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email }).select('+password +otpHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = generateToken(user._id.toString(), user.role);
    const userResponse = user.toObject() as unknown as Record<string, unknown>;
    const { password: _password, otpHash: _otpHash, otpAttempts: _otpAttempts, otpSentAt: _otpSentAt, otpExpiresAt: _otpExpiresAt, ...safeUserResponse } = userResponse;

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: safeUserResponse,
    });
  } catch (error: unknown) {
    console.error('Login error:', error);
    const message = error instanceof Error ? error.message : 'Login failed';
    return res.status(500).json({
      success: false,
      message,
    });
  }
};

export const verifyEmail = async (req: Request & { userId?: string }, res: Response): Promise<Response> => {
  try {
    const { otp } = req.body as { otp?: string };

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required',
      });
    }

    const user = await User.findById(req.userId).select('+otpHash +otpExpiresAt +otpAttempts');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.isVerified) {
      return res.json({
        success: true,
        message: 'Email already verified',
      });
    }

    if (!user.otpHash || !user.otpExpiresAt || Date.now() > user.otpExpiresAt.getTime()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new code.',
      });
    }

    if (user.otpAttempts >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Too many invalid attempts. Please request a new OTP.',
      });
    }

    const isValidOtp = await bcrypt.compare(otp, user.otpHash);
    if (!isValidOtp) {
      user.otpAttempts += 1;
      await user.save();
      return res.status(401).json({
        success: false,
        message: 'Invalid OTP. Please try again.',
      });
    }

    user.isVerified = true;
    user.otpHash = undefined;
    user.otpExpiresAt = undefined;
    user.otpAttempts = 0;
    user.otpSentAt = undefined;
    await user.save();

    return res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error: unknown) {
    console.error('Verify email error:', error);
    const message = error instanceof Error ? error.message : 'Failed to verify email';
    return res.status(500).json({
      success: false,
      message,
    });
  }
};

export const resendOtp = async (req: Request & { userId?: string }, res: Response): Promise<Response> => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.isVerified) {
      return res.json({
        success: true,
        message: 'Email already verified',
      });
    }

    await createOtpForUser(user);

    return res.json({
      success: true,
      message: 'A new verification code has been sent to your email.',
    });
  } catch (error: unknown) {
    console.error('Resend OTP error:', error);
    const message = error instanceof Error ? error.message : 'Failed to resend OTP';
    return res.status(500).json({
      success: false,
      message,
    });
  }
};

export const logout = (_req: Request, res: Response): Response => {
  // Clear common auth cookies if present
  try {
    res.clearCookie('token', { path: '/' });
    res.clearCookie('auth', { path: '/' });
    res.clearCookie('connect.sid', { path: '/' });
  } catch (err) {
    // ignore
  }

  return res.json({
    success: true,
    message: 'Logout successful',
  });
};
