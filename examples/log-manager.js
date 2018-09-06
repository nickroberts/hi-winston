const fs = require('fs-extra');
const path = require('path');
const { LogManager } = require('../lib');
const { getDefaultConsoleTransport, getDefaultFileTransport, myFormat } = require('../util');
const { format } = require('winston');

const logDirectory = path.join(__dirname, 'logs');
const transport2Filename = path.join(logDirectory, 'transport2.log');

fs.ensureDirSync(logDirectory);
// unlink the file
try {
  fs.unlinkSync(transport2Filename);
} catch (e) {
  // ignore errors
}

const config = {
  transports: {
    transport1: getDefaultConsoleTransport('transport1'),
    transport2: getDefaultFileTransport('transport2', { filename: transport2Filename }),
    transport3: getDefaultConsoleTransport('transport3')
  },
  loggers: {
    logger1: {
      transports: [{ name: 'transport1' }]
    },
    logger2: {
      transports: [{ name: 'transport1' }, { name: 'transport2' }]
    },
    'logger2.logger3': {
      transports: [
        {
          name: 'transport3',
          format: format.combine(
            format.timestamp(),
            format.colorize(),
            format.label({ label: 'logger2.logger3' }),
            format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
            myFormat
          )
        }
      ]
    }
  }
};

const logManager = new LogManager(config);
// logManager2 will not propagate messages up
const logManager2 = new LogManager({ ...config, hiWinston: { propagate: false } });

const logger1 = logManager.get('logger1');
const logger2 = logManager.get('logger2');
const logger3 = logManager.get('logger2.logger3');
const logger4 = logManager.get('logger2.logger3.logger4');
const logger5 = logManager2.get('logger2.logger3.logger4');

logger1.info('logger1 info');
logger2.info('logger2 info with data', { foo: 'bar' });
logger3.info('logger3 info');
// logger4 is not initially defined, so it will silently log, then propagate up
logger4.info('logger4 info');
// logger5 is not initially defined and uses logManager2, which does not propagate, so it will not log anything
logger5.info('logger5 info');

/* console output
${timestamp} [transport1] info: logger1 info
${timestamp} [transport1] info: logger2 info with data > {"foo":"bar"}
${timestamp} [logger2.logger3] info: logger3 info > {"metadata":{}}
${timestamp} [transport1] info: logger3 info
${timestamp} [logger2.logger3] info: logger4 info > {"metadata":{}}
${timestamp} [transport1] info: logger4 info
*/

/* logs/transport2.log output
${timesamp} [transport2] info: logger2 info with data > {"foo":"bar"}
${timesamp} [transport2] info: logger3 info
${timesamp} [transport2] info: logger4 info
*/
