import { Router } from 'express';
import { validator } from '../middleware/Validator.js';
import * as SalesController from '../controller/developerAdmin/SalesController.js';
import * as DeveloperAdminController from '../controller/developerAdmin/DeveloperAdminController.js';
import * as DeveloperAuthController from '../controller/developerAdmin/DeveloperAuthController.js';
import * as DeveloperRolePermissionController from '../controller/developerAdmin/DeveloperRolePermissionController.js';
import { developerAuth, refreshTokenAuth } from '../middleware/Auth.js';
import { checkPermission, checkRoleInUse } from '../middleware/Rbac.js';
import { developerRolePermissionList } from '../utils/RolePermissionList.js';
import { authLimiter } from '../middleware/RateLimit.js';
import MediaUpload from '../middleware/MediaUpload.js';

const developerRoutes = Router();

//#region Auth & Profile Management
developerRoutes.use('/login', authLimiter);
developerRoutes.use('/verify-email', authLimiter);
developerRoutes.use('/re-send-otp', authLimiter);
developerRoutes.use('/resend-forgot-otp', authLimiter);

developerRoutes.post(
  '/login',
  validator('developerLoginSchema'),
  DeveloperAuthController.login
);

developerRoutes.post(
  '/verify-login-otp',
  authLimiter,
  validator('developerVerifyLoginOtpSchema'),
  DeveloperAuthController.verifyLoginOtp
);
developerRoutes.post(
  '/refresh-token',
  refreshTokenAuth,
  DeveloperAuthController.refreshToken
);
developerRoutes.post(
  '/logout',
  refreshTokenAuth,
  DeveloperAuthController.logout
);

developerRoutes.post(
  '/verify-registration-otp',
  authLimiter,
  validator('developerVerifyRegistrationOtpSchema'),
  DeveloperAuthController.verifyDeveloperRegistrationOtp
);
developerRoutes.post(
  '/re-send-otp',
  validator('developerForgotPasswordSchema'),
  DeveloperAuthController.resendOtp
);
developerRoutes.post(
  '/forgot-password',
  validator('developerForgotPasswordSchema'),
  DeveloperAuthController.forgotPassword
);
developerRoutes.post(
  '/verify-otp',
  validator('developerVerifyRegistrationOtpSchema'),
  DeveloperAuthController.verifyForgotPasswordOtp
);
developerRoutes.post(
  '/resend-forgot-otp',
  validator('developerForgotPasswordSchema'),
  DeveloperAuthController.resendForgotPasswordOtp
);
developerRoutes.post(
  '/reset-password',
  validator('developerResetPasswordSchema'),
  DeveloperAuthController.resetPassword
);
developerRoutes.post(
  '/change-password',
  developerAuth,
  validator('changePasswordSchema'),
  DeveloperAuthController.changePassword
);

developerRoutes.get('/profile', developerAuth, DeveloperAuthController.profile);
developerRoutes.patch(
  '/update-profile',
  developerAuth,
  MediaUpload(),
  validator('developerUpdateProfileSchema'),
  DeveloperAuthController.updateProfile
);
//#endregion

//#region Admin CRUD Management
developerRoutes.post(
  '/add-edit-admin',
  developerAuth,
  checkPermission(developerRolePermissionList.admin_users.create),
  DeveloperAdminController.addEditAdminProfile
);

developerRoutes.get(
  '/get-all-admins',
  developerAuth,
  checkPermission(developerRolePermissionList.admin_users.read),
  DeveloperAdminController.getAllAdmins
);

developerRoutes.delete(
  '/delete-admin/:id',
  developerAuth,
  checkPermission(developerRolePermissionList.admin_users.delete),
  DeveloperAdminController.deleteAdmin
);

developerRoutes.post(
  '/admin-action-status/:id',
  developerAuth,
  checkPermission(developerRolePermissionList.admin_users.status),
  DeveloperAdminController.adminStatusHandler
);
//#endregion

//#region Role Management routes
developerRoutes.post(
  '/add-edit-role',
  developerAuth,
  checkPermission(developerRolePermissionList.roles.create),
  DeveloperRolePermissionController.addEditRole
);
developerRoutes.get(
  '/get-all-roles',
  developerAuth,
  checkPermission(developerRolePermissionList.roles.read),
  DeveloperRolePermissionController.getAllRoles
);
developerRoutes.get(
  '/get-role/:id',
  developerAuth,
  checkPermission(developerRolePermissionList.roles.read),
  DeveloperRolePermissionController.getRoleById
);
developerRoutes.delete(
  '/delete-role/:id',
  developerAuth,
  checkPermission(developerRolePermissionList.roles.delete),
  checkRoleInUse,
  DeveloperRolePermissionController.deleteRole
);
developerRoutes.post(
  '/role-action-status/:id',
  developerAuth,
  checkPermission(developerRolePermissionList.roles.status),
  DeveloperRolePermissionController.roleActionStatus
);
//#endregion

//#region Sales Management
developerRoutes.post(
  '/add-update-sales',
  developerAuth,
  checkPermission(developerRolePermissionList.sales.create),
  validator('addEditSalesSchema'),
  SalesController.addEditSales
);

developerRoutes.get(
  '/get-all-sales',
  developerAuth,
  checkPermission(developerRolePermissionList.sales.read),
  SalesController.getAllSales
);

developerRoutes.get(
  '/get-sales/:id',
  developerAuth,
  checkPermission(developerRolePermissionList.sales.read),
  SalesController.getSalesById
);

developerRoutes.delete(
  '/delete-sales/:id',
  developerAuth,
  checkPermission(developerRolePermissionList.sales.delete),
  SalesController.deleteSales
);
//#endregion

export default developerRoutes;
