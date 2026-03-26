import { Router } from 'express';
import { validator } from '../middleware/Validator.js';
import { MediaUpload } from '../middleware/MediaUpload.js';
import { adminAuth, refreshTokenAuth } from '../middleware/Auth.js';
import { authLimiter } from '../middleware/RateLimit.js';
import * as AdminController from '../controller/schoolAdmin/AdminController.js';
import * as RoleManagementController from '../controller/schoolAdmin/RolePermissionController.js';
import { checkPermission, checkRoleInUse } from '../middleware/Rbac.js';
import { rolePermissionList } from '../utils/RolePermissionList.js';
import * as SchoolController from '../controller/school/SchoolController.js';
import { redisCache } from '../middleware/RedisCache.js';

const adminRoutes = Router();

//#region Admin authentication routes
adminRoutes.use('/login', authLimiter);
adminRoutes.use('/register', authLimiter);
adminRoutes.use('/verify-email', authLimiter);
adminRoutes.use('/re-send-otp', authLimiter);
adminRoutes.use('/resend-forgot-otp', authLimiter);

adminRoutes.post(
  '/login',
  validator('adminLoginSchema'),
  AdminController.login
);

adminRoutes.post(
  '/verify-login-otp',
  authLimiter,
  validator('adminVerifyLoginOtpSchema'),
  AdminController.verifyLoginOtp
);

adminRoutes.post(
  '/add-edit-admin',
  adminAuth,
  checkPermission(rolePermissionList.admin_users.create),
  AdminController.addEditAdminProfile
);

adminRoutes.post(
  '/refresh-token',
  refreshTokenAuth,
  AdminController.refreshToken
);
adminRoutes.post('/logout', refreshTokenAuth, AdminController.logout);

adminRoutes.post(
  '/verify-registration-otp',
  authLimiter,
  validator('adminVerifyRegistrationOtpSchema'),
  AdminController.verifyAdminRegistrationOtp
);
adminRoutes.post(
  '/re-send-otp',
  validator('adminForgotPasswordSchema'),
  AdminController.resendOtp
);
adminRoutes.post(
  '/forgot-password',
  validator('adminForgotPasswordSchema'),
  AdminController.forgotPassword
);
adminRoutes.post(
  '/verify-otp',
  validator('adminForgotPasswordSchema'),
  AdminController.verifyForgotPasswordOtp
);
adminRoutes.post(
  '/resend-forgot-otp',
  validator('adminForgotPasswordSchema'),
  AdminController.resendForgotPasswordOtp
);
adminRoutes.post(
  '/reset-password',
  validator('adminResetPasswordSchema'),
  AdminController.resetPassword
);
adminRoutes.post(
  '/change-password',
  adminAuth,
  validator('changePasswordSchema'),
  AdminController.changePassword
);
adminRoutes.get('/profile', adminAuth, redisCache(300), AdminController.profile);
adminRoutes.patch(
  '/update-profile',
  adminAuth,
  MediaUpload(),
  AdminController.updateProfile
);

adminRoutes.get(
  '/get-all-admins',
  adminAuth,
  checkPermission(rolePermissionList.admin_users.read),
  redisCache(300),
  AdminController.getAllAdmins
);
adminRoutes.delete(
  '/delete-admin/:id',
  adminAuth,
  checkPermission(rolePermissionList.admin_users.delete),
  AdminController.deleteAdmin
);
adminRoutes.post(
  '/admin-action-status/:id',
  adminAuth,
  checkPermission(rolePermissionList.admin_users.status),
  AdminController.adminStatusHandler
);
//#endregion

//#region School Management routes
adminRoutes.patch(
  '/update-school/:schoolId',
  adminAuth,
  checkPermission(rolePermissionList?.schools?.update),
  SchoolController.updateSchoolById
);
//#endregion

//#region Role Management routes
adminRoutes.post(
  '/add-edit-role',
  adminAuth,
  checkPermission(rolePermissionList.roles.create),
  RoleManagementController.addEditRole
);
adminRoutes.get(
  '/get-all-roles',
  adminAuth,
  checkPermission(rolePermissionList.roles.read),
  redisCache(300),
  RoleManagementController.getAllRoles
);
adminRoutes.get(
  '/get-role/:id',
  adminAuth,
  checkPermission(rolePermissionList.roles.read),
  RoleManagementController.getRoleById
);
adminRoutes.delete(
  '/delete-role/:id',
  adminAuth,
  checkPermission(rolePermissionList.roles.delete),
  checkRoleInUse,
  RoleManagementController.deleteRole
);
adminRoutes.post(
  '/role-action-status/:id',
  adminAuth,
  checkPermission(rolePermissionList.roles.status),
  RoleManagementController.roleActionStatus
);
//#endregion

export default adminRoutes;
