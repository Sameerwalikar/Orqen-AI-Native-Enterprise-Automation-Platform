function logStructured(level, message, context = {}) {
  const logObject = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };

  // Ensure secrets/keys are never logged
  const sensitiveKeys = ['apiKey', 'secret', 'password', 'token', 'authorization'];
  sensitiveKeys.forEach(sensitiveKey => {
    if (logObject[sensitiveKey]) {
      delete logObject[sensitiveKey];
    }
  });

  if (level === 'ERROR') {
    console.error(JSON.stringify(logObject));
  } else if (level === 'WARN') {
    console.warn(JSON.stringify(logObject));
  } else {
    console.log(JSON.stringify(logObject));
  }
}

module.exports = {
  info: (msg, ctx) => logStructured('INFO', msg, ctx),
  warn: (msg, ctx) => logStructured('WARN', msg, ctx),
  error: (msg, ctx) => logStructured('ERROR', msg, ctx),
};
