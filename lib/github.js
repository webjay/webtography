'use strict';

const request = require('./request.js');
const fs = require('fs');
const path = require('path');
const tmpdir = require('os').tmpdir;

module.exports = handler;

function handler (dirPath, username, token, branch) {
  const basename = path.basename(dirPath);
  const repoName = 'Lorem-' + basename;
  const tmpDirPos = (tmpdir() + '/' + basename).length + 1;
  if (branch === undefined) {
    branch = 'master';
  }
  new Dirwalk(dirPath, (files) => {
    let gh = new Github(repoName, username, token, branch);
    gh.makeRepo(_ => {
      gh.commits((data) => {
        const parents = (data.length !== 0) ? [data[0].sha] : null;
        gh.blobster(tmpDirPos, files, (tree) => {
          gh.makeTree(tree, (data) => {
            gh.commit(parents, data.sha, (data) => {
              gh.makeBranch(data.sha, _ => {
                gh.editRepo(_ => {});
                gh.ref(branch, data.sha, _ => {});
              });
            });
          });
        });
      });
    });
  });
}

class Dirwalk {
  constructor (dir, callback) {
    this.remaining = 0;
    this.fileObjs = [];
    this.walk(dir, (fileObj) => {
      this.fileObjs.push(fileObj);
      if (this.remaining === 0) {
        return callback(this.fileObjs);
      }
    });
  }
  walk (dirPath, callback) {
    fs.readdir(dirPath, (err, files) => {
      if (err) throw err;
      this.remaining += files.length;
      for (const name of files) {
        const filePath = path.join(dirPath, name);
        fs.stat(filePath, (err, stats) => {
          if (err) throw err;
          if (stats.isFile()) {
            fs.readFile(filePath, (err, content) => {
              if (err) throw err;
              this.remaining -= 1;
              callback({
                path: filePath,
                content: content
              });
            });
          } else if (stats.isDirectory()) {
            this.remaining -= 1;
            this.walk(filePath, callback);
          }
        });
      }
    });
  }
}

const Committer = {
  name: 'LoremCMS',
  email: 'team@loremcms.com'
};

class Github {

  constructor (repoName, username, token, branch) {
    this.repoName = repoName;
    this.username = username;
    this.auth = username + ':' + token;
    this.branch = branch;
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
    let fileObjs = [];
    const limit = 2;
    let running = 0;
    const taskCount = files.length;
    this.queue = _ => {
      while (running < limit && files.length > 0) {
        let fObj = files.shift();
        running++;
        console.log('Creating blob', fObj.path.substr(tmpDirPos));
        this.makeBlob(fObj.content, (data) => {
          fileObjs.push({
            path: fObj.path.substr(tmpDirPos),
            mode: '100644',
            type: 'blob',
            sha: data.sha
          });
          if (fileObjs.length === taskCount) {
            callback(fileObjs);
          } else {
            running--;
            this.queue();
          }
        });
      }
    };
    this.queue();
  }

  makeFile (name, buffer, callback) {
    const options = {
      auth: this.auth,
      method: 'PUT',
      path: '/repos/' + this.username + '/' + this.repoName + '/contents/' + name,
    };
    request(options, {
      path: name,
      message: 'webtography',
      content: buffer.toString('base64'),
      branch: this.branch,
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

  commits (callback) {
    const options = {
      auth: this.auth,
      method: 'GET',
      path: '/repos/' + this.username + '/' + this.repoName + '/commits',
    };
    request(options, {
      sha: this.branch
    }, callback);
  }

  commit (parents, sha, callback) {
    const options = {
      auth: this.auth,
      method: 'POST',
      path: '/repos/' + this.username + '/' + this.repoName + '/git/commits',
    };
    request(options, {
      message: 'webtography',
      tree: sha,
      parents: parents,
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

  makeBranch (sha, callback) {
    const options = {
      auth: this.auth,
      method: 'POST',
      path: '/repos/' + this.username + '/' + this.repoName + '/git/refs',
    };
    request(options, {
      ref: 'refs/heads/' + this.branch,
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
      path: '/repos/' + this.username + '/' + this.repoName + '/git/refs/heads/' + name,
    };
    request(options, {
      sha: sha,
      // force: true
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
      default_branch: this.branch
    }, callback);
  }

}
