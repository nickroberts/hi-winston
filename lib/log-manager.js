const { transports } = require('winston');
const { HiWinston } = require('./hi-winston');

class LogManager {
  constructor(config) {
    this._checkConfig(config);
    this._config = config;
    this._hiWinston = new HiWinston(this._config.hiWinston);
    this._addLoggers();
  }

  _checkConfig(config) {
    if (!config) {
      throw new Error('config is required');
    } else if (!config.transports || !config.loggers) {
      throw new Error('invalid config');
    }
  }

  _addLoggers() {
    // If we don't have the required root logger...
    if (!this._config.loggers.root) {
      // add it, and silently log to the console
      this._hiWinston.add('root', { transports: [new transports.Console({ silent: true })] });
    }

    for (const loggersKey in this._config.loggers) {
      const logger = this._config.loggers[loggersKey];
      const transports = [];
      for (const transportsKey in this._config.transports) {
        const transport = this._config.transports[transportsKey];
        if (logger.transportNames.indexOf(transportsKey) >= 0) {
          transports.push(transport);
        }
      }
      this._hiWinston.add(loggersKey, { transports: transports });
    }
  }

  get(name) {
    return this._hiWinston.get(name);
  }
}

module.exports = {
  LogManager
};