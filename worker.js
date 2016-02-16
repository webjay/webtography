'use strict';

const execFile = require('child_process').execFile;
const os = require('os');
const urlLib = require('url');
const github = require('./github.js');

const options = {
  cwd: os.tmpdir(),
  timeout: 30 * 1000,
  maxBuffer: 50 * 1024
};

const cmd = (process.env.NODE_ENV === 'production') ? '/usr/bin/wget' : '/usr/local/bin/wget';

const args = [
  '--user-agent=Webtography',
  '--no-cookies',
  '--timestamping',
  // '--quiet',
  '--recursive',
  '--level=2',
  '--convert-links',
  '--no-parent',
  '--page-requisites',
  '--adjust-extension',
  '--max-redirect=0'
];

module.exports = handler;

function handler (url, username, token) {
  let path = os.tmpdir() + '/' + urlLib.parse(url, false, true).hostname;
  crawl(url, (err) => {
    if (err && err.killed !== 8) {
      return console.error(err);
    }
    github(path, username, token);
  });
};

function crawl (url, callback) {
  execFile(cmd, args.concat([url]), options, callback);
}
