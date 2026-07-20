const { CronExpressionParser } = require('cron-parser');
const cron = require('node-cron');

function parseCronExpression(expression, timezone = 'UTC') {
  if (typeof expression !== 'string' || !expression.trim() || !cron.validate(expression)) {
    throw new Error('Invalid cron expression. Use a valid five-field expression such as "30 7 * * *".');
  }
  try {
    return CronExpressionParser.parse(expression, { tz: timezone });
  } catch (error) {
    throw new Error(`Invalid cron expression or timezone: ${error.message}`);
  }
}

function getNextRun(expression, timezone = 'UTC') {
  return parseCronExpression(expression, timezone).next().toDate();
}

module.exports = { parseCronExpression, getNextRun };
