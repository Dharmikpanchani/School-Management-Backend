import { Router } from 'express';
import adminRoutes from './AdminRoutes.js';
import userRoutes from './UserRoutes.js';
import schoolRoutes from './SchoolRoutes.js';
import developerRoutes from './DeveloperRoutes.js';

const router = Router();

router.use('/school', schoolRoutes);
router.use('/admin', adminRoutes);
router.use('/user', userRoutes);
router.use('/developer', developerRoutes);
export default router;
