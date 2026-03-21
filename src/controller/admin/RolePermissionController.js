import RoleManagement from '../../models/admin/RolePermission.js';
import { StatusCodes } from 'http-status-codes';
import {
  ResponseHandler,
  CatchErrorHandler,
} from '../../services/CommonServices.js';
import { responseMessage } from '../../utils/ResponseMessage.js';
import Logger from '../../utils/Logger.js';
import Admin from '../../models/admin/Admin.js';

const logger = new Logger('src/controllers/roleManagement.controller.js');

//#region ➕ Add / ✏️ Edit Role
export const addEditRole = async (req, res) => {
  try {
    const { id, role, permissions } = req.body;
    let parsedPermissions = permissions;

    // Parse permissions if string
    if (typeof permissions === 'string') {
      try {
        parsedPermissions = JSON.parse(permissions);
      } catch (error) {
        logger.error(error);
        return ResponseHandler(
          res,
          StatusCodes.BAD_REQUEST,
          'Permissions must be a valid JSON array'
        );
      }
    }

    // Validate parsedPermissions is an array
    if (!Array.isArray(parsedPermissions)) {
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        'Permissions must be an array'
      );
    }

    // Build payload
    const payload = {
      role: role?.trim(),
      permissions: parsedPermissions,
    };

    let result;

    if (id) {
      // 🔹 Update flow
      const existingRole = await RoleManagement.findOne({
        _id: id,
        isDeleted: false,
      });

      if (!existingRole) {
        return ResponseHandler(
          res,
          StatusCodes.NOT_FOUND,
          responseMessage.ROLE_NOT_FOUND
        );
      }

      // 🔹 Check duplicate role name (excluding current id)
      const duplicate = await RoleManagement.findOne({
        _id: { $ne: id },
        role: payload.role,
        isDeleted: false,
      });

      if (duplicate) {
        return ResponseHandler(
          res,
          StatusCodes.CONFLICT,
          responseMessage.ROLE_ALREADY_EXISTS
        );
      }

      result = await RoleManagement.findByIdAndUpdate(id, payload, {
        new: true,
      });

      return ResponseHandler(
        res,
        StatusCodes.OK,
        responseMessage.ROLE_UPDATED,
        result
      );
    } else {
      // 🔹 Create flow → check duplicate
      const duplicate = await RoleManagement.findOne({
        role: payload.role,
        isDeleted: false,
        schoolId: req.school_id,
      });

      if (duplicate) {
        return ResponseHandler(
          res,
          StatusCodes.CONFLICT,
          responseMessage.ROLE_ALREADY_EXISTS
        );
      }

      result = await RoleManagement.create(payload);

      return ResponseHandler(
        res,
        StatusCodes.CREATED,
        responseMessage.ROLE_ADDED,
        result
      );
    }
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region 📄 Get All Roles
export const getAllRoles = async (req, res) => {
  try {
    const { pageNumber = 1, perPageData, searchRequest } = req.query;

    // Search setup
    const query = { isDeleted: false };
    if (searchRequest) {
      query.$or = [{ role: { $regex: searchRequest, $options: 'i' } }];
    }

    // Pagination setup
    const totalArrayLength = await RoleManagement.countDocuments(query);
    const page = parseInt(pageNumber);
    const limit = parseInt(perPageData || totalArrayLength);
    const skip = (page - 1) * limit;

    const data = await RoleManagement.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.ROLE_FETCH_SUCCESS,
      {
        totalArrayLength,
        pageNumber: page,
        perPageData: limit,
        data,
      }
    );
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region 🔍 Get Role By ID
export const getRoleById = async (req, res) => {
  try {
    const data = await RoleManagement.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!data) {
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.ROLE_NOT_FOUND
      );
    }

    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.ROLE_FETCH_SUCCESS,
      data
    );
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region 🗑️ Delete Role (Soft Delete)
export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await RoleManagement.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    const isRoleInUse = await Admin.exists({ role: id, isDeleted: false });
    if (isRoleInUse) {
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.ROLE_ASSIGNED_TO_USER_DELETE
      );
    }

    if (!data) {
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.ROLE_NOT_FOUND
      );
    }

    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.ROLE_DELETE_SUCCESS,
      null
    );
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region Role Action Status (Toggle Active)
export const roleActionStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await RoleManagement.findOne({ _id: id, isDeleted: false });

    const isRoleInUse = await Admin.exists({ role: id, isDeleted: false, schoolId: req.school_id });
    if (isRoleInUse) {
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.ROLE_ASSIGNED_TO_USER_STATUS
      );
    }

    if (!role) {
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.ROLE_NOT_FOUND
      );
    }

    const updatedRole = await RoleManagement.findByIdAndUpdate(
      id,
      { isActive: !role.isActive },
      { new: true }
    );

    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.ROLE_STATUS_UPDATED,
      updatedRole
    );
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion
