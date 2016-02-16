'use strict';

const Request = require('https').request;
const extend = require('util')._extend;
const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = handler;

function handler (dirPath, username, token) {
  let repoName = path.basename(dirPath);
  let tmpDirPos = (os.tmpdir() + '/' + repoName).length + 1;
	let gh = new Github(repoName, username, token);
	gh.makeRepo(() => {
		dirWalk(dirPath, (filePath) => {
			fs.readFile(filePath, (err, content) => {
			  if (err) throw err;
	  		let filePathGh = filePath.substr(tmpDirPos);
				gh.makeFile(filePathGh, content, () => {
					console.log('Made ' + filePathGh);
				});
			});
		});
	});
};

function dirWalk (dirPath, callback) {
  fs.readdir(dirPath, function (err, files) {
		if (err) throw err;
    files.forEach( (name) => {
      let filePath = path.join(dirPath, name);
      let stat = fs.statSync(filePath);
      if (stat.isFile()) {
				callback(filePath, stat);
      } else if (stat.isDirectory()) {
				dirWalk(filePath, callback);
      }
    });
  });
}

function request (options, data, callback) {
	let opt = extend(RequestOptions, options);
	let req = Request(opt, (res) => {
	  res.setEncoding('utf8');
	  let body = '';
	  res.on('data', (chunk) => {
			body += chunk;
	  });
	  res.on('end', () => {
			console.log(JSON.parse(body));
			callback();
	  });
		res.on('error', (err) => {
  		throw err;
		});
  });
  if (data) {
  	req.write(JSON.stringify(data));
  }
  req.end();
}

const RequestOptions = {
	hostname: 'api.github.com',
	headers: {
		'Content-Type': 'application/json',
		'User-Agent': 'webjay/webtography'
	}
}

const Committer = {
  name: 'LoremCMS',
  email: 'team@loremcms.com'
}

class Github {

	constructor (repoName, username, token) {
		this.repoName = repoName;
		this.username = username;
		this.auth = username + ':' + token;
	}

	makeRepo (callback) {
		const options = {
			auth: this.auth,
			method: 'POST',
			path: '/user/repos'
		}
		request(options, {
			name: this.repoName,
			description: 'webtographied for LoremCMS',
			homepage: 'http://' + this.username + '.github.io/' + this.repoName,
			has_issues: true,
			has_wiki: false,
			has_downloads: false,
			auto_init: false
		}, callback);
	}

	makeFile (name, buffer, callback) {
		const options = {
			auth: this.auth,
			method: 'PUT',
			path: '/repos/' + this.username + '/' + this.repoName + '/contents/' + name,
		}
		request(options, {
			path: name,
			message: 'webtography this',
			content: buffer.toString('base64'),
			branch: 'gh-pages',
			committer: Committer
		}, callback);
	}

}
