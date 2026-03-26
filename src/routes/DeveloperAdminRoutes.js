import { Router } from 'express';
import { validator } from '../middleware/Validator.js';
import * as DeveloperAdminController from '../controller/developerAdmin/DeveloperAdminController.js';
import * as DeveloperAuthController from '../controller/developerAdmin/DeveloperAuthController.js';
import * as DeveloperRolePermissionController from '../controller/developerAdmin/DeveloperRolePermissionController.js';
import { developerAuth, refreshTokenAuth } from '../middleware/Auth.js';
import { checkPermission, checkRoleInUse } from '../middleware/Rbac.js';
import { developerRolePermissionList } from '../utils/RolePermissionList.js';
import { authLimiter } from '../middleware/RateLimit.js';
import MediaUpload from '../middleware/MediaUpload.js';

const developerRoutes = Router();

//#region Auth & OTP Management
developerRoutes.use('/login', authLimiter);
developerRoutes.use('/send-otp', authLimiter);
developerRoutes.use('/verify-otp', authLimiter);

developerRoutes.post(
  '/login',
  validator('developerLoginSchema'),
  DeveloperAuthController.login
);

developerRoutes.post(
  '/send-otp',
  validator('sendOtpSchema'),
  DeveloperAuthController.sendOtp
);

developerRoutes.post(
  '/verify-otp',
  validator('verifyOtpSchema'),
  DeveloperAuthController.verifyOtpCommon
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

export default developerRoutes;