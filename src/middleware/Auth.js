import { StatusCodes } from 'http-status-codes';
import { responseMessage } from '../utils/ResponseMessage.js';
import Logger from '../utils/Logger.js';
import User from '../models/user/User.js';
import Admin from '../models/admin/Admin.js';
import { verifyToken } from '../services/TokenService.js';
import {
  CatchErrorHandler,
  ResponseHandler,
} from '../services/CommonServices.js';
import config from '../config/Index.js';

const logger = new Logger('src/middleware/Auth.js');

//#region Extract Token Helper
const extractToken = (req) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }
  return req.headers['auth'];
};
//#endregion

//#region User Auth Middleware (Access Token)
export const userAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return ResponseHandler(res, StatusCodes.UNAUTHORIZED, responseMessage.TOKEN_REQUIRED);
    }

    const decodeToken = verifyToken(token, config.JWT_SECRET_KEY);
    if (!decodeToken || !decodeToken.id) {
      return ResponseHandler(res, StatusCodes.UNAUTHORIZED, responseMessage.INVALID_TOKEN);
    }

    const user = await User.findById(decodeToken.id);
    if (!user) {
      return ResponseHandler(res, StatusCodes.NOT_FOUND, responseMessage.USER_NOT_FOUND);
    }
    if (user.isDeleted) {
      return ResponseHandler(res, StatusCodes.UNAUTHORIZED, responseMessage.USER_ACCOUNT_DELETED || 'User account is deleted');
    }
    if (!user.isActive) {
      return ResponseHandler(res, StatusCodes.UNAUTHORIZED, responseMessage.USER_NOT_ACTIVE);
    }

    req.user_id = user._id;
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ResponseHandler(res, StatusCodes.UNAUTHORIZED, 'Access token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      return ResponseHandler(res, StatusCodes.UNAUTHORIZED, 'Invalid access token');
    }
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region Admin Auth Middleware (Access Token)
export const adminAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return ResponseHandler(res, StatusCodes.UNAUTHORIZED, responseMessage.TOKEN_REQUIRED);
    }

    const decodeToken = verifyToken(token, config.JWT_SECRET_KEY);
    if (!decodeToken || !decodeToken.id) {
      return ResponseHandler(res, StatusCodes.UNAUTHORIZED, responseMessage.INVALID_TOKEN);
    }

    const admin = await Admin.findOne({ _id: decodeToken.id, isDeleted: false });
    if (!admin) {
      return ResponseHandler(res, StatusCodes.NOT_FOUND, responseMessage.ADMIN_NOT_FOUND);
    }

    if (!admin.isActive) {
      return ResponseHandler(res, StatusCodes.UNAUTHORIZED, 'Admin account is disabled');
    }

    // ✅ IMPORTANT CHANGE
    req.admin_id = admin._id;
    req.school_id = admin.schoolId; // 🔥 ADD THIS
    req.admin = admin;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ResponseHandler(res, StatusCodes.UNAUTHORIZED, 'Access token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      return ResponseHandler(res, StatusCodes.UNAUTHORIZED, 'Invalid access token');
    }
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region Refresh Token Auth Middleware (Cookie)
export const refreshTokenAuth = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    
    if (!refreshToken) {
      return ResponseHandler(res, StatusCodes.UNAUTHORIZED, 'Refresh token required string');
    }

    const decodeToken = verifyToken(refreshToken, config.JWT_REFRESH_SECRET);
    if (!decodeToken || !decodeToken.id) {
      return ResponseHandler(res, StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
    }

    // Attach decoded data to request
    req.token_id = decodeToken.id;
    req.token_type = decodeToken.type; // e.g., 'admin', 'user', 'school'
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ResponseHandler(res, StatusCodes.UNAUTHORIZED, 'Refresh token has expired. Please log in again.');
    }
    logger.error('Refresh Token Error: ', error.message);
    return ResponseHandler(res, StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
  }
};
//#endregion
