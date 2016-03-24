'use strict';

const request = require('https').request;
const extend = require('util')._extend;

const RequestOptions = {
  hostname: 'api.github.com',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'webjay/webtography'
  }
};

module.exports = (options, data, callback) => {
  const opt = extend(RequestOptions, options);
  const req = request(opt, (res) => {
    res.setEncoding('utf8');
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      let result = '';
      try {
        result = JSON.parse(body);
      } catch (err) {
        console.error(err);
      }
      if (res.statusCode >= 300) {
        console.error(res.statusCode, JSON.stringify(res.headers), options.method, options.path, result);
      }
      if (res.statusCode === 403) {
        return;
      }
      callback(result);
    });
    res.on('error', (err) => {
      throw err;
    });
  });
  if (data) {
    req.write(JSON.stringify(data));
  }
  req.end();
};
