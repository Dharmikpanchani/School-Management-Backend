import DeveloperAdmin from '../../models/developerAdmin/DeveloperAdmin.js';
import { responseMessage } from '../../utils/ResponseMessage.js';
import {
  ResponseHandler,
  CatchErrorHandler,
  encryptPassword,
} from '../../services/CommonServices.js';
import bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import {
  forgotPasswordOtpMail,
  sendRegisterVerificationEmail,
} from '../../services/EmailServices.js';
import Logger from '../../utils/Logger.js';
import {
  generateOtp,
  storeOtp,
  verifyOtp,
  checkOtpRateLimit,
} from '../../services/OtpService.js';
import {
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from '../../services/TokenService.js';

const logger = new Logger(
  './src/controller/developerAdmin/DeveloperAuthController.js'
);

//#region Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Developers do not have a schoolCode restriction
    const developer = await DeveloperAdmin.findOne({
      email,
      isDeleted: false,
    }).populate('role');

    if (!developer) {
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.DEVELOPER_NOT_FOUND
      );
    }
    if (!developer.isVerified) {
      return ResponseHandler(
        res,
        StatusCodes.UNAUTHORIZED,
        responseMessage.ACCOUNT_NOT_VERIFIED_PLEASE_VERIFY_OTP
      );
    }
    if (!developer.isActive) {
      return ResponseHandler(
        res,
        StatusCodes.UNAUTHORIZED,
        responseMessage.ACCOUNT_IS_DISABLED
      );
    }

    const isPasswordValid = await bcrypt.compare(password, developer.password);
    if (!isPasswordValid) {
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.INVALID_CREDENTIALS
      );
    }

    if (developer.isSuperDeveloper) {
      const rateLimit = await checkOtpRateLimit('developer_login', email);
      if (rateLimit.limited) {
        return ResponseHandler(
          res,
          StatusCodes.TOO_MANY_REQUESTS,
          rateLimit.message
        );
      }
      const otp = generateOtp();
      await storeOtp('developer_login', email, otp);
      await sendRegisterVerificationEmail(
        otp,
        email,
        'SuperDeveloper',
        'Login'
      );

      return ResponseHandler(
        res,
        StatusCodes.OK,
        'OTP sent to your email for verification.',
        { requireOtp: true, email: email }
      );
    }

    const payload = { id: developer._id, type: 'developer' };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    setRefreshTokenCookie(res, refreshToken);

    developer.isLogin = true;
    await developer.save();

    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.ADMIN_LOGIN_SUCCESSFULLY,
      {
        accessToken,
      }
    );
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region Refresh Token
export const refreshToken = async (req, res) => {
  try {
    const { token_id, token_type } = req;

    // Strict typing
    if (token_type !== 'developer') {
      return ResponseHandler(
        res,
        StatusCodes.FORBIDDEN,
        responseMessage.INVALID_TOKEN_TYPE
      );
    }

    const developer = await DeveloperAdmin.findById(token_id);
    if (!developer || developer.isDeleted || !developer.isActive) {
      clearRefreshTokenCookie(res);
      return ResponseHandler(
        res,
        StatusCodes.UNAUTHORIZED,
        responseMessage.INVALID_OR_DISABLED_ACCOUNT
      );
    }

    const payload = { id: developer._id, type: 'developer' };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    setRefreshTokenCookie(res, newRefreshToken);

    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.TOKEN_REFRESHED_SUCCESSFULLY,
      {
        accessToken: newAccessToken,
      }
    );
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region Common Send OTP (login | registration | forgot)
export const sendOtp = async (req, res) => {
  try {
    const { email, type } = req.body;

    // Map route type → OTP namespace key
    const otpKeyMap = {
      login: 'developer_login',
      registration: 'developer',
      forgot: 'developer_forgot',
    };
    const otpKey = otpKeyMap[type];
    if (!otpKey) {
      return ResponseHandler(res, StatusCodes.BAD_REQUEST, 'Invalid OTP type.');
    }

    const developer = await DeveloperAdmin.findOne({ email, isDeleted: false });
    if (!developer) {
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.DEVELOPER_NOT_FOUND
      );
    }

    // Login OTP only for SuperDeveloper
    if (type === 'login' && !developer.isSuperDeveloper) {
      return ResponseHandler(
        res,
        StatusCodes.FORBIDDEN,
        'Only SuperDevelopers require login OTP.'
      );
    }

    // Registration check
    if (type === 'registration' && developer.isVerified) {
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.ADMIN_ALREADY_VERIFIED
      );
    }

    // Rate limit
    const rateLimit = await checkOtpRateLimit(otpKey, email);
    if (rateLimit.limited) {
      return ResponseHandler(
        res,
        StatusCodes.TOO_MANY_REQUESTS,
        rateLimit.message
      );
    }

    const otp = generateOtp();
    await storeOtp(otpKey, email, otp);

    // Send email based on type
    if (type === 'login') {
      await sendRegisterVerificationEmail(
        otp,
        email,
        'SuperDeveloper',
        'Login'
      );
    } else if (type === 'registration') {
      await sendRegisterVerificationEmail(
        otp,
        email,
        'DeveloperAdmin',
        'Registration'
      );
    } else if (type === 'forgot') {
      await forgotPasswordOtpMail(email, otp);
    }

    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.OTP_SENT_SUCCESSFULLY
    );
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region Common Verify OTP (login | registration | forgot)
export const verifyOtpCommon = async (req, res) => {
  try {
    const { email, otp, type } = req.body;

    // Map route type → OTP namespace key (must match sendOtp)
    const otpKeyMap = {
      login: 'developer_login',
      registration: 'developer',
      forgot: 'developer_forgot',
    };
    const otpKey = otpKeyMap[type];
    if (!otpKey) {
      return ResponseHandler(res, StatusCodes.BAD_REQUEST, 'Invalid OTP type.');
    }

    const developer = await DeveloperAdmin.findOne({
      email,
      isDeleted: false,
    }).populate('role');
    if (!developer) {
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.DEVELOPER_NOT_FOUND
      );
    }

    const otpResult = await verifyOtp(otpKey, email, otp);
    if (!otpResult.success) {
      if (
        otpResult.maxAttemptsReached &&
        type === 'registration' &&
        !developer.isVerified
      ) {
        await DeveloperAdmin.deleteOne({ _id: developer._id });
        return ResponseHandler(
          res,
          StatusCodes.BAD_REQUEST,
          responseMessage.TOO_MANY_OTP_ATTEMPTS_REGISTRATION_CANCE
        );
      }
      return ResponseHandler(res, StatusCodes.BAD_REQUEST, otpResult.message);
    }

    // LOGIN OTP
    if (type === 'login') {
      const payload = { id: developer._id, type: 'developer' };
      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      setRefreshTokenCookie(res, refreshToken);

      developer.isLogin = true;
      await developer.save();

      return ResponseHandler(
        res,
        StatusCodes.OK,
        responseMessage.ADMIN_LOGIN_SUCCESSFULLY,
        { accessToken }
      );
    }

    // REGISTRATION OTP
    if (type === 'registration') {
      developer.isVerified = true;
      developer.isActive = true;
      await developer.save();

      return ResponseHandler(
        res,
        StatusCodes.OK,
        responseMessage.ADMIN_VERIFIED_SUCCESSFULLY_YOU_CAN_NOW_
      );
    }

    // FORGOT PASSWORD OTP
    if (type === 'forgot') {
      return ResponseHandler(res, StatusCodes.OK, responseMessage.OTP_VERIFIED);
    }
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region Logout
export const logout = async (req, res) => {
  try {
    const { token_id } = req;
    await DeveloperAdmin.findByIdAndUpdate(
      { _id: token_id },
      { isLogin: false }
    );

    clearRefreshTokenCookie(res);
    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.LOGGED_OUT_SUCCESSFULLY
    );
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region Forgot Password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const developer = await DeveloperAdmin.findOne({ email, isDeleted: false });
    if (!developer) {
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.DEVELOPER_NOT_FOUND
      );
    }

    const rateLimit = await checkOtpRateLimit('developer_forgot', email);
    if (rateLimit.limited) {
      return ResponseHandler(
        res,
        StatusCodes.TOO_MANY_REQUESTS,
        rateLimit.message
      );
    }

    const otp = await generateOtp();
    await storeOtp('developer_forgot', email, otp);
    await forgotPasswordOtpMail(email, otp);

    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.OTP_SENT_SUCCESSFULLY
    );
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    const developer = await DeveloperAdmin.findOne({ email, isDeleted: false });
    if (!developer) {
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.DEVELOPER_NOT_FOUND
      );
    }

    if (newPassword !== confirmPassword) {
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.PASSWORD_NOT_MATCH
      );
    }

    developer.password = await encryptPassword(newPassword);
    await developer.save();

    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.PASSWORD_RESET_SUCCESSFULLY
    );
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region Change Password
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    const developer = await DeveloperAdmin.findOne({
      _id: req.developer_id,
      isDeleted: false,
    });
    if (!developer) {
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.DEVELOPER_NOT_FOUND
      );
    }

    const isPasswordValid = await bcrypt.compare(
      oldPassword,
      developer.password
    );
    if (!isPasswordValid) {
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.INVALID_OLD_PASSWORD
      );
    }
    if (oldPassword === newPassword) {
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.PASSWORD_ARE_SAME
      );
    }
    if (newPassword !== confirmPassword) {
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.PASSWORD_NOT_MATCH
      );
    }

    developer.password = await encryptPassword(newPassword);
    await developer.save();

    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.PASSWORD_CHANGE_SUCCESSFULLY
    );
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region Get Profile
export const profile = async (req, res) => {
  try {
    const developer = await DeveloperAdmin.findOne({
      _id: req.developer_id,
      isDeleted: false,
    })
      .select('-isDeleted -__v')
      .populate({
        path: 'role',
        select: 'role permissions',
      });

    if (!developer) {
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.DEVELOPER_NOT_FOUND
      );
    }

    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.PROFILE_FETCHED,
      developer
    );
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region Update Profile
export const updateProfile = async (req, res) => {
  try {
    const { name, phoneNumber, address } = req.body;
    const update = await DeveloperAdmin.findOneAndUpdate(
      { _id: req.developer_id },
      {
        name,
        phoneNumber,
        address,
        [req.imageUrl ? 'image' : '']: req.imageUrl,
      },
      { new: true }
    );
    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.PROFILE_UPDATED,
      update
    );
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion
