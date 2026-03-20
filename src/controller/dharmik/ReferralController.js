import { StatusCodes } from 'http-status-codes';
import Referral from '../../models/school/Referral.js';
import { CatchErrorHandler, ResponseHandler } from '../../services/CommonServices.js';
import Logger from '../../utils/Logger.js';

const logger = new Logger('./src/controller/dharmik/ReferralController.js');

//#region Create Free Referral
export const createReferral = async (req, res) => {
  try {
    const { email, number, upiId } = req.body;

    // Check if referral already exists
    const existingReferral = await Referral.findOne({
      $or: [{ email }, { number }, { upiId }]
    });

    if (existingReferral) {
      return ResponseHandler(res, StatusCodes.CONFLICT, 'Referral with this email, number or UPI ID already exists');
    }

    // Create the new pre-registered referral
    const newReferral = await Referral.create({
      email,
      number,
      upiId,
      schools: [] // Initializes empty list of joined schools
    });

    return ResponseHandler(res, StatusCodes.CREATED, 'Referral created successfully. Ready for school registration checks.', {
      referralId: newReferral._id,
      email: newReferral.email,
      number: newReferral.number
    });

  } catch (error) {
    logger.error(`Error creating referral: ${error}`);
    return CatchErrorHandler(res, error);
  }
};
//#endregion
