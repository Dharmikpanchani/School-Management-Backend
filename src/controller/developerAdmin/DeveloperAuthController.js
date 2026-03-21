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
  sendLoginVerificationEmail,
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

const { filterData } = await import('../../services/CommonServices.js');
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
      await sendLoginVerificationEmail(otp, email, 'SuperDeveloper');

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

//#region Verify Login OTP
export const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
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

    const otpResult = await verifyOtp('developer_login', email, otp);
    if (!otpResult.success) {
      return ResponseHandler(res, StatusCodes.BAD_REQUEST, otpResult.message);
    }

    const payload = { id: developer._id, type: 'developer' };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    setRefreshTokenCookie(res, refreshToken);

    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.ADMIN_LOGIN_SUCCESSFULLY,
      { accessToken }
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

//#region Logout
export const logout = async (req, res) => {
  try {
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

    const otp = generateOtp();
    await storeOtp('developer_forgot', email, otp);
    await forgotPasswordOtpMail(email, otp);

    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.OTP_SENT_SUCCESSFULLY,
      null
    );
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region Verify Forgot Password OTP
export const verifyForgotPasswordOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const developer = await DeveloperAdmin.findOne({ email, isDeleted: false });
    if (!developer) {
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.DEVELOPER_NOT_FOUND
      );
    }

    const otpResult = await verifyOtp('developer_forgot', email, otp);
    if (!otpResult.success) {
      return ResponseHandler(res, StatusCodes.BAD_REQUEST, otpResult.message);
    }

    return ResponseHandler(res, StatusCodes.OK, responseMessage.OTP_VERIFIED);
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
    }).populate('role');

    if (!developer) {
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.DEVELOPER_NOT_FOUND
      );
    }

    const responseData = {
      developer: filterData(developer),
      role: developer.role,
    };

    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.PROFILE_FETCHED,
      responseData
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
    const { name, email, phoneNumber, address } = req.body;
    const update = await DeveloperAdmin.findOneAndUpdate(
      { _id: req.developer_id },
      {
        name,
        email,
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

//#region Verify DeveloperAdmin Registration OTP
export const verifyDeveloperRegistrationOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const developer = await DeveloperAdmin.findOne({ email, isDeleted: false });
    if (!developer)
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.DEVELOPER_NOT_FOUND
      );
    if (developer.isVerified)
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.ADMIN_ALREADY_VERIFIED
      );

    const otpResult = await verifyOtp('developer', email, otp);
    if (!otpResult.success) {
      if (otpResult.maxAttemptsReached && !developer.isVerified) {
        await DeveloperAdmin.deleteOne({ _id: developer._id });
        return ResponseHandler(
          res,
          StatusCodes.BAD_REQUEST,
          responseMessage.TOO_MANY_OTP_ATTEMPTS_REGISTRATION_CANCE
        );
      }
      return ResponseHandler(res, StatusCodes.BAD_REQUEST, otpResult.message);
    }

    developer.isVerified = true;
    developer.isActive = true;
    await developer.save();

    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.ADMIN_VERIFIED_SUCCESSFULLY_YOU_CAN_NOW_
    );
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region Resend Registration OTP
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const developer = await DeveloperAdmin.findOne({ email, isDeleted: false });
    if (!developer)
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.DEVELOPER_NOT_FOUND
      );
    if (developer.isVerified)
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.ADMIN_IS_ALREADY_VERIFIED_NO_OTP_NEEDED
      );

    const rateLimit = await checkOtpRateLimit('developer', email);
    if (rateLimit.limited)
      return ResponseHandler(
        res,
        StatusCodes.TOO_MANY_REQUESTS,
        rateLimit.message
      );

    const otp = generateOtp();
    await storeOtp('developer', email, otp);
    sendRegisterVerificationEmail(
      `Your DeveloperAdmin Register OTP is: ${otp}`,
      email,
      'DeveloperAdmin'
    ).catch((err) =>
      logger.error(`Error re-sending DeveloperAdmin Registration OTP: ${err}`)
    );

    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.OTP_SENT_SUCCESSFULLY,
      null
    );
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region Resend Forgot Password OTP
export const resendForgotPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const developer = await DeveloperAdmin.findOne({ email, isDeleted: false });
    if (!developer)
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.DEVELOPER_NOT_FOUND
      );

    const rateLimit = await checkOtpRateLimit('developer_forgot', email);
    if (rateLimit.limited)
      return ResponseHandler(
        res,
        StatusCodes.TOO_MANY_REQUESTS,
        rateLimit.message
      );

    const otp = generateOtp();
    await storeOtp('developer_forgot', email, otp);
    await forgotPasswordOtpMail(email, otp);

    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.OTP_SENT_SUCCESSFULLY,
      null
    );
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion
