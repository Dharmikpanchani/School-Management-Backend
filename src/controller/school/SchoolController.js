import { StatusCodes } from 'http-status-codes';
import School from '../../models/school/School.js';
import {
  CatchErrorHandler,
  ResponseHandler,
  encryptPassword,
} from '../../services/CommonServices.js';
import Logger from '../../utils/Logger.js';
import {
  generateOtp,
  storeOtp,
  checkOtpRateLimit,
} from '../../services/OtpService.js';
import { sendRegisterVerificationEmail } from '../../services/EmailServices.js'; // Can be reused for OTP or make a specific one
import SchoolAdmin from '../../models/schoolAdmin/SchoolAdmin.js';
import { responseMessage } from '../../utils/ResponseMessage.js';

const logger = new Logger('./src/controller/school/SchoolController.js');

//#region school Registration (with optional Referral)
export const schoolRegister = async (req, res) => {
  try {
    const {
      schoolName,
      ownerName,
      email,
      phoneNumber,
      password,
      schoolCode,
      address,
      city,
      state,
      zipCode,
      country,
      board,
      schoolType,
    } = req.body;

    // 1. Check if school exists
    const existingSchool = await School.findOne({
      $or: [{ email }, { phoneNumber }, { schoolCode }],
    });

    if (existingSchool) {
      return ResponseHandler(
        res,
        StatusCodes.CONFLICT,
        responseMessage.SCHOOL_ALREADY_EXISTS
      );
    }

    // 3. Hash Passwords
    const schoolPassword = await encryptPassword(password);
    const adminPass = await encryptPassword(password);

    // 4. OTP Rate Limit
    const rateLimit = await checkOtpRateLimit('school', email);
    if (rateLimit.limited) {
      return ResponseHandler(
        res,
        StatusCodes.TOO_MANY_REQUESTS,
        rateLimit.message
      );
    }

    // 5. Create School
    const newSchool = await School.create({
      schoolName,
      ownerName,
      email,
      phoneNumber,
      schoolCode,
      password: schoolPassword,
      referralId: req.admin_id,
      address,
      city,
      state,
      zipCode,
      country,
      board,
      schoolType,
      logo: req.files?.logo?.[0]?.filename || '',
    });

    // ✅ 6. CREATE DEFAULT ADMIN
    const newAdmin = await SchoolAdmin.create({
      name: ownerName,
      email: email,
      password: adminPass,
      isSuperAdmin: true,
      schoolId: newSchool._id,
      isVerified: false,
    });

    // 8. OTP for SchoolAdmin
    const otp = generateOtp();
    await storeOtp('admin', newAdmin.email, otp);

    sendRegisterVerificationEmail(
      `Your School Register OTP is: ${otp}`,
      newAdmin.email,
      'School',
      'Register'
    ).catch((err) => logger.error(err));

    return ResponseHandler(
      res,
      StatusCodes.CREATED,
      responseMessage.SCHOOL_ADMIN_REGISTERED_SUCCESSFULLY_VER,
      {
        schoolEmail: newSchool.email,
        adminEmail: newAdmin.email,
      }
    );
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region Profile GET/UPDATE
export const getProfile = async (req, res) => {
  try {
    const school = await School.findById(req.school_id);
    if (!school) {
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.SCHOOL_NOT_FOUND_1
      );
    }

    const responseData = {
      schoolName: school.schoolName,
      ownerName: school.ownerName,
      phoneNumber: school.phoneNumber,
      email: school.email,
      address: school.address,
      city: school.city,
      state: school.state,
      zipCode: school.zipCode,
      country: school.country,
      logo: school.logo,
      isActive: school.isActive,
    };

    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.PROFILE_RETRIEVED_EFFECTIVELY,
      responseData
    );
  } catch (error) {
    logger.error(`Get Profile error: ${error}`);
    return CatchErrorHandler(res, error);
  }
};

export const updateProfile = async (req, res) => {
  try {
    const {
      schoolName,
      ownerName,
      phoneNumber,
      address,
      city,
      state,
      zipCode,
      country,
      logo,
    } = req.body;
    const schoolId = req.school_id;

    const school = await School.findById(schoolId);
    if (!school) {
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.SCHOOL_NOT_FOUND_1
      );
    }

    // Usually checking for duplicates of phone number if changing
    if (phoneNumber && phoneNumber !== school.phoneNumber) {
      const duplicate = await School.findOne({
        phoneNumber,
        _id: { $ne: schoolId },
      });
      if (duplicate)
        return ResponseHandler(
          res,
          StatusCodes.CONFLICT,
          responseMessage.PHONE_NUMBER_ALREADY_IN_USE
        );
      school.phoneNumber = phoneNumber;
    }

    if (schoolName) school.schoolName = schoolName;
    if (ownerName) school.ownerName = ownerName;
    if (address !== undefined) school.address = address;
    if (city !== undefined) school.city = city;
    if (state !== undefined) school.state = state;
    if (zipCode !== undefined) school.zipCode = zipCode;
    if (country !== undefined) school.country = country;

    // Check if the logo was sent as a file
    if (req?.files?.logo?.length > 0) {
      school.logo = req.files.logo[0]?.filename;
    } else if (logo !== undefined) {
      // Or fallback to plain text if directly sent
      school.logo = logo;
    }

    await school.save();

    const updated = await School.findById(schoolId);
    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.PROFILE_UPDATED,
      updated
    );
  } catch (error) {
    logger.error(`Update Profile error: ${error}`);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region get all Schools
export const getAllSchools = async (req, res) => {
  try {
    const data = await School.find();
    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.SCHOOLS_RETRIEVED_SUCCESSFULLY,
      data
    );
  } catch (error) {
    logger.error(`Get All Schools error: ${error}`);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region get school by id
export const getSchoolById = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const data = await School.findById({ _id: schoolId });
    if (!data) {
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.SCHOOL_NOT_FOUND_1
      );
    }
    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.SCHOOL_RETRIEVED_SUCCESSFULLY,
      data
    );
  } catch (error) {
    logger.error(`Get School By Id error: ${error}`);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region update school by id
export const updateSchoolById = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const {
      schoolName,
      ownerName,
      phoneNumber,
      address,
      city,
      state,
      zipCode,
      country,
      logo,
    } = req.body;

    // 1. Find school (correct way)
    const school = await School.findOne({
      _id: schoolId,
      isDeleted: false,
    });

    if (!school) {
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.SCHOOL_NOT_FOUND
      );
    }

    // 2. Duplicate check (like register API)
    if (phoneNumber && phoneNumber !== school.phoneNumber) {
      const existingPhone = await School.findOne({
        phoneNumber,
        _id: { $ne: schoolId },
      });

      if (existingPhone) {
        return ResponseHandler(
          res,
          StatusCodes.CONFLICT,
          responseMessage.PHONE_NUMBER_ALREADY_EXISTS
        );
      }
    }

    // 3. Update only if value exists (safe update)
    school.schoolName = schoolName ?? school.schoolName;
    school.ownerName = ownerName ?? school.ownerName;
    school.phoneNumber = phoneNumber ?? school.phoneNumber;
    school.address = address ?? school.address;
    school.city = city ?? school.city;
    school.state = state ?? school.state;
    school.zipCode = zipCode ?? school.zipCode;
    school.country = country ?? school.country;
    school.logo = logo ?? school.logo;

    // 4. Save
    await school.save();

    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.SCHOOL_UPDATED_SUCCESSFULLY,
      school
    );
  } catch (error) {
    logger.error(`Update School By Id error: ${error}`);
    return CatchErrorHandler(res, error);
  }
};
//#endregion
