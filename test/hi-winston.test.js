const assume = require('assume');
const { describe, it, before, after, beforeEach } = require('mocha');
const winston = require('winston');
const { format, transports } = winston;
const { Console } = transports;
const { combine, label, printf } = format;
const stdMocks = require('std-mocks');
const { HiWinston } = require('../lib');

// Need to increase the max number of listeners because of the propagation
require('events').EventEmitter.defaultMaxListeners = 15;

const propagatedLoggers = ['a', 'a.b', 'a.b.c'];
const nonPropagatedLoggers = ['x', 'x.y', 'x.y.z'];
const getExpectedFormat = (label, level, message) => {
  return `[${label}] ${level}: ${message}`;
};
const getFormat = name =>
  combine(
    label({ label: name }),
    printf(info => {
      return getExpectedFormat(info.label, info.level, info.message);
    })
  );
const getLoggerOptions = name => {
  return {
    transports: [
      new Console({
        format: getFormat(name)
      })
    ]
  };
};

let hiWinston;

describe('HiWinston', () => {
  describe('with the default options', () => {
    before(() => {
      hiWinston = new HiWinston();
    });
    after(() => {
      hiWinston = null;
    });
    describe('when there is no root logger', () => {
      it('should throw an error', () => {
        assume(() => {
          hiWinston.get('root');
        }).throws('Root logger is not initialized');
      });
    });
    describe('when there is a root logger', () => {
      beforeEach(() => {
        hiWinston.add('root');
      });
      describe('when logging with the root logger', () => {
        it('should log to its transport', () => {
          stdMocks.use();
          hiWinston.get('root').info('root');
          stdMocks.restore();
          const output = stdMocks.flush();
          assume(output.stderr).is.an('array');
          assume(output.stderr).length(0);
          assume(output.stdout).is.an('array');
          assume(output.stdout).length(1);
          // Using includes for the root logger, as we can't reliably check the timestamp and colorized input,
          // which default format function uses
          assume(output.stdout[0]).contains('[root]');
        });
      });
      describe('when requesting an unknown logger', () => {
        const loggerName = 'unknown';
        it('should not throw an error', () => {
          assume(() => {
            hiWinston.get(loggerName);
          }).is.ok();
        });
        describe(`when logging to the unknown`, () => {
          it(`it should not log, but propagate up`, () => {
            stdMocks.use();
            hiWinston.get(loggerName).info(loggerName);
            stdMocks.restore();
            const output = stdMocks.flush();
            assume(output.stderr).is.an('array');
            assume(output.stderr).length(0);
            assume(output.stdout).is.an('array');
            assume(output.stdout).length(1);
            // Using includes for the root logger, as we can't reliably check the timestamp and colorized input,
            // which default format function uses
            assume(output.stdout[0]).contains('[root]');
          });
        });
      });
      describe('when adding loggers', () => {
        propagatedLoggers.forEach((logger, idx) => {
          describe(`when using the ${logger} logger`, () => {
            it(`it should log to its transport`, () => {
              hiWinston.add(logger, getLoggerOptions(logger));
              stdMocks.use();
              hiWinston.get(logger).info(logger);
              stdMocks.restore();
              const output = stdMocks.flush();
              assume(output.stderr).is.an('array');
              assume(output.stderr).length(0);
              assume(output.stdout).is.an('array');
              // Since these propagate up, it logs for each logger, along with the root logger,
              // that is why there is a + 2.
              assume(output.stdout).length(idx + 2);
              // Test all of the propagated logs
              for (let i = 0; i <= idx; i++) {
                assume(output.stdout[i]).equals(getExpectedFormat(propagatedLoggers[idx - i], 'info', `${logger}\n`));
              }
              // Using includes for the root logger, as we can't reliably check the timestamp and colorized input,
              // which default format function uses
              assume(output.stdout[idx + 1]).contains('[root]');
            });
          });
        });
      });
      describe('when adding a non propagated logger', () => {
        it(`it should log to only its transport`, () => {
          const logger = 'a.b.c.d';
          hiWinston.add(logger, {
            ...getLoggerOptions(logger),
            propagate: false
          });
          stdMocks.use();
          hiWinston.get(logger).info(logger);
          stdMocks.restore();
          const output = stdMocks.flush();
          assume(output.stderr).is.an('array');
          assume(output.stderr).length(0);
          assume(output.stdout).is.an('array');
          assume(output.stdout).length(1);
          assume(output.stdout[0]).equals(getExpectedFormat(logger, 'info', `${logger}\n`));
        });
        describe('when adding a propagated logger', () => {
          it(`it should log only to its transport and its parent`, () => {
            const propagatedLogger = 'a.b.c.d.e';
            hiWinston.add(propagatedLogger, getLoggerOptions(propagatedLogger));
            stdMocks.use();
            hiWinston.get(propagatedLogger).info(propagatedLogger);
            stdMocks.restore();
            const output = stdMocks.flush();
            assume(output.stderr).is.an('array');
            assume(output.stderr).length(0);
            assume(output.stdout).is.an('array');
            assume(output.stdout).length(2);
            assume(output.stdout[0]).equals(getExpectedFormat(propagatedLogger, 'info', `${propagatedLogger}\n`));
            assume(output.stdout[1]).equals(getExpectedFormat('a.b.c.d', 'info', `${propagatedLogger}\n`));
          });
        });
      });
      describe('when adding non-propagated loggers', () => {
        beforeEach(() => {
          nonPropagatedLoggers.forEach(logger =>
            hiWinston.add(logger, {
              ...getLoggerOptions(logger),
              propagate: false
            })
          );
        });
        nonPropagatedLoggers.forEach(logger => {
          describe(`when using the ${logger} logger`, () => {
            it(`it should log to its transport`, () => {
              stdMocks.use();
              hiWinston.get(logger).info(logger);
              stdMocks.restore();
              const output = stdMocks.flush();
              assume(output.stderr).is.an('array');
              assume(output.stderr).length(0);
              assume(output.stdout).is.an('array');
              assume(output.stdout).length(1);
              assume(output.stdout[0]).includes(`${logger}`);
              assume(output.stdout[0]).equals(getExpectedFormat(logger, 'info', `${logger}\n`));
            });
          });
        });
      });
    });
  });

  describe('when options.propagate is false', () => {
    before(() => {
      hiWinston = new HiWinston({ propagate: false });
      hiWinston.add('root', getLoggerOptions('root'));
      propagatedLoggers.forEach(logger => hiWinston.add(logger, getLoggerOptions(logger)));
    });
    after(() => {
      hiWinston = null;
    });
    describe('when adding loggers', () => {
      propagatedLoggers.forEach(logger => {
        describe(`when using the ${logger} logger`, () => {
          it(`it should log to its transport`, () => {
            stdMocks.use();
            hiWinston.get(logger).info(logger);
            stdMocks.restore();
            const output = stdMocks.flush();
            assume(output.stderr).is.an('array');
            assume(output.stderr).length(0);
            assume(output.stdout).is.an('array');
            assume(output.stdout).length(1);
            assume(output.stdout[0]).equals(getExpectedFormat(logger, 'info', `${logger}\n`));
          });
        });
      });
    });
  });
});
