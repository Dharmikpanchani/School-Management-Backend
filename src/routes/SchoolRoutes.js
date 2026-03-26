import { Router } from 'express';
import * as SchoolController from '../controller/school/SchoolController.js';
import { validator } from '../middleware/Validator.js';
import { authLimiter } from '../middleware/RateLimit.js';

// Include adminAuth middleware
import { adminAuth } from '../middleware/Auth.js';
import { MediaUpload } from '../middleware/MediaUpload.js';
import { redisCache } from '../middleware/RedisCache.js';
const schoolRoutes = Router();
const adminRoutes = Router();

// Apply strict rate limiting for auth endpoints
schoolRoutes.use('/schoolRegister', authLimiter);
schoolRoutes.use('/verify-email', authLimiter);
schoolRoutes.use('/resend-otp', authLimiter);

schoolRoutes.post(
  '/schoolRegister',
  validator('schoolRegisterSchema'),
  SchoolController.schoolRegister
);

schoolRoutes.post(
  '/verify-email',
  validator('schoolVerifyEmailSchema'),
  SchoolController.verifySchoolEmail
);

// Protected Auth Routes
schoolRoutes.post(
  '/resend-otp',
  validator('schoolResendOtpSchema'),
  SchoolController.resendOtp
);

// Fully protected Root school Routes (No RBAC Needed)
adminRoutes.get('/school-profile', adminAuth, redisCache(300), SchoolController.getProfile);
adminRoutes.post(
  '/school-update-profile',
  adminAuth,
  MediaUpload(),
  validator('schoolUpdateProfileSchema'),
  SchoolController.updateProfile
);

// Mount administrative routes
schoolRoutes.use(adminRoutes);

export default schoolRoutes;
