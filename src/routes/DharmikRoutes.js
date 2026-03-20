import { Router } from 'express';
import { validator } from '../middleware/Validator.js';
import * as ReferralController from '../controller/dharmik/ReferralController.js';
import * as SchoolController from '../controller/school/SchoolController.js';

const dharmikRoutes = Router();

//#region Open Referral Registration
dharmikRoutes.post(
  '/create-referral',
  validator('createReferralSchema'), // ensures email, number, upiId are correct
  ReferralController.createReferral
);

dharmikRoutes.get('/get-all-schools', SchoolController.getAllSchools)
dharmikRoutes.get('/school-profile/:schoolId', SchoolController.getSchoolById)
//#endregion

export default dharmikRoutes;
