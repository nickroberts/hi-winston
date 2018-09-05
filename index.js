const winston = require('winston');
const { Console } = winston.transports;
const { defaultFormatter, LeoWinston } = require('./lib/leo-winston');

const leo = new LeoWinston();

leo.add('root', {
  level: 'error',
  transports: [new Console({ format: defaultFormatter('root') })]
});

leo.add('a', {
  level: 'silly',
  transports: [new Console({ format: defaultFormatter('a') })]
});

leo.add('a.b', {
  level: 'silly',
  transports: [new Console()]
});

leo.add('a.b.c', {
  level: 'silly',
  transports: [new Console()]
});

leo.get('a').info('info logging from a logger');
leo.get('a.b').silly('silly logging from a.b logger');
leo.get('a.b.c').silly('silly logging from a.b.c logger');
leo.get('a.b.c').error('error logging from a.b.c logger');

leo.add('x', {
  level: 'silly'
});

leo.add('x.y', {
  level: 'silly',
  propagate: false
});

leo.get('x').info('info logging from x logger');
leo.get('x.y').silly('silly logging from x.y logger');
leo.get('x.y.z').silly('silly logging from x.y.z logger');
