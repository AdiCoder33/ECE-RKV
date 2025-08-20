const logger = require('../utils/logger');

module.exports = (startMsg, endMsg) => (req, res, next) => {
  logger.info(startMsg || `Start ${req.method} ${req.originalUrl}`, { userId: req.user?.id });
  res.on('finish', () => {
    logger.info(endMsg || `End ${req.method} ${req.originalUrl}`, { status: res.statusCode });
  });
  next();
};
