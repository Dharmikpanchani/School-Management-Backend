import { StatusCodes } from 'http-status-codes';
import User from '../../models/user/User.js';
import { encryptPassword } from '../../services/CommonServices.js';
import {
  CatchErrorHandler,
  ResponseHandler,
} from '../../services/CommonServices.js';
import { responseMessage } from '../../utils/ResponseMessage.js';
import Logger from '../../utils/Logger.js';
import {
  generateOtp,
  storeOtp,
  verifyOtp,
  checkOtpRateLimit,
} from '../../services/OtpService.js';
import { sendSubscriptionBaseMail } from '../../services/EmailServices.js';

const logger = new Logger('./src/controller/schoolAdmin/UserController.js');

//#region Create User (by Admin)
export const createUser = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      password,
      address,
      gender,
      schoolId,
      schoolName,
      schoolEmail,
    } = req.body;

    // Multi-tenant: If creator is a tenant admin, lock user to same school
    const assignedSchoolId = req.admin?.schoolId || schoolId;

    const existingUser = await User.findOne({
      email,
      isDeleted: false,
      schoolId: assignedSchoolId,
    });
    if (existingUser) {
      return ResponseHandler(
        res,
        StatusCodes.CONFLICT,
        responseMessage.USER_WITH_THIS_EMAIL_ALREADY_EXISTS
      );
    }

    const rateLimit = await checkOtpRateLimit('user_admin_creation', email);
    if (rateLimit.limited) {
      return ResponseHandler(
        res,
        StatusCodes.TOO_MANY_REQUESTS,
        rateLimit.message
      );
    }

    const hashedPassword = await encryptPassword(password);

    const newUser = await User.create({
      fullName,
      email,
      phoneNumber,
      password: hashedPassword,
      address,
      gender,
      schoolId: assignedSchoolId,
      schoolName,
      schoolEmail,
      isVerify: false,
      isActive: false,
    });

    const otp = generateOtp();
    await storeOtp('user', email, otp);

    // Send email logic
    sendSubscriptionBaseMail(
      `Your User Account Registration OTP is: ${otp}. Please verify to activate your account.`,
      [email]
    ).catch((err) =>
      logger.error(`Error sending User Registration OTP: ${err}`)
    );

    return ResponseHandler(
      res,
      StatusCodes.CREATED,
      responseMessage.USER_CREATED_SUCCESSFULLY_OTP_SENT_FOR_V,
      {
        userId: newUser._id,
        email: newUser.email,
      }
    );
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region Verify User OTP (Admin-side verification if needed)
export const verifyUserOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email, isDeleted: false });
    if (!user)
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.USER_NOT_FOUND
      );
    if (user.isVerify)
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.USER_ALREADY_VERIFIED
      );

    // Admin can only verify users in their school
    if (
      req.admin?.schoolId &&
      req.admin.schoolId.toString() !== user.schoolId?.toString()
    ) {
      return ResponseHandler(
        res,
        StatusCodes.FORBIDDEN,
        responseMessage.ACCESS_DENIED_FOR_THIS_USER
      );
    }

    const otpResult = await verifyOtp('user', email, otp);
    if (!otpResult.success)
      return ResponseHandler(res, StatusCodes.BAD_REQUEST, otpResult.message);

    user.isVerify = true;
    user.isActive = true;
    await user.save();

    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.USER_VERIFIED_AND_ACTIVATED_SUCCESSFULLY
    );
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region Get All Users (Paginated & Multi-tenant isolated)
export const getAllUser = async (req, res) => {
  try {
    const { pageNumber = 1, perPageData, searchRequest } = req.query;

    const query = { isDeleted: false };

    // Multi-tenant Isolation
    if (req.admin?.schoolId) {
      query.schoolId = req.admin.schoolId;
    }

    if (searchRequest) {
      query.$or = [
        { fullName: { $regex: searchRequest, $options: 'i' } },
        { email: { $regex: searchRequest, $options: 'i' } },
      ];
    }

    const totalArrayLength = await User.countDocuments(query);
    const page = parseInt(pageNumber);
    const limit = parseInt(perPageData || totalArrayLength);
    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select('-password -otp -otpExpireAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.USER_FETCH_SUCCESS,
      {
        totalArrayLength,
        pageNumber: page,
        perPageData: limit,
        data: users,
      }
    );
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region Update User
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, phoneNumber, address, gender } = req.body;

    const query = { _id: id, isDeleted: false };
    if (req.admin?.schoolId) {
      query.schoolId = req.admin.schoolId;
    }

    const user = await User.findOne(query);
    if (!user)
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.USER_NOT_FOUND
      );

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { fullName, phoneNumber, address, gender },
      { new: true }
    ).select('-password');

    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.USER_UPDATED_SUCCESSFULLY,
      updatedUser
    );
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region Delete User
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const query = { _id: id, isDeleted: false };
    if (req.admin?.schoolId) {
      query.schoolId = req.admin.schoolId;
    }

    const user = await User.findOneAndUpdate(
      query,
      { isDeleted: true },
      { new: true }
    );

    if (!user) {
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.USER_NOT_FOUND
      );
    }

    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.USER_DELETE_SUCCESS,
      null
    );
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region User Action Status
export const userActionStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const query = { _id: id, isDeleted: false };
    if (req.admin?.schoolId) {
      query.schoolId = req.admin.schoolId;
    }

    const user = await User.findOne(query);
    if (!user) {
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.USER_NOT_FOUND
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { isActive: !user.isActive },
      { new: true }
    ).select('-password');

    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.USER_STATUS_UPDATED,
      updatedUser
    );
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion
