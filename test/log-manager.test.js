const assume = require('assume');
const { describe, it, before } = require('mocha');
const stdMocks = require('std-mocks');
const { LogManager } = require('../lib');
const { getSimpleConsoleTransport } = require('../util');
const { combine, simple } = require('winston').format;

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
              transports: [{ name: 'transport1' }]
            },
            logger2: {
              transports: [{ name: 'transport1' }, { name: 'transport2' }]
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
            transport1: getSimpleConsoleTransport('transport1')
          },
          loggers: {
            root: {
              transports: [{ name: 'root' }]
            },
            logger1: {
              transports: [
                {
                  name: 'transport1',
                  format: combine(simple())
                }
              ]
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
        it('should write to its transport', () => {
          stdMocks.use();
          logManager.get('logger1').info('logger1');
          stdMocks.restore();
          const output = stdMocks.flush();
          assume(output.stderr).is.an('array');
          assume(output.stderr).length(0);
          assume(output.stdout).is.an('array');
          assume(output.stdout).length(2);
          assume(output.stdout[0]).equals('info: logger1\n');
          assume(output.stdout[1]).equals('[root] info: logger1\n');
        });
      });
    });
  });
});
