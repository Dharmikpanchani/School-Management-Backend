import { StatusCodes } from 'http-status-codes';
import School from '../../models/school/School.js';
import Referral from '../../models/school/Referral.js';
import {
  CatchErrorHandler,
  ResponseHandler,
  encryptPassword,
  filterData,
} from '../../services/CommonServices.js';
import Logger from '../../utils/Logger.js';
import {
  generateOtp,
  storeOtp,
  verifyOtp,
  checkOtpRateLimit,
} from '../../services/OtpService.js';
import {
  sendRegisterVerificationEmail,
  sendSubscriptionBaseMail,
} from '../../services/EmailServices.js'; // Can be reused for OTP or make a specific one
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
      referralId,
      schoolCode,
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

    // 2. Referral Check
    let existingReferral = null;
    if (referralId) {
      existingReferral = await Referral.findById(referralId).populate(
        'schools',
        'schoolName email phoneNumber schoolCode isActive'
      );

      if (!existingReferral) {
        return ResponseHandler(
          res,
          StatusCodes.BAD_REQUEST,
          responseMessage.REFERRAL_NOT_FOUND
        );
      }
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
      referralId: existingReferral ? existingReferral._id : null,
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

    // 7. Referral Update — store only schoolId
    if (existingReferral) {
      existingReferral.schools.push(newSchool._id);
      await existingReferral.save();
    }

    // 8. OTP for SchoolAdmin
    const otp = generateOtp();
    await storeOtp('admin', newAdmin.email, otp);

    sendRegisterVerificationEmail(
      `Your School Register OTP is: ${otp}`,
      newAdmin.email,
      'School'
    ).catch((err) => logger.error(err));

    if (existingReferral) {
      // ✅ 🔥 SEND MAIL TO REFERRAL OWNER
      sendSubscriptionBaseMail(
        `The school "${newSchool.schoolName}" has successfully registered using your referral.`,
        [existingReferral.email]
      ).catch((err) => logger.error(`Referral Mail Error: ${err}`));
    }
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

//#region Verify OTP & Activate School
export const verifySchoolEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find both school and admin by email
    const school = await School.findOne({ email });
    if (!school) {
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.SCHOOL_NOT_FOUND
      );
    }

    const admin = await SchoolAdmin.findOne({ email, schoolId: school._id });
    if (!admin) {
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.ADMIN_NOT_FOUND_FOR_THIS_SCHOOL
      );
    }

    if (admin.isVerified) {
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.SCHOOL_IS_ALREADY_VERIFIED
      );
    }

    // OTP was stored with type 'admin' during registration
    const otpResult = await verifyOtp('admin', email, otp);

    if (!otpResult.success) {
      if (otpResult.maxAttemptsReached && !admin.isVerified) {
        // Hard delete unverified school and admin on max attempts
        await School.deleteOne({ _id: school._id });
        await SchoolAdmin.deleteOne({ _id: admin._id });
        return ResponseHandler(
          res,
          StatusCodes.BAD_REQUEST,
          responseMessage.TOO_MANY_OTP_ATTEMPTS_REGISTRATION_CANCE_1
        );
      }
      return ResponseHandler(res, StatusCodes.BAD_REQUEST, otpResult.message);
    }

    // Activate both school and admin
    school.isVerified = true;
    school.isActive = true;
    await school.save();

    admin.isVerified = true;
    admin.isActive = true;
    await admin.save();

    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.SCHOOL_EMAIL_VERIFIED_AND_ACCOUNT_ACTIVA
    );
  } catch (error) {
    logger.error(`Error verifying school email: ${error}`);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region Resend OTP
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const school = await School.findOne({ email });

    if (!school) {
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.SCHOOL_NOT_FOUND_1
      );
    }

    const rateLimit = await checkOtpRateLimit('school', email);
    if (rateLimit.limited) {
      return ResponseHandler(
        res,
        StatusCodes.TOO_MANY_REQUESTS,
        rateLimit.message
      );
    }

    const otp = generateOtp();
    await storeOtp('school', email, otp);
    sendSubscriptionBaseMail(`<span style="color:#4f46e5;">${otp}</span>`, [
      email,
    ]).catch((err) => logger.error(`Error sending OTP email: ${err}`));

    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.OTP_RESENT_SUCCESSFULLY
    );
  } catch (error) {
    logger.error(`Error resending OTP: ${error}`);
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
      filterData(data)
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
