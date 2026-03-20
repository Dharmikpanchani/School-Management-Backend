import app from './src/app.js';
import config from './src/config/Index.js';
import dbConnect from './src/config/Db.config.js';
import Logger from './src/utils/Logger.js';
const logger = new Logger('server.js');

app.listen(config.PORT, async () => {
  await dbConnect();
  logger.info(`✅ Server started on port ${config.PORT}`);
});