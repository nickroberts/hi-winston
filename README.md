# hi-winston

[![npm version](https://img.shields.io/npm/v/@nickroberts/hi-winston.svg)](https://www.npmjs.com/package/@nickroberts/hi-winston)
[![Build Status](https://travis-ci.com/nickroberts/hi-winston.svg?branch=master)](https://travis-ci.com/nickroberts/hi-winston)
[![Code Coverage](https://codecov.io/gh/nickroberts/hi-winston/branch/master/graph/badge.svg)](https://codecov.io/gh/nickroberts/hi-winston)
[![GitHub license](https://img.shields.io/github/license/nickroberts/hi-winston.svg)](https://github.com/nickroberts/hi-winston/blob/master/LICENSE)

## Installation

```shell
npm i @nickroberts/hi-winston
```

## Usage

### HiWinston

```javascript
const { HiWinston } = require('@nickroberts/hi-winston');
const hiWinston = new HiWinston();

// root logger is required
hiWinston.add('root');

const a = hiWinston.add('a');
const ab = hiWinston.add('a.b');

a.info('a');
ab.info('ab');

/* console output:
${timestamp} [a] info: a
${timestamp} [root] info: a
${timestamp} [a.b] info: ab
${timestamp} [a] info: ab
${timestamp} [root] info: ab
*/
```

### LogManager

```javascript
const { transports, format } = require('winston');
const { LogManager } = require('@nickroberts/hi-winston');

const getSimpleConsoleTransport = label =>
  new transports.Console({
    format: format.combine(
      format.label({ label }),
      format.printf(info => `[${info.label}] ${info.level}: ${info.message}`)
    )
  });

const config = {
  transports: {
    t1: getSimpleConsoleTransport('t1'),
    t2: getSimpleConsoleTransport('t2')
  },
  loggers: {
    a: {
      transportNames: ['t1']
    },
    'a.b': {
      transportNames: ['t1', 't2']
    }
  }
};

// root logger is automatically added if not in the config
const logManager = new LogManager(config);

const a = logManager.get('a');
const ab = logManager.get('a.b');
const abc = logManager.get('a.b.c');

a.info('a info');
ab.info('a.b info');
abc.info('a.b.c info');

/* console output:
[t1] info: a info
[t1] info: a.b info
[t2] info: a.b info
[t1] info: a.b info
[t1] info: a.b.c info
[t2] info: a.b.c info
[t1] info: a.b.c info
*/
```
