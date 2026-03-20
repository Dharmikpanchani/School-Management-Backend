import { responseMessage } from '../utils/ResponseMessage.js';
import validation from '../utils/Validation.js';
import { StatusCodes } from 'http-status-codes';

//#region for validator
export const validator = (validator) => {
  return async function (req, res, next) {
    try {
      if (!req.body) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          message: responseMessage.REQUIRED_FIELD,
          data: null,
        });
      }
      const validated = await validation[validator].validateAsync(req.body, {
        errors: {
          wrap: {
            label: '',
          },
        },
      });

      req.body = validated;
      next();
    } catch (err) {
      if (err.isJoi)
        res.status(StatusCodes.BAD_REQUEST).json({
          status: StatusCodes.BAD_REQUEST,
          message:
            err.details[0].message.charAt(0).toUpperCase() +
            err.details[0].message.slice(1),
          data: null,
        });
    }
  };
};
//#endregion
