import { Response } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User';
import Student from '../models/Student';
import Parent from '../models/Parent';
import Tutor from '../models/Tutor';
import { AuthRequest } from '../middleware/auth.middleware';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.util';
import { OAuthProvider, verifyProviderToken } from '../utils/oauth.util';

type RoleProfileOptions = {
  parentId?: string;
  profileData?: any;
  context?: 'register' | 'login' | 'me';
};

const getOrCreateRoleProfile = async (user: any, options: RoleProfileOptions = {}) => {
  if (!user) return null;

  const context = options.context || 'login';

  if (user.role === 'student') {
    let student = await Student.findOne({ userId: user._id });
    if (!student) {
      const parentId = options.parentId || user._id; // fallback to user to avoid required field errors
      student = await Student.create({
        userId: user._id,
        parentId,
        academicInfo: {
          currentGrade: options.profileData?.gradeLevel || 'Unassigned',
          curriculum: options.profileData?.curriculum || 'Nigeria',
        },
        enrolledSubjects: [],
        performance: {
          overallGrade: 0,
          overallPercentage: 0,
          attendance: 100,
          completedAssignments: 0,
          totalAssignments: 0,
        },
        emergencyContact: {
          name: user.profile?.firstName || 'Self',
          relationship: 'self',
          phone: user.profile?.phoneNumber || 'N/A',
        },
      });
      console.log('[AUTH] Auto-created student profile', {
        userId: user._id.toString(),
        context,
        parentIdUsed: parentId,
      });
    }
    return student;
  }

  if (user.role === 'parent') {
    let parent = await Parent.findOne({ userId: user._id });
    if (!parent) {
      parent = await Parent.create({
        userId: user._id,
        children: [],
        wallet: {
          balance: 0,
          currency: 'NGN',
          transactions: [],
        },
      });
    }
    return parent;
  }

  if (user.role === 'tutor') {
    let tutor = await Tutor.findOne({ userId: user._id });
    if (!tutor) {
      tutor = await Tutor.create({
        userId: user._id,
        qualifications: [],
        expertise: [],
        experience: [],
      });
    }
    return tutor;
  }

  return null;
};

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req: AuthRequest, res: Response) => {
  try {
    const {
      email,
      password,
      role,
      profile,
      firstName,
      lastName,
      phoneNumber,
      profilePicture,
      parentId,
      ...rest
    } = req.body;

    const profileData = profile && typeof profile === 'object' ? profile : {};
    const normalizedProfile = {
      firstName: (profileData.firstName || firstName || '').trim(),
      lastName: (profileData.lastName || lastName || '').trim(),
      phoneNumber: profileData.phoneNumber || phoneNumber || '',
      profilePicture: profileData.profilePicture || profilePicture || '',
    };

    console.log('[AUTH][Register] incoming payload', {
      email,
      role,
      profile: {
        firstName: normalizedProfile.firstName,
        lastName: normalizedProfile.lastName,
        middleName: profileData?.middleName,
        phoneNumber: normalizedProfile.phoneNumber,
        parentId: profileData?.parentId || parentId,
      },
    });

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and role are required',
      });
    }

    if (!normalizedProfile.firstName || !normalizedProfile.lastName) {
      return res.status(400).json({
        success: false,
        message: 'First name and last name are required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    const user = await User.create({
      email: email.toLowerCase(),
      password,
      role,
      profile: normalizedProfile,
      status: 'active',
    });

    const { accessToken, refreshToken } = generateTokens({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    user.refreshToken = refreshToken;
    await user.save();

    const roleProfile = await getOrCreateRoleProfile(user, {
      parentId: profileData?.parentId || parentId,
      profileData: { ...profileData, ...normalizedProfile, ...rest },
      context: 'register',
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile,
        },
        roleProfile,
        accessToken,
        refreshToken,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if user is active
    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.',
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact support to reactivate.',
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const { accessToken, refreshToken } = generateTokens({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    user.refreshToken = refreshToken;
    await user.save();

    const roleProfile = await getOrCreateRoleProfile(user, {
      context: 'login',
    });

    console.log('[AUTH] Login successful', {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
      hasRoleProfile: Boolean(roleProfile),
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile,
          status: user.status,
          verification: user.verification,
          lastLogin: user.lastLogin,
        },
        roleProfile,
        accessToken,
        refreshToken,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * OAuth login/signup
 * POST /api/auth/oauth
 */
export const oauthLogin = async (req: AuthRequest, res: Response) => {
  try {
    const { provider, token, role, profile } = req.body;

    if (!provider || !token) {
      return res.status(400).json({
        success: false,
        message: 'Provider and token are required',
      });
    }

    const normalizedProvider = (provider as string).toLowerCase() as OAuthProvider;
    const providerProfile = await verifyProviderToken(normalizedProvider, token);

    if (!providerProfile.email) {
      return res.status(400).json({
        success: false,
        message: 'No email returned from provider',
      });
    }

    const normalizedEmail = providerProfile.email.toLowerCase();
    let user = await User.findOne({ email: normalizedEmail }).select('+password');

    const incomingProfile = profile && typeof profile === 'object' ? profile : {};
    const normalizedProfile = {
      firstName: (incomingProfile.firstName || providerProfile.firstName || '').trim(),
      lastName: (incomingProfile.lastName || providerProfile.lastName || '').trim(),
      phoneNumber: incomingProfile.phoneNumber || '',
      profilePicture: incomingProfile.profilePicture || '',
    };

    const isProfileComplete =
      Boolean(normalizedProfile.firstName) &&
      Boolean(normalizedProfile.lastName) &&
      Boolean(normalizedProfile.phoneNumber);

    if (!user) {
      if (!role) {
        return res.status(400).json({
          success: false,
          message: 'Role is required for new OAuth registrations',
        });
      }

      user = await User.create({
        email: normalizedEmail,
        role,
        provider: normalizedProvider,
        providerId: providerProfile.providerId,
        profile: normalizedProfile,
        status: 'active',
        profileComplete: isProfileComplete,
        verification: {
          emailVerified: providerProfile.emailVerified ?? false,
          phoneVerified: false,
          identityVerified: false,
        },
      });
    } else {
      user.provider = user.provider || normalizedProvider;
      user.providerId = user.providerId || providerProfile.providerId;
      user.profile.firstName = user.profile.firstName || normalizedProfile.firstName;
      user.profile.lastName = user.profile.lastName || normalizedProfile.lastName;
      user.profile.phoneNumber = user.profile.phoneNumber || normalizedProfile.phoneNumber;
      user.profile.profilePicture = user.profile.profilePicture || normalizedProfile.profilePicture;

      if (typeof providerProfile.emailVerified !== 'undefined') {
        user.verification.emailVerified = providerProfile.emailVerified;
      }

      if (!user.profileComplete && isProfileComplete) {
        user.profileComplete = true;
      }

      await user.save();
    }

    user.lastLogin = new Date();

    const { accessToken, refreshToken } = generateTokens({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    user.refreshToken = refreshToken;
    await user.save();

    const roleProfile = await getOrCreateRoleProfile(user, { context: 'login' });

    res.json({
      success: true,
      message: 'OAuth login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile,
          status: user.status,
          verification: user.verification,
          profileComplete: user.profileComplete,
          provider: user.provider,
        },
        roleProfile,
        accessToken,
        refreshToken,
        profileComplete: user.profileComplete,
      },
    });
  } catch (error: any) {
    console.error('OAuth login error:', error.response?.data || error.message || error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error with OAuth login',
    });
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.userId).select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const roleProfile = await getOrCreateRoleProfile(user, { context: 'me' });

    res.status(200).json({
      success: true,
      data: {
        user,
        roleProfile,
      },
    });
  } catch (error: any) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Update user profile
 * PATCH /api/auth/profile
 */
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { profile } = req.body;

    const user = await User.findById(req.user?.userId).select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (profile && typeof profile === 'object') {
      user.profile = {
        ...user.profile,
        ...profile,
      };

      const hasRequiredProfile =
        Boolean(user.profile?.firstName) &&
        Boolean(user.profile?.lastName) &&
        Boolean(user.profile?.phoneNumber);

      if (hasRequiredProfile) {
        user.profileComplete = true;
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh-token
 */
export const refreshToken = async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    const tokens = generateTokens({
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      data: tokens,
    });
  } catch (error: any) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Invalid or expired refresh token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = async (req: AuthRequest, res: Response) => {
  try {
    // In a production app, you would:
    // 1. Invalidate the refresh token in DB/Redis
    // 2. Optionally blacklist the access token until it expires

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging out',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
