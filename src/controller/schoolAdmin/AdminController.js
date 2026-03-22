import SchoolAdmin from '../../models/schoolAdmin/SchoolAdmin.js';
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
import RoleManagement from '../../models/schoolAdmin/RolePermission.js';
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
import School from '../../models/school/School.js';

const { filterData } = await import('../../services/CommonServices.js');
const logger = new Logger('./src/controller/schoolAdmin/AdminController.js');

export const login = async (req, res) => {
  try {
    const { email, password, schoolCode } = req.body;
    const findSchool = await School.findOne({ schoolCode, isDeleted: false });
    if (!findSchool) {
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.SCHOOL_NOT_EXIST
      );
    }
    const admin = await SchoolAdmin.findOne({
      email,
      isDeleted: false,
      schoolId: findSchool._id,
    }).populate('role');
    if (!admin) {
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.ADMIN_NOT_EXIST
      );
    }

    if (!admin.isVerified) {
      return ResponseHandler(
        res,
        StatusCodes.UNAUTHORIZED,
        responseMessage.ACCOUNT_NOT_VERIFIED_PLEASE_VERIFY_OTP
      );
    }

    if (!admin.isActive) {
      return ResponseHandler(
        res,
        StatusCodes.UNAUTHORIZED,
        responseMessage.ACCOUNT_IS_DISABLED
      );
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.INVALID_CREDENTIALS
      );
    }

    if (admin.isSuperAdmin) {
      const rateLimit = await checkOtpRateLimit('admin_login', email);
      if (rateLimit.limited) {
        return ResponseHandler(
          res,
          StatusCodes.TOO_MANY_REQUESTS,
          rateLimit.message
        );
      }
      const otp = generateOtp();
      await storeOtp('admin_login', email, otp);
      await sendLoginVerificationEmail(otp, email, 'SuperAdmin');

      return ResponseHandler(
        res,
        StatusCodes.OK,
        'OTP sent to your email for verification.',
        { requireOtp: true, email: email }
      );
    }

    const payload = { id: admin._id, type: 'admin' };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    setRefreshTokenCookie(res, refreshToken);

    const adminData = admin.toObject();
    delete adminData.password;

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

export const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp, schoolCode } = req.body;

    const findSchool = await School.findOne({ schoolCode, isDeleted: false });
    if (!findSchool) {
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.SCHOOL_NOT_EXIST
      );
    }

    const admin = await SchoolAdmin.findOne({
      email,
      isDeleted: false,
      schoolId: findSchool._id,
    });

    if (!admin) {
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.ADMIN_NOT_FOUND
      );
    }

    const otpResult = await verifyOtp('admin_login', email, otp);
    if (!otpResult.success) {
      return ResponseHandler(res, StatusCodes.BAD_REQUEST, otpResult.message);
    }

    const payload = { id: admin._id, type: 'admin' };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    setRefreshTokenCookie(res, refreshToken);

    const adminData = admin.toObject();
    delete adminData.password;

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

export const refreshToken = async (req, res) => {
  try {
    const { token_id, token_type } = req;

    if (token_type !== 'admin') {
      return ResponseHandler(
        res,
        StatusCodes.FORBIDDEN,
        responseMessage.INVALID_TOKEN_TYPE
      );
    }

    const admin = await SchoolAdmin.findById(token_id);
    if (!admin || admin.isDeleted || !admin.isActive) {
      clearRefreshTokenCookie(res);
      return ResponseHandler(
        res,
        StatusCodes.UNAUTHORIZED,
        responseMessage.INVALID_OR_DISABLED_ACCOUNT
      );
    }

    const payload = { id: admin._id, type: 'admin' };
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

export const forgotPassword = async (req, res) => {
  try {
    const { email, schoolCode } = req.body;
    const findSchool = await School.findOne({ schoolCode, isDeleted: false });
    if (!findSchool) {
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.SCHOOL_NOT_EXIST
      );
    }

    const admin = await SchoolAdmin.findOne({
      email,
      isDeleted: false,
      schoolId: findSchool._id,
    });
    if (!admin) {
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.ADMIN_NOT_EXIST
      );
    }

    // Rate limit check
    const rateLimit = await checkOtpRateLimit('admin_forgot', email);
    if (rateLimit.limited) {
      return ResponseHandler(
        res,
        StatusCodes.TOO_MANY_REQUESTS,
        rateLimit.message
      );
    }

    // Generate & store OTP via Redis (same as admin creation flow)
    const otp = generateOtp();
    await storeOtp('admin_forgot', email, otp);

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

export const verifyForgotPasswordOtp = async (req, res) => {
  try {
    const { email, otp, schoolCode } = req.body;
    const findSchool = await School.findOne({ schoolCode, isDeleted: false });
    if (!findSchool) {
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.SCHOOL_NOT_EXIST
      );
    }
    const admin = await SchoolAdmin.findOne({
      email,
      isDeleted: false,
      schoolId: findSchool._id,
    });
    if (!admin) {
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.ADMIN_NOT_EXIST
      );
    }

    // Verify OTP via Redis (same service used across the app)
    const otpResult = await verifyOtp('admin_forgot', email, otp);
    if (!otpResult.success) {
      return ResponseHandler(res, StatusCodes.BAD_REQUEST, otpResult.message);
    }

    return ResponseHandler(res, StatusCodes.OK, responseMessage.OTP_VERIFIED);
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword, schoolCode } = req.body;
    const findSchool = await School.findOne({ schoolCode, isDeleted: false });
    if (!findSchool) {
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.SCHOOL_NOT_EXIST
      );
    }
    const admin = await SchoolAdmin.findOne({
      email,
      isDeleted: false,
      schoolId: findSchool._id,
    });
    if (!admin) {
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.ADMIN_NOT_EXIST
      );
    }

    if (newPassword !== confirmPassword) {
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.PASSWORD_NOT_MATCH
      );
    }

    admin.password = await encryptPassword(newPassword);
    await admin.save();

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

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const admin = await SchoolAdmin.findOne({
      _id: req.admin_id,
      isDeleted: false,
      schoolId: req.school_id,
    });
    if (!admin) {
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.ADMIN_NOT_EXIST
      );
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, admin.password);
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
    } else {
      admin.password = await encryptPassword(newPassword);
      await admin.save();
      return ResponseHandler(
        res,
        StatusCodes.OK,
        responseMessage.PASSWORD_CHANGE_SUCCESSFULLY
      );
    }
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};

export const profile = async (req, res) => {
  try {
    const admin = await SchoolAdmin.findOne({
      _id: req.admin_id,
      isDeleted: false,
    })
      .populate('role')
      .populate({
        path: 'schoolId',
        select: '-referralId -__v',
      });

    if (!admin) {
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.ADMIN_NOT_FOUND
      );
    }

    const responseData = {
      admin: filterData(admin),
      role: admin.role,
      schoolData: admin.schoolId,
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

export const updateProfile = async (req, res) => {
  try {
    const { name, email, phoneNumber } = req.body;
    const update = await SchoolAdmin.findOneAndUpdate(
      { _id: req.admin_id },
      {
        name,
        email,
        phoneNumber,
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

//#region ➕ Add / ✏️ Edit SchoolAdmin Profile
export const addEditAdminProfile = async (req, res) => {
  try {
    const { id, name, email, password, role, schoolId, address } = req.body;

    // Multi-tenant: If creator is a tenant admin, lock new admin to same school
    const assignedSchoolId = req.admin?.schoolId || schoolId;

    const payload = { name, email, schoolId: assignedSchoolId, address };

    if (password) {
      payload.password = await encryptPassword(password);
    }
    if (role) {
      payload.role = role;
    }

    let result;
    if (id) {
      const existingAdmin = await SchoolAdmin.findOne({
        _id: id,
        isDeleted: false,
      });
      if (!existingAdmin)
        return ResponseHandler(
          res,
          StatusCodes.NOT_FOUND,
          responseMessage.ADMIN_NOT_FOUND
        );

      const duplicateAdmin = await SchoolAdmin.findOne({
        _id: { $ne: id },
        $or: [{ email }],
        isDeleted: false,
      });
      if (duplicateAdmin)
        return ResponseHandler(
          res,
          StatusCodes.CONFLICT,
          responseMessage.ADMIN_ALREADY_EXISTS
        );

      result = await SchoolAdmin.findByIdAndUpdate(id, payload, { new: true });
      return ResponseHandler(
        res,
        StatusCodes.OK,
        responseMessage.PROFILE_UPDATED,
        result
      );
    } else {
      // Create flow
      const duplicateAdmin = await SchoolAdmin.findOne({
        email,
        schoolId: req.school_id,
        isDeleted: false,
      });
      if (duplicateAdmin)
        return ResponseHandler(
          res,
          StatusCodes.CONFLICT,
          responseMessage.ADMIN_ALREADY_EXISTS
        );

      // Require password for new admins
      if (!password)
        return ResponseHandler(
          res,
          StatusCodes.BAD_REQUEST,
          responseMessage.PASSWORD_IS_REQUIRED_TO_CREATE_A_NEW_ADM
        );

      // Rate limit check
      const rateLimit = await checkOtpRateLimit('admin', email);
      if (rateLimit.limited)
        return ResponseHandler(
          res,
          StatusCodes.TOO_MANY_REQUESTS,
          rateLimit.message
        );

      // Create Unverified SchoolAdmin
      payload.isVerified = false;
      result = await SchoolAdmin.create(payload);

      // Send OTP
      const otp = generateOtp();
      await storeOtp('admin', email, otp);
      sendRegisterVerificationEmail(
        `Your SchoolAdmin Register OTP is: ${otp}`,
        email,
        'SchoolAdmin',
        "Register"
      ).catch((err) => {
        logger.error(`Error sending SchoolAdmin Registration OTP: ${err}`);
      });

      return ResponseHandler(
        res,
        StatusCodes.CREATED,
        responseMessage.ADMIN_CREATED_OTP_SENT_TO_EMAIL_FOR_VERI,
        { adminId: result._id, email }
      );
    }
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region Verify SchoolAdmin Registration OTP
export const verifyAdminRegistrationOtp = async (req, res) => {
  try {
    const { email, otp, school_id } = req.body;
    const admin = await SchoolAdmin.findOne({
      email,
      isDeleted: false,
      schoolId: school_id,
    });
    if (!admin)
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.ADMIN_NOT_FOUND
      );
    if (admin.isVerified)
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.ADMIN_ALREADY_VERIFIED
      );

    const otpResult = await verifyOtp('admin', email, otp);
    if (!otpResult.success) {
      if (otpResult.maxAttemptsReached && !admin.isVerified) {
        await SchoolAdmin.deleteOne({ _id: admin._id });
        return ResponseHandler(
          res,
          StatusCodes.BAD_REQUEST,
          responseMessage.TOO_MANY_OTP_ATTEMPTS_REGISTRATION_CANCE
        );
      }
      return ResponseHandler(res, StatusCodes.BAD_REQUEST, otpResult.message);
    }

    admin.isVerified = true;
    admin.isActive = true;
    await admin.save();

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

//#region 🔁 Resend Registration OTP
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const admin = await SchoolAdmin.findOne({
      email,
      isDeleted: false,
      schoolId: req.school_id,
    });
    if (!admin)
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.ADMIN_NOT_FOUND
      );
    if (admin.isVerified)
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.ADMIN_IS_ALREADY_VERIFIED_NO_OTP_NEEDED
      );

    // Rate limit check before sending a new OTP
    const rateLimit = await checkOtpRateLimit('admin', email);
    if (rateLimit.limited)
      return ResponseHandler(
        res,
        StatusCodes.TOO_MANY_REQUESTS,
        rateLimit.message
      );

    const otp = generateOtp();
    await storeOtp('admin', email, otp);
    sendRegisterVerificationEmail(
      `Your SchoolAdmin Register OTP is: ${otp}`,
      email,
      'SchoolAdmin'
    ).catch((err) =>
      logger.error(`Error re-sending SchoolAdmin Registration OTP: ${err}`)
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

//#region 🔁 Resend Forgot Password OTP
export const resendForgotPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const admin = await SchoolAdmin.findOne({
      email,
      isDeleted: false,
      schoolId: req.school_id,
    });
    if (!admin)
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.ADMIN_NOT_FOUND
      );

    // Rate limit check
    const rateLimit = await checkOtpRateLimit('admin_forgot', email);
    if (rateLimit.limited)
      return ResponseHandler(
        res,
        StatusCodes.TOO_MANY_REQUESTS,
        rateLimit.message
      );

    // Generate & store fresh OTP in Redis (forgot namespace)
    const otp = generateOtp();
    await storeOtp('admin_forgot', email, otp);

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

//#region 📄 Get All Admins
export const getAllAdmins = async (req, res) => {
  try {
    const { pageNumber = 1, perPageData, searchRequest } = req.query;
    const query = { isDeleted: false };

    // Multi-tenant Isolation: Filter by school if the requesting admin belongs to one
    if (req.admin?.schoolId) {
      query.schoolId = req.admin.schoolId;
    }

    if (searchRequest) {
      const roles = await RoleManagement.find({
        role: { $regex: searchRequest, $options: 'i' },
        isDeleted: false,
      }).select('_id');

      // Search in name, email, or matching role IDs
      query.$or = [
        { name: { $regex: searchRequest, $options: 'i' } },
        { email: { $regex: searchRequest, $options: 'i' } },
        { role: { $in: roles.map((r) => r._id) } },
      ];
    }

    // Pagination setup
    const totalArrayLength = await SchoolAdmin.countDocuments(query);
    const page = parseInt(pageNumber);
    const limit = parseInt(perPageData || totalArrayLength);
    const skip = (page - 1) * limit;

    // Fetch admins with populate
    const adminData = await SchoolAdmin.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('role');

    const data = adminData.map((admin) => filterData(admin));
    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.ADMIN_FETCH_SUCCESS,
      {
        totalArrayLength,
        pageNumber: page,
        perPageData: limit,
        data,
      }
    );
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region 🗑️ Delete SchoolAdmin (Soft Delete)
export const deleteAdmin = async (req, res) => {
  try {
    const admin = await SchoolAdmin.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!admin) {
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.ADMIN_NOT_FOUND
      );
    }

    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.ADMIN_DELETE_SUCCESS,
      null
    );
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region ⚡ SchoolAdmin Status Handler (Toggle Active)
export const adminStatusHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await SchoolAdmin.findOne({ _id: id, isDeleted: false });

    if (!admin) {
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.ADMIN_NOT_FOUND
      );
    }

    const updatedAdmin = await SchoolAdmin.findByIdAndUpdate(
      id,
      { isActive: !admin.isActive },
      { new: true }
    );

    const data = filterData(updatedAdmin);
    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.ADMIN_STATUS_UPDATED,
      data
    );
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion
