'use strict';

const execFile = require('child_process').execFile;
const os = require('os');

const options = {
  cwd: os.tmpdir(),
  timeout: 30 * 1000,
  maxBuffer: 10 * 1024
};

const args = [
  '--no-cookies', 
  '--timestamping',
  // '--quiet', 
  '--recursive',
  '--level=10', 
  '--convert-links', 
  '--no-parent'
];

execFile('wget', args.concat(['http://www.webcom.dk/']), options, (err, stdout, stderr) => {
  if (err !== null) {
    throw err;
  }
	console.log(`stdout: ${stdout}`);
	console.log(`stderr: ${stderr}`);
});
