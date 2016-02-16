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
  new Dirwalk(dirPath, (files) => {
    let gh = new Github(repoName, username, token);
    gh.makeRepo(() => {
      blobster(tmpDirPos, gh, files, (tree) => {
        gh.makeTree(tree, (data) => {
          gh.commit(data.sha, (data) => {
            gh.makeBranch('gh-pages', data.sha, (data) => {
              gh.editRepo(() => {});
            });
          })
        });
      });
    });
  });
};

function blobster (tmpDirPos, gh, files, callback) {
  let remaining = files.length;
  let fileObjs = [];
  files.forEach((fObj) => {
    gh.makeBlob(fObj.content, (data) => {
      fileObjs.push({
        path: fObj.path.substr(tmpDirPos),
        mode: '100644',
        type: 'blob',
        sha: data.sha
      });
      remaining -= 1;
      if (remaining === 0) {
        return callback(fileObjs);
      }
    });
  });
}

class Dirwalk {
  constructor (dir, callback) {
    let self = this;
    this.remaining = 0;
    this.fileObjs = [];
    this.walk(dir, (fileObj) => {
      self.fileObjs.push(fileObj);
      if (self.remaining === 0) {
        return callback(self.fileObjs);
      }
    });
  }
  walk (dirPath, callback) {
    let self = this;
    fs.readdir(dirPath, function (err, files) {
      if (err) throw err;
      self.remaining += files.length;
      files.forEach( (name) => {
        let filePath = path.join(dirPath, name);
        fs.stat(filePath, (err, stats) => {
          if (err) throw err;
          if (stats.isFile()) {
            fs.readFile(filePath, (err, content) => {
              if (err) throw err;
              self.remaining -= 1;
              callback({
                path: filePath,
                content: content
              });
            });
          } else if (stats.isDirectory()) {
            self.remaining -= 1;
            self.walk(filePath, callback);
          }
        });
      });
    });
  }
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
      let result = JSON.parse(body);
      if (res.statusCode >= 300) {
        // throw result.message;
        return console.error(result.message);
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
      auto_init: true
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

  makeTree (tree, callback) {
    const options = {
      auth: this.auth,
      method: 'POST',
      path: '/repos/' + this.username + '/' + this.repoName + '/git/trees',
    }
    request(options, {
      tree: tree
    }, callback);
  }

  commit (sha, callback) {
    const options = {
      auth: this.auth,
      method: 'POST',
      path: '/repos/' + this.username + '/' + this.repoName + '/git/commits',
    }
    request(options, {
      message: 'webtography this',
      tree: sha,
      committer: Committer
    }, callback);
  }

  getRefs (callback) {
    const options = {
      auth: this.auth,
      method: 'GET',
      path: '/repos/' + this.username + '/' + this.repoName + '/git/refs',
    }
    request(options, null, callback);
  }

  makeBranch (name, sha, callback) {
    const options = {
      auth: this.auth,
      method: 'POST',
      path: '/repos/' + this.username + '/' + this.repoName + '/git/refs',
    }
    request(options, {
      ref: 'refs/heads/' + name,
      sha: sha
    }, callback);
  }

  makeBlob (content, callback) {
    const options = {
      auth: this.auth,
      method: 'POST',
      path: '/repos/' + this.username + '/' + this.repoName + '/git/blobs',
    }
    request(options, {
      encoding: 'base64',
      content: new Buffer(content).toString('base64')
    }, callback);
  }

  ref (name, sha, callback) {
    const options = {
      auth: this.auth,
      method: 'PATCH',
      path: '/repos/' + this.username + '/' + this.repoName + '/git/refs/' + name,
    }
    request(options, {
      sha: sha
    }, callback);
  }

  editRepo (callback) {
    const options = {
      auth: this.auth,
      method: 'PATCH',
      path: '/repos/' + this.username + '/' + this.repoName,
    }
    request(options, {
      name: this.repoName,
      default_branch: 'gh-pages'
    }, callback);
  }

}
