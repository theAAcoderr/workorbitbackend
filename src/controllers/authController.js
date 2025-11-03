const { User, Organization, HRManager, JoinRequest } = require('../models');
const { generateTokens, verifyToken } = require('../utils/jwt');
const { generateOrgCode, generateHRCode, generateEmployeeId } = require('../utils/codeGenerator');
const { Op } = require('sequelize');
const crypto = require('crypto');
const s3Service = require('../../services/s3.service');
const emailService = require('../services/emailService');
const adminNotificationService = require('../services/adminNotificationService');

// Helper function to decode HTML entities
const decodeHtmlEntities = (text) => {
  if (!text) return text;
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
};

// Helper function to decode HTML entities in object fields
const decodeUserData = (userData) => {
  if (!userData) return userData;

  const decoded = { ...userData };

  // Decode string fields that might contain HTML entities
  if (decoded.name) decoded.name = decodeHtmlEntities(decoded.name);
  if (decoded.department) decoded.department = decodeHtmlEntities(decoded.department);
  if (decoded.role) decoded.role = decodeHtmlEntities(decoded.role);
  if (decoded.designation) decoded.designation = decodeHtmlEntities(decoded.designation);

  // Decode organization name if present
  if (decoded.organization && decoded.organization.name) {
    decoded.organization.name = decodeHtmlEntities(decoded.organization.name);
  }

  return decoded;
};

// Register User
const register = async (req, res) => {
  try {
    const { email, password, name, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      name,
      phone,
      role: role || 'employee',
      status: role === 'admin' ? 'active' : 'pending_hr_approval',
      isEmailVerified: false,
      isAssigned: false
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);
    
    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Set refresh token in httpOnly cookie (secure)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: user.toJSON(),
        accessToken
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// Login User
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with email
    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'orgCode']
        }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      const lockTimeRemaining = Math.ceil((user.lockUntil - new Date()) / 1000 / 60);
      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${lockTimeRemaining} minutes.`
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment failed login attempts
      await user.incrementLoginAttempts();

      // 🔔 ADMIN NOTIFICATION: Failed login attempts (3+)
      if (user.loginAttempts >= 3 && user.organizationId) {
        await adminNotificationService.notifyFailedLoginAttempts(
          user.organizationId,
          {
            email: user.email,
            attemptCount: user.loginAttempts,
            ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
            location: 'Unknown',
            timestamp: new Date().toISOString()
          }
        ).catch(err => console.error('Admin notification error:', err));
      }

      // 🔔 ADMIN NOTIFICATION: Account lockout
      if (user.loginAttempts >= 5 && user.lockUntil && user.organizationId) {
        await adminNotificationService.notifyAccountLockout(
          user.organizationId,
          {
            userId: user.id,
            email: user.email,
            lockoutDuration: 15,
            unlockTime: new Date(user.lockUntil).toISOString()
          }
        ).catch(err => console.error('Admin notification error:', err));
      }

      const remainingAttempts = 5 - user.loginAttempts;
      if (remainingAttempts > 0) {
        return res.status(401).json({
          success: false,
          message: `Invalid email or password. ${remainingAttempts} attempts remaining before account lock.`
        });
      } else {
        return res.status(423).json({
          success: false,
          message: 'Account has been locked due to multiple failed login attempts. Please try again in 15 minutes.'
        });
      }
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);
    
    // Update user login info
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    // Set refresh token in httpOnly cookie (secure)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Prepare user data with null safety for mobile app
    const userData = user.toJSON();
    const safeUserData = {
      ...userData,
      phone: userData.phone || '',
      profilePicture: userData.profilePicture || '',
      department: userData.department || '',
      designation: userData.designation || '',
      employeeId: userData.employeeId || '',
      organizationId: userData.organizationId || '',
      orgCode: userData.orgCode || '',
      hrCode: userData.hrCode || '',
      managerId: userData.managerId || '',
      address: userData.address || null,
      emergencyContact: userData.emergencyContact || null,
      bankDetails: userData.bankDetails || null,
      organizationName: userData.organization?.name || '',
      organization: userData.organization || null
    };

    console.log('Login response user data:', JSON.stringify(safeUserData, null, 2));

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: safeUserData,
        accessToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Register Admin with Organization
const registerAdmin = async (req, res) => {
  try {
    const { 
      email, 
      password, 
      name, 
      phone, 
      organizationName,
      organizationEmail,
      organizationPhone,
      industry,
      size,
      address
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create admin user
    const adminUser = await User.create({
      email,
      password,
      name,
      phone,
      role: 'admin',
      status: 'active',
      isEmailVerified: true,
      isAssigned: true
    });

    // Generate organization code
    const orgCode = await generateOrgCode(Organization);

    // Create organization
    const organization = await Organization.create({
      orgCode,
      name: organizationName,
      email: organizationEmail || email,
      phone: organizationPhone || phone,
      industry,
      size,
      address,
      adminId: adminUser.id
    });

    // Update admin user with organization
    adminUser.organizationId = organization.id;
    adminUser.orgCode = orgCode;
    await adminUser.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(adminUser);
    adminUser.refreshToken = refreshToken;
    await adminUser.save();

    res.status(201).json({
      success: true,
      message: 'Admin and organization created successfully',
      data: {
        user: adminUser.toJSON(),
        organization,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Admin registration failed',
      error: error.message
    });
  }
};

// Register Staff (HR, Manager, Employee)
const registerStaff = async (req, res) => {
  try {
    const { 
      email, 
      password, 
      name, 
      phone, 
      role,
      requestedOrgCode,
      requestedHRCode,
      requestMessage
    } = req.body;

    // Validate role
    if (!['hr', 'manager', 'employee'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    let organization = null;
    let hrManager = null;

    // Validate codes based on role
    if (role === 'hr') {
      // HR needs organization code
      if (!requestedOrgCode) {
        return res.status(400).json({
          success: false,
          message: 'Organization code is required for HR registration'
        });
      }
      
      organization = await Organization.findOne({ 
        where: { orgCode: requestedOrgCode } 
      });
      
      if (!organization) {
        return res.status(404).json({
          success: false,
          message: 'Invalid organization code'
        });
      }
    } else {
      // Manager and Employee need HR code
      if (!requestedHRCode) {
        return res.status(400).json({
          success: false,
          message: 'HR code is required for staff registration'
        });
      }
      
      hrManager = await HRManager.findOne({ 
        where: { hrCode: requestedHRCode },
        include: [{
          model: Organization,
          as: 'organization'
        }]
      });
      
      if (!hrManager) {
        return res.status(404).json({
          success: false,
          message: 'Invalid HR code'
        });
      }
      
      organization = hrManager.organization;
    }

    // Create user with pending status
    const user = await User.create({
      email,
      password,
      name,
      phone,
      role,
      status: role === 'hr' ? 'pending_hr_approval' : 'pending_staff_approval',
      requestedRole: role,
      requestedOrgCode,
      requestedHRCode,
      isAssigned: false
    });

    // Create join request
    const joinRequest = await JoinRequest.create({
      userId: user.id,
      requestType: role === 'hr' ? 'hr_join' : 'staff_join',
      requestedRole: role,
      requestedOrgCode,
      requestedHRCode,
      organizationId: organization.id,
      requestMessage,
      status: 'pending'
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    // 🔔 ADMIN NOTIFICATION: New employee registered
    if (organization && organization.id) {
      await adminNotificationService.notifyEmployeeRegistered(
        organization.id,
        {
          employeeId: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department || 'Not assigned'
        }
      ).catch(err => console.error('Admin notification error:', err));
    }

    res.status(201).json({
      success: true,
      message: `${role} registration successful. Waiting for approval.`,
      data: {
        user: user.toJSON(),
        joinRequest,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Staff registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Staff registration failed',
      error: error.message
    });
  }
};

// Refresh Token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Find user
    const user = await User.findOne({
      where: { 
        id: decoded.id,
        refreshToken
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: tokens
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Token refresh failed',
      error: error.message
    });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const user = req.user;
    
    // Clear refresh token
    user.refreshToken = null;
    await user.save();

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
};

// Get Current User
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'orgCode', 'email', 'phone']
        },
        {
          model: HRManager,
          as: 'hrManager',
          attributes: ['id', 'hrCode', 'permissions', 'department']
        }
      ]
    });

    // Decode HTML entities in user data before sending
    const userData = decodeUserData(user.toJSON());

    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user information',
      error: error.message
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, department, designation } = req.body;

    // Find user and update
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (department) user.department = department;
    if (designation) user.designation = designation;

    await user.save();

    // Return updated user data
    const updatedUser = await User.findByPk(userId, {
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'orgCode', 'email', 'phone']
        },
        {
          model: HRManager,
          as: 'hrManager',
          attributes: ['id', 'hrCode', 'permissions', 'department']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser.toJSON()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// Update profile picture
const updateProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old profile picture from S3 if exists
    if (user.profilePicture) {
      try {
        // Extract key from existing URL
        const urlParts = user.profilePicture.split('.amazonaws.com/');
        if (urlParts.length > 1) {
          const oldKey = urlParts[1];
          await s3Service.deleteFile(oldKey);
        }
      } catch (deleteError) {
        console.log('Could not delete old profile picture:', deleteError.message);
        // Continue with upload even if deletion fails
      }
    }

    // Upload new file to S3
    const uploadResult = await s3Service.uploadFile(req.file, 'profile-pictures');

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload profile picture to cloud storage',
        error: uploadResult.error
      });
    }

    // Update user profile picture with S3 URL
    user.profilePicture = uploadResult.data.url;
    await user.save();

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      data: {
        profilePicture: uploadResult.data.url,
        key: uploadResult.data.key
      }
    });
  } catch (error) {
    console.error('Update profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile picture',
      error: error.message
    });
  }
};

// Request password reset with OTP
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset code has been sent.'
      });
    }

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the OTP for storage
    const hashedOTP = crypto.createHash('sha256').update(otpCode).digest('hex');

    // Store hashed OTP and expiry time (15 minutes)
    user.passwordResetToken = hashedOTP;
    user.passwordResetExpires = new Date(Date.now() + 900000); // 15 minutes
    await user.save();

    // Send email with OTP
    const emailSent = await emailService.sendPasswordResetOTP({
      email: user.email,
      name: user.name,
      otpCode: otpCode
    });

    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset code has been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing password reset request',
      error: error.message
    });
  }
};

// Verify OTP code
const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Hash the OTP to compare with stored hash
    const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

    // Find user with valid OTP
    const user = await User.findOne({
      where: {
        email,
        passwordResetToken: hashedOTP,
        passwordResetExpires: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired code'
      });
    }

    // Generate a temporary token for password reset
    const tempToken = crypto.randomBytes(32).toString('hex');
    const hashedTempToken = crypto.createHash('sha256').update(tempToken).digest('hex');

    // Update user with temporary token (valid for 5 minutes)
    user.passwordResetToken = hashedTempToken;
    user.passwordResetExpires = new Date(Date.now() + 300000); // 5 minutes
    await user.save();

    res.json({
      success: true,
      message: 'OTP verified successfully',
      resetToken: tempToken // This token will be used to reset password
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying OTP',
      error: error.message
    });
  }
};

// Reset password with token
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password (will be hashed by the model hook)
    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
};

// Update OneSignal Player ID
const updateOneSignalPlayerId = async (req, res) => {
  try {
    const { playerId } = req.body;
    const userId = req.user.id;

    if (!playerId) {
      return res.status(400).json({
        success: false,
        message: 'Player ID is required'
      });
    }

    // Update user's OneSignal Player ID
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.update({ oneSignalPlayerId: playerId });

    console.log(`✅ OneSignal Player ID updated for user ${user.email}: ${playerId}`);

    res.json({
      success: true,
      message: 'Player ID updated successfully',
      playerId: playerId
    });

  } catch (error) {
    console.error('Update Player ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update Player ID',
      error: error.message
    });
  }
};

// Legacy verify reset token (keeping for backward compatibility)
const verifyResetToken = verifyResetOTP;

module.exports = {
  register,
  login,
  registerAdmin,
  registerStaff,
  refreshToken,
  logout,
  getCurrentUser,
  updateProfile,
  updateProfilePicture,
  updateOneSignalPlayerId,
  forgotPassword,
  verifyResetOTP,
  verifyResetToken,
  resetPassword
};