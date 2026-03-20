import { StatusCodes } from 'http-status-codes';
import { ResponseHandler } from '../services/CommonServices.js';

//#region Check Permission Middleware
/**
 * Middleware to check if the user/admin has the required permission
 * @param {string} requiredPermission - The required permission string (e.g., rolePermissionList.users.create)
 */
export const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      // Admins are attached to req.admin, Users to req.user (by Auth.js)
      const userOrAdmin = req.admin || req.user;

      // Ensure the user/admin was properly loaded
      if (!userOrAdmin) {
        return ResponseHandler(res, StatusCodes.UNAUTHORIZED, 'Authentication required');
      }

      // If user is a super admin, bypass checks
      if (userOrAdmin.isSuperAdmin) {
        return next();
      }

      // Populate Role if not already populated
      if (!userOrAdmin.populated('role')) {
        await userOrAdmin.populate('role');
      }

      const role = userOrAdmin.role;

      if (!role.isActive) {
        return ResponseHandler(res, StatusCodes.FORBIDDEN, 'Access denied. Role is inactive.');
      }

      const hasExactPermission = role.permissions.includes(requiredPermission);

      if (hasExactPermission) {
        return next();
      }

      return ResponseHandler(res, StatusCodes.FORBIDDEN, `Access denied. Requires '${requiredPermission}' permission.`);
    } catch (error) {
      return ResponseHandler(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Error checking permissions');
    }
  };
};
//#endregion


//#region Check Role In Use Middleware
export const checkRoleInUse = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return ResponseHandler(res, StatusCodes.BAD_REQUEST, 'Role ID is required');
    }

    const adminExists = await Admin.exists({ role: id, isDeleted: false });
    if (adminExists) {
      return ResponseHandler(res, StatusCodes.CONFLICT, 'Role is assigned to admins');
    }

    const userExists = await User.exists({ role: id, isDeleted: false });
    if (userExists) {
      return ResponseHandler(res, StatusCodes.CONFLICT, 'Role is assigned to users');
    }

    next();
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion
