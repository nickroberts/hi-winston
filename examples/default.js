const { HiWinston } = require('../lib');

const hiWinston = new HiWinston();

const loggers = [
  { name: 'root', level: 'error' },
  { name: 'a', level: 'silly' },
  { name: 'a.b', level: 'debug' },
  { name: 'a.b.c', level: 'verbose' },
  { name: 'a.b.c.d', level: 'info' },
  { name: 'a.b.c.d.e', level: 'warn' },
  { name: 'a.b.c.d.e.f', level: 'error' }
];

// Add each logger configuration to the logger with the default options
loggers.forEach(logger => hiWinston.add(logger.name, { level: logger.level }));

// Log using each logger, which will propagate up
loggers.forEach(logger => hiWinston.get(logger.name).log(logger.level, `Testing ${logger.name} logger`));

/* console output
${timestamp} [root] error: Testing root logger
${timestamp} [a] silly: Testing a logger
${timestamp} [a.b] debug: Testing a.b logger
${timestamp} [a] debug: Testing a.b logger
${timestamp} [a.b.c] verbose: Testing a.b.c logger
${timestamp} [a.b] verbose: Testing a.b.c logger
${timestamp} [a] verbose: Testing a.b.c logger
${timestamp} [a.b.c.d] info: Testing a.b.c.d logger
${timestamp} [a.b.c] info: Testing a.b.c.d logger
${timestamp} [a.b] info: Testing a.b.c.d logger
${timestamp} [a] info: Testing a.b.c.d logger
${timestamp} [a.b.c.d.e] warn: Testing a.b.c.d.e logger
${timestamp} [a.b.c.d] warn: Testing a.b.c.d.e logger
${timestamp} [a.b.c] warn: Testing a.b.c.d.e logger
${timestamp} [a.b] warn: Testing a.b.c.d.e logger
${timestamp} [a] warn: Testing a.b.c.d.e logger
${timestamp} [a.b.c.d.e.f] error: Testing a.b.c.d.e.f logger
${timestamp} [a.b.c.d.e] error: Testing a.b.c.d.e.f logger
${timestamp} [a.b.c.d] error: Testing a.b.c.d.e.f logger
${timestamp} [a.b.c] error: Testing a.b.c.d.e.f logger
${timestamp} [a.b] error: Testing a.b.c.d.e.f logger
${timestamp} [a] error: Testing a.b.c.d.e.f logger
${timestamp} [root] error: Testing a.b.c.d.e.f logger
*/
