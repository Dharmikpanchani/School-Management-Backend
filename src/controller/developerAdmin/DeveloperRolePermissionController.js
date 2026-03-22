import RoleManagement from '../../models/schoolAdmin/RolePermission.js';
import { StatusCodes } from 'http-status-codes';
import {
  ResponseHandler,
  CatchErrorHandler,
  queryBuilder,
  filterData,
} from '../../services/CommonServices.js';
import { responseMessage } from '../../utils/ResponseMessage.js';
import Logger from '../../utils/Logger.js';
import SchoolAdmin from '../../models/schoolAdmin/SchoolAdmin.js';

const logger = new Logger(
  'src/controller/developerAdmin/DeveloperRolePermissionController.js'
);

//#region Add / Edit Role
export const addEditRole = async (req, res) => {
  try {
    const { id, role, permissions } = req.body;
    let parsedPermissions = permissions;

    if (typeof permissions === 'string') {
      try {
        parsedPermissions = JSON.parse(permissions);
      } catch (error) {
        logger.error(error);
        return ResponseHandler(
          res,
          StatusCodes.BAD_REQUEST,
          responseMessage.PERMISSIONS_MUST_BE_A_VALID_JSON_ARRAY
        );
      }
    }

    if (!Array.isArray(parsedPermissions)) {
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.PERMISSIONS_MUST_BE_AN_ARRAY
      );
    }

    const payload = {
      role: role?.trim(),
      permissions: parsedPermissions,
    };

    let result;

    if (id) {
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
      const data = filterData(result);
      return ResponseHandler(
        res,
        StatusCodes.OK,
        responseMessage.ROLE_UPDATED,
        data
      );
    } else {
      // Global DeveloperAdmin implementation ensures no tenant restriction on roles created
      const duplicate = await RoleManagement.findOne({
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

      result = await RoleManagement.create(payload);
      const data = filterData(result);
      return ResponseHandler(
        res,
        StatusCodes.CREATED,
        responseMessage.ROLE_ADDED,
        data
      );
    }
  } catch (error) {
    logger.error(error);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region Get All Roles
export const getAllRoles = async (req, res) => {
  try {
    const { pageNumber, perPageData, searchRequest, isActive } = req.query;

    const result = await queryBuilder(RoleManagement, {
      pageNumber,
      perPageData,
      searchRequest,

      searchableFields: ['role'],
      sort: { createdAt: -1 },

      filters: {
        isActive,
      },
    });
    const data = {
      pagination: result.pagination,
      data: result.data.map((admin) => filterData(admin)),
    };

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

//#region Get Role By ID
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

//#region Delete Role (Soft Delete)
export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if role is bound to any global/tenant admins
    const isRoleInUse = await SchoolAdmin.exists({
      role: id,
      isDeleted: false,
    });
    if (isRoleInUse) {
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.ROLE_ASSIGNED_TO_USER_DELETE
      );
    }

    const data = await RoleManagement.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

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
    if (!role) {
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.ROLE_NOT_FOUND
      );
    }

    const isRoleInUse = await SchoolAdmin.exists({
      role: id,
      isDeleted: false,
    });
    if (isRoleInUse) {
      return ResponseHandler(
        res,
        StatusCodes.BAD_REQUEST,
        responseMessage.ROLE_ASSIGNED_TO_USER_STATUS
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
