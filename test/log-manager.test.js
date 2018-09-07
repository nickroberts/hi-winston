const assume = require('assume');
const { describe, it, before } = require('mocha');
const stdMocks = require('std-mocks');
const { LogManager } = require('../lib');
const { getSimpleConsoleTransport } = require('../util');
const { format, transports } = require('winston');

describe('LogManager', () => {
  let logManager;
  describe('without a config', () => {
    it('should throw an error', () => {
      assume(() => {
        logManager = new LogManager();
      }).throws('config is required');
    });
  });
  describe('with an invalid config', () => {
    it('should throw an error', () => {
      assume(() => {
        logManager = new LogManager({});
      }).throws('invalid config');
    });
  });
  describe('with a config', () => {
    describe('without a root logger', () => {
      before(() => {
        logManager = new LogManager({
          transports: {
            transport1: getSimpleConsoleTransport('transport1'),
            transport2: getSimpleConsoleTransport('transport2')
          },
          loggers: {
            logger1: {
              transportNames: ['transport1']
            },
            logger2: {
              transportNames: ['transport1', 'transport2']
            }
          }
        });
      });
      describe('when logging to the logger1 logger', () => {
        it('should write to its transport', () => {
          stdMocks.use();
          logManager.get('logger1').info('logger1');
          stdMocks.restore();
          const output = stdMocks.flush();
          assume(output.stderr).is.an('array');
          assume(output.stderr).length(0);
          assume(output.stdout).is.an('array');
          assume(output.stdout).length(1);
          assume(output.stdout[0]).equals('[transport1] info: logger1\n');
        });
      });
      describe('when logging to the logger2 logger', () => {
        it('should write to its transport', () => {
          stdMocks.use();
          logManager.get('logger2').info('logger2');
          stdMocks.restore();
          const output = stdMocks.flush();
          assume(output.stderr).is.an('array');
          assume(output.stderr).length(0);
          assume(output.stdout).is.an('array');
          assume(output.stdout).length(2);
          assume(output.stdout[0]).equals('[transport1] info: logger2\n');
          assume(output.stdout[1]).equals('[transport2] info: logger2\n');
        });
      });
    });
    describe('with a root logger', () => {
      before(() => {
        logManager = new LogManager({
          transports: {
            root: getSimpleConsoleTransport('root'),
            transport1: getSimpleConsoleTransport('transport1'),
            transport2: getSimpleConsoleTransport('transport2'),
            transport3: new transports.Console({
              level: 'debug',
              format: format.combine(
                format.label({ label: 'transport3' }),
                format.printf(info => `[${info.label}] ${info.level}: ${info.message}`)
              )
            })
          },
          loggers: {
            root: {
              transportNames: ['root']
            },
            logger1: {
              level: 'silly',
              transportNames: ['transport1', 'transport2']
            },
            'logger1.logger2': {
              transportNames: ['transport3']
            },
            logger3: {
              transportNames: ['transport3']
            }
          }
        });
      });
      describe('when logging to the root logger', () => {
        it('should write to its transport', () => {
          stdMocks.use();
          logManager.get('root').info('root');
          stdMocks.restore();
          const output = stdMocks.flush();
          assume(output.stderr).is.an('array');
          assume(output.stderr).length(0);
          assume(output.stdout).is.an('array');
          assume(output.stdout).length(1);
          assume(output.stdout[0]).equals('[root] info: root\n');
        });
      });
      describe('when logging to the logger1 logger', () => {
        it('should write to its transports', () => {
          stdMocks.use();
          logManager.get('logger1').info('logger1');
          stdMocks.restore();
          const output = stdMocks.flush();
          assume(output.stderr).is.an('array');
          assume(output.stderr).length(0);
          assume(output.stdout).is.an('array');
          assume(output.stdout).length(3);
          assume(output.stdout[0]).equals('[transport1] info: logger1\n');
          assume(output.stdout[1]).equals('[transport2] info: logger1\n');
          assume(output.stdout[2]).equals('[root] info: logger1\n');
        });
      });
      describe('when logging to the logger1.logger2 logger', () => {
        it('should write to its transports', () => {
          stdMocks.use();
          const logger = logManager.get('logger1.logger2');
          logger.info('logger1.logger2 info');
          // This will not get logged to transport 3, as its level is info,
          // but it will propagate up to 1 and 2, as logger1's level is set to silly
          logger.silly('logger1.logger2 silly');
          stdMocks.restore();
          const output = stdMocks.flush();
          assume(output.stderr).is.an('array');
          assume(output.stderr).length(0);
          assume(output.stdout).is.an('array');
          assume(output.stdout).length(6);
          assume(output.stdout[0]).equals('[transport3] info: logger1.logger2 info\n');
          assume(output.stdout[1]).equals('[transport1] info: logger1.logger2 info\n');
          assume(output.stdout[2]).equals('[transport2] info: logger1.logger2 info\n');
          assume(output.stdout[3]).equals('[root] info: logger1.logger2 info\n');
          assume(output.stdout[4]).equals('[transport1] silly: logger1.logger2 silly\n');
          assume(output.stdout[5]).equals('[transport2] silly: logger1.logger2 silly\n');
        });
      });
      describe('when logging to the logger3.logger4 logger', () => {
        it('should write to its transports', () => {
          stdMocks.use();
          const logger = logManager.get('logger3.logger4');
          logger.info('logger3.logger4 info');
          logger.debug('logger3.logger4 debug');
          // this will not get logged, as there is no defined logger for this,
          // and the parent logger's level is not set to silly
          logger.silly('logger3.logger4 silly');
          stdMocks.restore();
          const output = stdMocks.flush();
          assume(output.stderr).is.an('array');
          assume(output.stderr).length(0);
          assume(output.stdout).is.an('array');
          assume(output.stdout).length(3);
          assume(output.stdout[0]).equals('[transport3] info: logger3.logger4 info\n');
          assume(output.stdout[1]).equals('[root] info: logger3.logger4 info\n');
          assume(output.stdout[2]).equals('[transport3] debug: logger3.logger4 debug\n');
        });
      });
    });
  });
});
