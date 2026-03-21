import DeveloperAdmin from '../../models/developerAdmin/DeveloperAdmin.js';
import { responseMessage } from '../../utils/ResponseMessage.js';
import {
  ResponseHandler,
  CatchErrorHandler,
  encryptPassword,
  filterData,
} from '../../services/CommonServices.js';
import { StatusCodes } from 'http-status-codes';
import { sendRegisterVerificationEmail } from '../../services/EmailServices.js';
import Logger from '../../utils/Logger.js';
import RoleManagement from '../../models/schoolAdmin/RolePermission.js';
import {
  generateOtp,
  storeOtp,
  checkOtpRateLimit,
} from '../../services/OtpService.js';

const logger = new Logger(
  './src/controller/developerAdmin/DeveloperAdminController.js'
);

//#region ➕ Add / ✏️ Edit DeveloperAdmin Profile
export const addEditAdminProfile = async (req, res) => {
  try {
    const { id, name, email, password, role, address } = req.body;

    // DeveloperAdmin assigns schoolId explicitly
    const payload = { name, email, address };

    if (password) {
      payload.password = await encryptPassword(password);
    }
    if (role) {
      payload.role = role;
    }

    let result;
    if (id) {
      const existingAdmin = await DeveloperAdmin.findOne({
        _id: id,
        isDeleted: false,
      });
      if (!existingAdmin)
        return ResponseHandler(
          res,
          StatusCodes.NOT_FOUND,
          responseMessage.ADMIN_NOT_FOUND
        );

      const duplicateAdmin = await DeveloperAdmin.findOne({
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

      result = await DeveloperAdmin.findByIdAndUpdate(id, payload, {
        new: true,
      });
      return ResponseHandler(
        res,
        StatusCodes.OK,
        responseMessage.PROFILE_UPDATED,
        result
      );
    } else {
      // Create flow
      const duplicateAdmin = await DeveloperAdmin.findOne({
        email,
        isDeleted: false,
      });
      if (duplicateAdmin)
        return ResponseHandler(
          res,
          StatusCodes.CONFLICT,
          responseMessage.ADMIN_ALREADY_EXISTS
        );

      if (!password)
        return ResponseHandler(
          res,
          StatusCodes.BAD_REQUEST,
          responseMessage.PASSWORD_IS_REQUIRED_TO_CREATE_A_NEW_ADM
        );

      // Rate limit check
      const rateLimit = await checkOtpRateLimit('developer', email);
      if (rateLimit.limited)
        return ResponseHandler(
          res,
          StatusCodes.TOO_MANY_REQUESTS,
          rateLimit.message
        );

      // Create Unverified DeveloperAdmin
      payload.isVerified = false;
      result = await DeveloperAdmin.create(payload);

      // Send OTP
      const otp = generateOtp();
      await storeOtp('developer', email, otp);
      sendRegisterVerificationEmail(
        `Your DeveloperAdmin Register OTP is: ${otp}`,
        email,
        'DeveloperAdmin'
      ).catch((err) =>
        logger.error(`Error sending DeveloperAdmin Registration OTP: ${err}`)
      );

      return ResponseHandler(
        res,
        StatusCodes.CREATED,
        responseMessage.ADMIN_CREATED,
        { email }
      );
    }
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

    if (searchRequest) {
      const roles = await RoleManagement.find({
        role: { $regex: searchRequest, $options: 'i' },
        isDeleted: false,
      }).select('_id');

      query.$or = [
        { name: { $regex: searchRequest, $options: 'i' } },
        { email: { $regex: searchRequest, $options: 'i' } },
        { role: { $in: roles.map((r) => r._id) } },
      ];
    }

    const totalArrayLength = await DeveloperAdmin.countDocuments(query);
    const page = parseInt(pageNumber);
    const limit = parseInt(perPageData || totalArrayLength);
    const skip = (page - 1) * limit;

    const adminData = await DeveloperAdmin.find(query)
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

//#region 🗑️ Delete DeveloperAdmin (Soft Delete)
export const deleteAdmin = async (req, res) => {
  try {
    const admin = await DeveloperAdmin.findOneAndUpdate(
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

//#region ⚡ DeveloperAdmin Status Handler (Toggle Active)
export const adminStatusHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await DeveloperAdmin.findOne({ _id: id, isDeleted: false });

    if (!admin) {
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.ADMIN_NOT_FOUND
      );
    }

    const updatedAdmin = await DeveloperAdmin.findByIdAndUpdate(
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
