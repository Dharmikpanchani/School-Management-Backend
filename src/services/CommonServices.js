import { StatusCodes } from 'http-status-codes';
import { responseMessage } from '../utils/ResponseMessage.js';
import config from '../config/Index.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

//#region for error handler
export function CatchErrorHandler(res, error) {
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    status: StatusCodes.INTERNAL_SERVER_ERROR,
    message: responseMessage.INTERNAL_SERVER_ERROR,
    data: error.message,
  });
}
//#endregion

//#region for response handler
export function ResponseHandler(res, status, message, data) {
  return res.status(status).json({
    status,
    message,
    data,
  });
}

/**
 * Common function to filter out unwanted fields from Response Data
 * @param {Object} data - Mongoose Document or Plain JS Object
 * @param {Array<string>} keysToRemove - Keys to remove (e.g. ['password', '__v'])
 * @returns {Object} Cleaned Object
 */
export function filterData(
  data,
  keysToRemove = [
    'password',
    '__v',
    'otp',
    'otpExpireAt',
    'referralId',
    'createdAt',
  ]
) {
  if (!data) return null;

  // Convert mongoose documents to plain JSON if needed
  let result = data.toObject ? data.toObject() : { ...data };

  keysToRemove.forEach((key) => {
    delete result[key];
  });

  return result;
}
//#endregion

//#region for password encryption
export async function encryptPassword(password) {
  const salt = await bcrypt.genSalt(10);
  let encrypt = bcrypt.hash(password, salt);
  return encrypt;
}
//#endregion

//#region for jwt token
export const genrateToken = ({ payload }) => {
  return jwt.sign(payload, config.JWT_SECRET_KEY, {
    expiresIn: '24h',
  });
};
//#endregion

// #region for pagination
export const getPaginatedData = async (model, options) => {
  const {
    page = 1,
    limit,
    search = '',
    searchableFields = [],
    baseQuery = {},
    sort = { createdAt: -1 }, // default sort
  } = options;

  const skip = (page - 1) * limit;
  const query = { ...baseQuery };

  if (search && searchableFields.length > 0) {
    query.$or = searchableFields.map((field) => ({
      [field]: { $regex: search, $options: 'i' },
    }));
  }

  const [data, total] = await Promise.all([
    model.find(query).sort(sort).skip(skip).limit(limit).lean(),
    model.countDocuments(query),
  ]);

  return {
    totalArrayLength: total,
    pageNumber: page,
    perPageData: limit,
    data,
  };
};
//#endregion
