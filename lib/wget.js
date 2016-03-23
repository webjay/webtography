'use strict';

const execFile = require('child_process').execFile;
const tmpdir = require('os').tmpdir;

const options = {
  cwd: tmpdir(),
  timeout: 300 * 1000,
  maxBuffer: 500 * 1024
};

const cmd = (process.env.NODE_ENV === 'production') ? '/usr/bin/wget' : '/usr/local/bin/wget';

const args = [
  '--user-agent=Webtography',
  '--no-cookies',
  '--timestamping',
  // '--quiet',
  '--recursive',
  '--level=1',
  '--convert-links',
  '--no-parent',
  '--page-requisites',
  '--adjust-extension',
  '--max-redirect=0',
  '--exclude-directories=blog'
];

module.exports = function (url, callback) {
  execFile(cmd, args.concat([url]), options, callback);
};
