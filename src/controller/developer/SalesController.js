import { StatusCodes } from 'http-status-codes';
import Sales from '../../models/developer/Sales.js';
import {
  CatchErrorHandler,
  ResponseHandler,
} from '../../services/CommonServices.js';
import Logger from '../../utils/Logger.js';
import { responseMessage } from '../../utils/ResponseMessage.js';

const logger = new Logger('./src/controller/developer/SalesController.js');

//#region Add / Edit Sales
export const addEditSales = async (req, res) => {
  try {
    const { id, email, number, upiId } = req.body;

    if (id) {
      // Update existing
      const existingSales = await Sales.findById(id);
      if (!existingSales) {
        return ResponseHandler(
          res,
          StatusCodes.NOT_FOUND,
          responseMessage.SALES_NOT_FOUND
        );
      }

      const duplicateSales = await Sales.findOne({
        _id: { $ne: id },
        $or: [{ email }, { number }, { upiId: upiId ? upiId : null }],
      });

      if (duplicateSales) {
        return ResponseHandler(
          res,
          StatusCodes.CONFLICT,
          responseMessage.SALES_ALREADY_EXISTS
        );
      }

      const updatedSales = await Sales.findByIdAndUpdate(
        id,
        { email, number, upiId },
        { new: true, runValidators: true }
      );

      return ResponseHandler(
        res,
        StatusCodes.OK,
        responseMessage.SALES_UPDATED,
        updatedSales
      );
    } else {
      // Create new
      const duplicateSales = await Sales.findOne({
        $or: [{ email }, { number }, { upiId: upiId ? upiId : null }],
      });

      if (duplicateSales) {
        return ResponseHandler(
          res,
          StatusCodes.CONFLICT,
          responseMessage.SALES_ALREADY_EXISTS
        );
      }

      const newSales = await Sales.create({
        email,
        number,
        upiId,
        schools: [],
      });

      return ResponseHandler(
        res,
        StatusCodes.CREATED,
        responseMessage.SALES_CREATED,
        {
          salesId: newSales._id,
          email: newSales.email,
          number: newSales.number,
        }
      );
    }
  } catch (error) {
    logger.error(`Error adding/editing sales profile: ${error}`);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region Get All Sales
export const getAllSales = async (req, res) => {
  try {
    const salesProfiles = await Sales.find().sort({ createdAt: -1 });
    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.SALES_FETCH_SUCCESS,
      salesProfiles
    );
  } catch (error) {
    logger.error(`Error retrieving sales profiles: ${error}`);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region Get Sales By Id
export const getSalesById = async (req, res) => {
  try {
    const { id } = req.params;
    const salesProfile = await Sales.findById(id);

    if (!salesProfile) {
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.SALES_NOT_FOUND
      );
    }

    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.SALES_FETCH_SUCCESS,
      salesProfile
    );
  } catch (error) {
    logger.error(`Error retrieving sales profile: ${error}`);
    return CatchErrorHandler(res, error);
  }
};
//#endregion

//#region Delete Sales
export const deleteSales = async (req, res) => {
  try {
    const { id } = req.params;

    const salesProfile = await Sales.findById(id);
    if (!salesProfile) {
      return ResponseHandler(
        res,
        StatusCodes.NOT_FOUND,
        responseMessage.SALES_NOT_FOUND
      );
    }

    await Sales.findByIdAndDelete(id);
    return ResponseHandler(
      res,
      StatusCodes.OK,
      responseMessage.SALES_DELETED,
      null
    );
  } catch (error) {
    logger.error(`Error deleting sales profile: ${error}`);
    return CatchErrorHandler(res, error);
  }
};
//#endregion
