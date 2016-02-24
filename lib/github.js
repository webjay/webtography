'use strict';

const request = require('./request.js');
const fs = require('fs');
const path = require('path');
const tmpdir = require('os').tmpdir;

module.exports = handler;

function handler (dirPath, username, token) {
  const basename = path.basename(dirPath);
  const repoName = 'Lorem-' + basename;
  const tmpDirPos = (tmpdir() + '/' + basename).length + 1;
  new Dirwalk(dirPath, (files) => {
    let gh = new Github(repoName, username, token);
    gh.makeRepo(() => {
      gh.blobster(tmpDirPos, files, (tree) => {
        gh.makeTree(tree, (data) => {
          gh.commit(data.sha, (data) => {
            gh.makeBranch('gh-pages', data.sha, () => {
              gh.editRepo(() => {});
            });
          });
        });
      });
    });
  });
}

class Dirwalk {
  constructor (dir, callback) {
    const self = this;
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
    const self = this;
    fs.readdir(dirPath, function (err, files) {
      if (err) throw err;
      self.remaining += files.length;
      files.forEach( (name) => {
        const filePath = path.join(dirPath, name);
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

const Committer = {
  name: 'LoremCMS',
  email: 'team@loremcms.com'
};

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
    };
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
  
  blobster (tmpDirPos, files, callback) {
    const self = this;
    let remaining = files.length;
    let fileObjs = [];
    files.forEach((fObj) => {
      self.makeBlob(fObj.content, (data) => {
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

  makeFile (name, buffer, callback) {
    const options = {
      auth: this.auth,
      method: 'PUT',
      path: '/repos/' + this.username + '/' + this.repoName + '/contents/' + name,
    };
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
    };
    request(options, {
      tree: tree
    }, callback);
  }

  commit (sha, callback) {
    const options = {
      auth: this.auth,
      method: 'POST',
      path: '/repos/' + this.username + '/' + this.repoName + '/git/commits',
    };
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
    };
    request(options, null, callback);
  }

  makeBranch (name, sha, callback) {
    const options = {
      auth: this.auth,
      method: 'POST',
      path: '/repos/' + this.username + '/' + this.repoName + '/git/refs',
    };
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
    };
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
    };
    request(options, {
      sha: sha,
      force: true
    }, callback);
  }

  editRepo (callback) {
    const options = {
      auth: this.auth,
      method: 'PATCH',
      path: '/repos/' + this.username + '/' + this.repoName,
    };
    request(options, {
      name: this.repoName,
      default_branch: 'gh-pages'
    }, callback);
  }

}
