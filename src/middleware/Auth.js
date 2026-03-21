import { StatusCodes } from 'http-status-codes';
import { responseMessage } from '../utils/ResponseMessage.js';
import Logger from '../utils/Logger.js';
import User from '../models/user/User.js';
import SchoolAdmin from '../models/schoolAdmin/SchoolAdmin.js';
import DeveloperAdmin from '../models/developerAdmin/DeveloperAdmin.js';
import { verifyToken } from '../services/TokenService.js';
import {
  CatchErrorHandler,
  ResponseHandler,
} from '../services/CommonServices.js';
import config from '../config/Index.js';

const logger = new Logger('src/middleware/Auth.js');

//#region Extract Token Helper
const extractToken = (req) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
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
      return ResponseHandler(
        res,
        StatusCodes.UNAUTHORIZED,
        responseMessage.TOKEN_REQUIRED
      );
    }

    const decodeToken = verifyToken(token, config.JWT_SECRET_KEY);
    if (!decodeToken || !decodeToken.id) {
      return ResponseHandler(
        res,
        StatusCodes.UNAUTHORIZED,
        responseMessage.INVALID_TOKEN
      );
    }

    const user = await User.findById(decodeToken.id);
    if (!user) {
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.USER_NOT_FOUND
      );
    }
    if (user.isDeleted) {
      return ResponseHandler(
        res,
        StatusCodes.UNAUTHORIZED,
        responseMessage.USER_ACCOUNT_DELETED || 'User account is deleted'
      );
    }
    if (!user.isActive) {
      return ResponseHandler(
        res,
        StatusCodes.UNAUTHORIZED,
        responseMessage.USER_NOT_ACTIVE
      );
    }

    req.user_id = user._id;
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ResponseHandler(
        res,
        StatusCodes.UNAUTHORIZED,
        responseMessage.ACCESS_TOKEN_HAS_EXPIRED
      );
    }
    if (error.name === 'JsonWebTokenError') {
      return ResponseHandler(
        res,
        StatusCodes.UNAUTHORIZED,
        responseMessage.INVALID_ACCESS_TOKEN
      );
    }
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region SchoolAdmin Auth Middleware (Access Token)
export const adminAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return ResponseHandler(
        res,
        StatusCodes.UNAUTHORIZED,
        responseMessage.TOKEN_REQUIRED
      );
    }

    const decodeToken = verifyToken(token, config.JWT_SECRET_KEY);
    if (!decodeToken || !decodeToken.id) {
      return ResponseHandler(
        res,
        StatusCodes.UNAUTHORIZED,
        responseMessage.INVALID_TOKEN
      );
    }

    const admin = await SchoolAdmin.findOne({
      _id: decodeToken.id,
      isDeleted: false,
    });
    if (!admin) {
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.ADMIN_NOT_FOUND
      );
    }

    if (!admin.isActive) {
      return ResponseHandler(
        res,
        StatusCodes.UNAUTHORIZED,
        responseMessage.ADMIN_ACCOUNT_IS_DISABLED
      );
    }

    // ✅ IMPORTANT CHANGE
    req.admin_id = admin._id;
    req.school_id = admin.schoolId; // 🔥 ADD THIS
    req.admin = admin;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ResponseHandler(
        res,
        StatusCodes.UNAUTHORIZED,
        responseMessage.ACCESS_TOKEN_HAS_EXPIRED
      );
    }
    if (error.name === 'JsonWebTokenError') {
      return ResponseHandler(
        res,
        StatusCodes.UNAUTHORIZED,
        responseMessage.INVALID_ACCESS_TOKEN
      );
    }
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region DeveloperAdmin Auth Middleware (Access Token)
export const developerAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return ResponseHandler(
        res,
        StatusCodes.UNAUTHORIZED,
        responseMessage.TOKEN_REQUIRED
      );
    }

    const decodeToken = verifyToken(token, config.JWT_SECRET_KEY);
    if (!decodeToken || !decodeToken.id) {
      return ResponseHandler(
        res,
        StatusCodes.UNAUTHORIZED,
        responseMessage.INVALID_TOKEN
      );
    }

    // Dynamic import to avoid circular dependency if any, though regular import is better.
    // We already have standard imports at the top. We will just use the model.
    const developer = await DeveloperAdmin.findOne({
      _id: decodeToken.id,
      isDeleted: false,
    });
    if (!developer) {
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.DEVELOPER_NOT_FOUND
      );
    }

    if (!developer.isActive) {
      return ResponseHandler(
        res,
        StatusCodes.UNAUTHORIZED,
        responseMessage.DEVELOPER_ACCOUNT_IS_DISABLED
      );
    }

    req.developer_id = developer._id;
    req.developer = developer;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ResponseHandler(
        res,
        StatusCodes.UNAUTHORIZED,
        responseMessage.ACCESS_TOKEN_HAS_EXPIRED
      );
    }
    if (error.name === 'JsonWebTokenError') {
      return ResponseHandler(
        res,
        StatusCodes.UNAUTHORIZED,
        responseMessage.INVALID_ACCESS_TOKEN
      );
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
      return ResponseHandler(
        res,
        StatusCodes.UNAUTHORIZED,
        responseMessage.REFRESH_TOKEN_REQUIRED_STRING
      );
    }

    const decodeToken = verifyToken(refreshToken, config.JWT_REFRESH_SECRET);
    if (!decodeToken || !decodeToken.id) {
      return ResponseHandler(
        res,
        StatusCodes.UNAUTHORIZED,
        responseMessage.INVALID_REFRESH_TOKEN
      );
    }

    // Attach decoded data to request
    req.token_id = decodeToken.id;
    req.token_type = decodeToken.type; // e.g., 'admin', 'user', 'school'
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ResponseHandler(
        res,
        StatusCodes.UNAUTHORIZED,
        responseMessage.REFRESH_TOKEN_HAS_EXPIRED_PLEASE_LOG_IN_
      );
    }
    logger.error('Refresh Token Error: ', error.message);
    return ResponseHandler(
      res,
      StatusCodes.UNAUTHORIZED,
      responseMessage.INVALID_REFRESH_TOKEN
    );
  }
};
//#endregion
