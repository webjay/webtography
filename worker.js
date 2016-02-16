'use strict';

const execFile = require('child_process').execFile;
const os = require('os');
const urlLib = require('url');
const github = require('./github.js');

const options = {
  cwd: os.tmpdir(),
  timeout: 30 * 1000,
  maxBuffer: 10 * 1024
};

const cmd = (process.env.NODE_ENV === 'production') ? '/usr/bin/wget' : '/usr/local/bin/wget';

const args = [
  '--no-cookies',
  '--timestamping',
  '--quiet',
  '--recursive',
  '--level=10',
  '--convert-links',
  '--no-parent',
  '--user-agent=Webtography'
];

module.exports = handler;

function handler (url, username, token) {
  let path = os.tmpdir() + '/' + urlLib.parse(url, false, true).hostname;
  crawl(url, (err) => {
    if (err) {
      throw err;
    }
    github(path, username, token);
  });
};

function crawl (url, callback) {
  execFile(cmd, args.concat([url]), options, callback);
}
