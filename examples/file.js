const fs = require('fs-extra');
const path = require('path');
const { getDefaultConsoleTransport, getDefaultFileTransport } = require('../util');
const { format } = require('winston');
const { HiWinston } = require('../lib');

const logDirectory = path.join(__dirname, 'logs');
const errorFilename = path.join(logDirectory, 'error.log');
const infoFilename = path.join(logDirectory, 'info.log');

fs.ensureDirSync(logDirectory);
// unlink the files
try {
  fs.unlinkSync(errorFilename);
  fs.unlinkSync(infoFilename);
} catch (e) {
  // ignore errors
}

const hiWinston = new HiWinston();

const loggers = [
  {
    name: 'root',
    options: {
      level: 'silly',
      transports: [
        // Log up to silly (everything) in the console
        getDefaultConsoleTransport('root'),
        // Log up to info in the info file
        getDefaultFileTransport('root', { filename: infoFilename }),
        // Log up to error in the error file
        getDefaultFileTransport('root', {
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
      transports: [getDefaultConsoleTransport('a')]
    }
  }
];

// Add each logger configuration to the logger with the default options
loggers.forEach(logger => hiWinston.add(logger.name, logger.options));

hiWinston.get('a').silly(`Testing silly logger with data`, { foo: 'silly' });
hiWinston.get('a').info(`Testing info logger with data`, { foo: 'info' });
hiWinston.get('a').error(`Testing error logger with data`, { foo: 'error' });

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
