import { Router } from 'express';
import adminRoutes from './SchoolAdminRoutes.js';
import userRoutes from './UserRoutes.js';
import schoolRoutes from './SchoolRoutes.js';
import developerRoutes from './DeveloperAdminRoutes.js';
import paymentRoutes from './PaymentRoutes.js';

const router = Router();

router.use('/school', schoolRoutes);
router.use('/admin', adminRoutes);
router.use('/user', userRoutes);
router.use('/developer', developerRoutes);
router.use('/payment', paymentRoutes);
export default router;
