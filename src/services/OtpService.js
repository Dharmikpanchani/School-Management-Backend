import crypto from 'crypto';
import redis from '../config/Redis.config.js';
import Logger from '../utils/Logger.js';
import { responseMessage } from '../utils/ResponseMessage.js';

const logger = new Logger('src/services/OtpService.js');

const OTP_TTL = 300; // 5 minutes in seconds
const MAX_ATTEMPTS = 5;

//#region Generate secure 6-digit OTP
export const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};
//#endregion

//#region Store OTP in Redis
// key format: otp:{type}:{identifier}  e.g. otp:admin:test@mail.com
export const storeOtp = async (type, identifier, otp) => {
  const key = `otp:${type}:${identifier}`;
  const attemptsKey = `otp_attempts:${type}:${identifier}`;

  await redis.setex(key, OTP_TTL, otp);
  // Reset attempt counter when new OTP is issued
  await redis.setex(attemptsKey, OTP_TTL, '0');
  logger.info(`OTP stored for ${type}:${identifier}`);
};
//#endregion

//#region Verify OTP from Redis
export const verifyOtp = async (type, identifier, inputOtp) => {
  const key = `otp:${type}:${identifier}`;
  const attemptsKey = `otp_attempts:${type}:${identifier}`;

  const storedOtp = await redis.get(key);

  if (!storedOtp) {
    return { success: false, message: responseMessage.OTP_EXPIRED_OR_INVALID };
  }

  // Increment attempt counter
  const attempts = await redis.incr(attemptsKey);
  if (attempts >= MAX_ATTEMPTS) {
    await deleteOtp(type, identifier);
    return {
      success: false,
      message: 'Too many OTP attempts. Please request a new OTP.',
      maxAttemptsReached: true,
    };
  }

  if (storedOtp !== inputOtp.toString()) {
    const remaining = MAX_ATTEMPTS - attempts;
    return {
      success: false,
      message: `Invalid OTP. ${remaining == 0 ? 'Last' : remaining} attempts remaining.`,
    };
  }

  // OTP matched — delete from Redis
  await deleteOtp(type, identifier);
  return { success: true, message: 'OTP verified successfully' };
};
//#endregion

//#region Delete OTP from Redis
export const deleteOtp = async (type, identifier) => {
  const key = `otp:${type}:${identifier}`;
  const attemptsKey = `otp_attempts:${type}:${identifier}`;
  await redis.del(key, attemptsKey);
};
//#endregion

//#region Check OTP rate limit (max 3 OTP requests per 5 min)
export const checkOtpRateLimit = async (type, identifier) => {
  const rateLimitKey = `otp_rate:${type}:${identifier}`;
  const count = await redis.incr(rateLimitKey);

  if (count === 1) {
    await redis.expire(rateLimitKey, 300); // 5 minute window
  }

  if (count > 3) {
    const ttl = await redis.ttl(rateLimitKey);
    return {
      limited: true,
      message: `Too many OTP requests. Please wait ${ttl} seconds.`,
    };
  }

  return { limited: false };
};
//#endregion
