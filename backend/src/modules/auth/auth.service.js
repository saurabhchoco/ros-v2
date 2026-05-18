const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../../config/db');
const admin = require('../../config/firebase');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '24h';
const REFRESH_TOKEN_EXPIRY = '7d';

/**
 * Login user with email and password
 */
async function loginWithEmail(email, password) {
  try {
    // Query user from database
    const result = await pool.query(
      'SELECT id, email, password_hash, full_name, role, organization_id, outlet_id FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    const user = result.rows[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return {
        success: false,
        message: 'Invalid password'
      };
    }

    // Generate tokens
    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Return user data without password
    return {
      success: true,
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        organizationId: user.organization_id,
        outletId: user.outlet_id
      }
    };
  } catch (error) {
    console.error('Login with email error:', error);
    return {
      success: false,
      message: 'An error occurred during login'
    };
  }
}

/**
 * Login user with Firebase ID token
 */
async function loginWithFirebase(idToken) {
  try {
    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email;

    // Check if user exists in database
    let result = await pool.query(
      'SELECT id, email, full_name, role, organization_id, outlet_id FROM users WHERE firebase_uid = $1',
      [firebaseUid]
    );

    let user;

    if (result.rows.length === 0) {
      // Create new user if doesn't exist
      const createResult = await pool.query(
        `INSERT INTO users (firebase_uid, email, full_name, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING id, email, full_name, role, organization_id, outlet_id`,
        [firebaseUid, email, decodedToken.name || 'Firebase User', 'staff']
      );
      user = createResult.rows[0];
    } else {
      user = result.rows[0];
    }

    // Generate tokens
    const token = generateAccessToken({
      id: user.id,
      email: user.email,
      firebase_uid: firebaseUid
    });
    const refreshToken = generateRefreshToken({
      id: user.id,
      firebase_uid: firebaseUid
    });

    return {
      success: true,
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        organizationId: user.organization_id,
        outletId: user.outlet_id
      }
    };
  } catch (error) {
    console.error('Firebase login error:', error);
    return {
      success: false,
      message: 'Firebase authentication failed'
    };
  }
}

/**
 * Refresh access token using refresh token
 */
async function refreshToken(refreshTokenValue) {
  try {
    const decoded = jwt.verify(refreshTokenValue, JWT_SECRET);

    // Generate new access token
    const newToken = generateAccessToken(decoded);

    return {
      success: true,
      token: newToken,
      refreshToken: refreshTokenValue // Can optionally generate a new refresh token
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    return {
      success: false,
      message: 'Invalid refresh token'
    };
  }
}

/**
 * Generate JWT access token
 */
function generateAccessToken(user) {
  const payload = {
    uid: user.id || user.firebase_uid,
    email: user.email,
    role: user.role,
    organizationId: user.organization_id,
    outletId: user.outlet_id
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
    issuer: 'r-os-api',
    subject: user.id
  });
}

/**
 * Generate JWT refresh token
 */
function generateRefreshToken(user) {
  const payload = {
    uid: user.id || user.firebase_uid,
    type: 'refresh'
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: 'r-os-api'
  });
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Hash password
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

module.exports = {
  loginWithEmail,
  loginWithFirebase,
  refreshToken,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  hashPassword
};
