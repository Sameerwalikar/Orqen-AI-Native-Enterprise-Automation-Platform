const test = require('node:test');
const assert = require('node:assert/strict');
const { getNextRun, parseCronExpression } = require('../services/scheduler/cronValidation');

for (const expression of ['30 7 * * *', '0 0 * * *', '*/15 * * * *']) {
  test(`accepts ${expression}`, () => assert.ok(getNextRun(expression, 'Asia/Kolkata') instanceof Date));
}

test('rejects invalid expressions with a descriptive error', () => {
  assert.throws(() => parseCronExpression('invalid cron'), /Invalid cron expression/);
});
