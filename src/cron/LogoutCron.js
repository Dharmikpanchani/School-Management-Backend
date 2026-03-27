import cron from 'node-cron';
import DeveloperAdmin from '../models/developerAdmin/DeveloperAdmin.js';
import SchoolAdmin from '../models/schoolAdmin/SchoolAdmin.js';
import User from '../models/user/User.js';
import Logger from '../utils/Logger.js';

const logger = new Logger('./src/cron/LogoutCron.js');

/**
 * Initializes a cron job to log out all users daily at 12:00 AM.
 * Sets isLogin to false for DeveloperAdmin, SchoolAdmin, and User models.
 */
export const initLogoutCron = () => {
  // schedule runs every day at 12:00 AM (midnight)
  cron.schedule('0 0 * * *', async () => {
    try {
      logger.info('Midnight sync: Logging out all users (Developer, Admin, User)');

      const [developerUpdate, schoolAdminUpdate, userUpdate] = await Promise.all([
        DeveloperAdmin.updateMany({}, { isLogin: false }),
        SchoolAdmin.updateMany({}, { isLogin: false }),
        User.updateMany({}, { isLogin: false }),
      ]);

      logger.info(
        `Midnight logout cron completed successfully: 
        Developers updated: ${developerUpdate.modifiedCount}, 
        SchoolAdmins updated: ${schoolAdminUpdate.modifiedCount}, 
        Users updated: ${userUpdate.modifiedCount}`
      );
    } catch (error) {
      logger.error('Error in midnight logout cron job:', error);
    }
  });
};
