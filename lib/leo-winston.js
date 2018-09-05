const winston = require('winston');
const { format } = winston;
const { transports } = winston;
const { Console } = transports;
const { combine, timestamp, label, printf, colorize } = format;

const defaultFormatter = name =>
  combine(
    colorize(),
    timestamp(),
    label({ label: name }),
    printf(info => {
      return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
    })
  );

class LeoWinston {
  constructor(options) {
    this._options = Object.assign(
      {
        propagate: true
      },
      options
    );

    this._container = new winston.Container();

    this._propagationChains = {};
  }

  add(name, options) {
    options = Object.assign({}, this._options, options);
    if (!options.transports) {
      options.transports = [
        new Console({
          format: defaultFormatter(name)
        })
      ];
    }

    const logger = this._container.add(name, options);

    logger._meta = {
      name: name,
      options: options
    };

    if (this._options.propagate) {
      this._propagate(logger, options);
    }

    return logger;
  }

  get(name) {
    if (!this._container.has(name)) {
      if (!this._container.has('root')) {
        throw new Error('Root logger is not initialized');
      }
      // Unknown container requested
      return this._container.get(name, {
        transports: [new Console({ silent: true })]
      });
    }
    return this._container.get(name);
  }

  _buildPropagationChains() {
    const chains = [];
    this._container.loggers.forEach((logger, loggerName) => {
      if (loggerName === 'root') {
        return;
      }
      const chain = [];
      this._container.loggers.forEach((l, ln) => {
        if (ln !== 'root' && loggerName.indexOf(ln + '.') === 0) {
          chain.push(ln);
        }
      });
      chain.sort((a, b) => b.length - a.length);
      chain.push('root');
      chains[loggerName] = chain;
    });
    this._propagationChains = chains;
  }

  _propagate(logger, options) {
    this._buildPropagationChains();
    if (options.propagate) {
      logger.on('data', info => {
        const chain = this._propagationChains[logger._meta.name];
        const parent = chain && chain[0] && this.get(chain[0]);
        if (parent) {
          parent.log(info);
        }
      });
    }
  }
}

module.exports = {
  defaultFormatter,
  LeoWinston
};
