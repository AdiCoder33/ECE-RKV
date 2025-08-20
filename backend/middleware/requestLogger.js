const logger = require('../utils/logger');

module.exports = function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  logger.info(`Start ${req.method} ${req.originalUrl}`);
  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - start) / 1e6;
    logger.info(`End ${req.method} ${req.originalUrl}`, {
      status: res.statusCode,
      duration: Number(duration.toFixed(2))
    });
  });
  next();
};
