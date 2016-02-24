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
  let opt = extend(RequestOptions, options);
  let req = request(opt, (res) => {
    res.setEncoding('utf8');
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      let result = JSON.parse(body);
      if (res.statusCode >= 300) {
        // throw result.message;
        return console.error(result.message, options.method, options.path);
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
