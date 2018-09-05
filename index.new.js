const { createLogger, format, transports, loggers } = require('winston');
const { combine, colorize, label, timestamp, printf, json } = format;
const LeoWinston = require('./lib/leo-winston');

const myFormat = name =>
  combine(
    colorize(),
    label({ label: name }),
    timestamp(),
    printf(info => {
      return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
    })
  );

const leo = new LeoWinston();

const testLoggers = ['root', 'a', 'a.b', 'a.b.c', 'x', 'x.y', 'x.y.z'];
testLoggers.forEach(
  logger => (logger === 'root' ? leo.add(logger) : leo.add(logger, { transports: [new transports.Console()] }))
);

testLoggers.forEach(logger => leo.get(logger).info(logger));

const defaultLogger = createLogger({
  transports: [
    new transports.Console({
      level: 'silly',
      format: myFormat('defaultLogger')
    })
  ]
});

defaultLogger.silly('testing-new-logger silly');
defaultLogger.debug('testing-new-logger debug');
defaultLogger.verbose('testing-new-logger verbose');
defaultLogger.info('testing-new-logger info');
defaultLogger.warn('testing-new-logger warn');
defaultLogger.error('testing-new-logger error');
