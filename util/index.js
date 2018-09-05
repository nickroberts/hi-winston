const { transports, format } = require('winston');

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
  let message = `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
  const data = filteredData(info);
  if (Object.keys(data).length) {
    message += ` > ${JSON.stringify(data)}`;
  }
  return message;
});

const getDefaultConsoleTransport = (label, options) =>
  new transports.Console({
    format: format.combine(format.colorize(), format.label({ label }), format.timestamp(), myFormat),
    ...options
  });

const getSimpleConsoleTransport = label =>
  new transports.Console({
    format: format.combine(
      format.label({ label }),
      format.printf(info => `[${info.label}] ${info.level}: ${info.message}`)
    )
  });

const getDefaultFileTransport = (label, options) =>
  new transports.File({
    format: format.combine(format.label({ label }), format.timestamp(), myFormat),
    ...options
  });

module.exports = {
  filteredData,
  myFormat,
  getDefaultConsoleTransport,
  getSimpleConsoleTransport,
  getDefaultFileTransport
};
