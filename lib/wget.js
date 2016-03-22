'use strict';

const execFile = require('child_process').execFile;
const tmpdir = require('os').tmpdir;

const options = {
  cwd: tmpdir(),
  timeout: 30 * 1000,
  // maxBuffer: 50 * 1024
};

const cmd = (process.env.NODE_ENV === 'production') ? '/usr/bin/wget' : '/usr/local/bin/wget';

const args = [
  '--user-agent=Webtography',
  '--no-cookies',
  '--timestamping',
  // '--quiet',
  '--recursive',
  // '--level=2',
  '--convert-links',
  '--no-parent',
  '--page-requisites',
  '--adjust-extension',
  '--max-redirect=0'
];

module.exports = wget;

function wget (url, callback) {
  execFile(cmd, args.concat([url]), options, callback);
}
