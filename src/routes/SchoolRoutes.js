import { Router } from 'express';
import * as SchoolController from '../controller/school/SchoolController.js';
import { validator } from '../middleware/Validator.js';
import { authLimiter } from '../middleware/RateLimit.js';

// Include adminAuth middleware
import { adminAuth } from '../middleware/Auth.js';
import { MediaUpload } from '../middleware/MediaUpload.js';
const schoolRoutes = Router();
const adminRoutes = Router();

// Apply strict rate limiting for auth endpoints
schoolRoutes.use('/register', authLimiter);
schoolRoutes.use('/verify-email', authLimiter);

schoolRoutes.post(
  '/register',
  validator('schoolRegisterSchema'),
  SchoolController.register
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
adminRoutes.get('/school-profile', adminAuth, SchoolController.getProfile);
adminRoutes.post(
  '/school-update-profile',
  adminAuth,
  MediaUpload(),
  validator('schoolUpdateProfileSchema'),
  SchoolController.updateProfile
);

export default schoolRoutes;
