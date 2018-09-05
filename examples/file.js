const fs = require('fs-extra');
const path = require('path');
const { transports, format } = require('winston');
const { LeoWinston } = require('../lib');

const logDirectory = path.join(__dirname, 'logs');
const errorFilename = path.join(logDirectory, 'error.log');
const infoFilename = path.join(logDirectory, 'info.log');

fs.emptyDirSync(logDirectory);

const leoWinston = new LeoWinston();

// Function to filter out properties to display data in the console
const filteredData = raw =>
  Object.keys(raw)
    .filter(key => !['timestamp', 'label', 'level', 'message'].includes(key))
    .reduce((obj, key) => {
      return {
        ...obj,
        [key]: raw[key]
      };
    }, {});

const myFormat = format.printf(info => {
  return `${info.timestamp} [${info.label}] ${info.level}: ${info.message} > ${JSON.stringify(filteredData(info))}`;
});

const loggers = [
  {
    name: 'root',
    options: {
      level: 'silly',
      transports: [
        // Log up to silly (everything) in the console
        new transports.Console({
          format: format.combine(format.colorize(), format.label({ label: 'root' }), format.timestamp(), myFormat)
        }),
        // Log up to info in the info file
        new transports.File({
          level: 'info',
          filename: infoFilename,
          format: format.combine(format.label({ label: 'root' }), format.timestamp(), myFormat)
        }),
        // Log up to error in the error file
        new transports.File({
          level: 'error',
          filename: errorFilename,
          format: format.combine(format.label({ label: 'root' }), format.timestamp(), format.json())
        })
      ]
    }
  },
  {
    name: 'a',
    options: {
      level: 'silly',
      transports: [
        new transports.Console({
          format: format.combine(format.colorize(), format.label({ label: 'a' }), format.timestamp(), myFormat)
        })
      ]
    }
  }
];

// Add each logger configuration to the logger with the default options
loggers.forEach(logger => leoWinston.add(logger.name, logger.options));

leoWinston.get('a').silly(`Testing silly logger with data`, { foo: 'silly' });
leoWinston.get('a').info(`Testing info logger with data`, { foo: 'info' });
leoWinston.get('a').error(`Testing error logger with data`, { foo: 'error' });

/* Console output
${timestamp} [a] silly: Testing silly logger with data > {"foo":"silly"}
${timestamp} [root] silly: Testing silly logger with data > {"foo":"silly"}
${timestamp} [a] info: Testing info logger with data > {"foo":"info"}
${timestamp} [root] info: Testing info logger with data > {"foo":"info"}
${timestamp} [a] error: Testing error logger with data > {"foo":"error"}
${timestamp} [root] error: Testing error logger with data > {"foo":"error"}
*/

/* logs/error.log output
{"foo":"error","level":"error","message":"Testing error logger with data","label":"root","timestamp":"${timestamp}"}
*/

/* logs/info.log output
${timestamp} [root] info: Testing info logger with data > {"foo":"info"}
${timestamp} [root] error: Testing error logger with data > {"foo":"error"}
*/
