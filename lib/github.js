'use strict';

const request = require('./request.js');

const Committer = {
  name: 'LoremCMS',
  email: 'team@loremcms.com'
};

function microTime () {
  const hrtime = process.hrtime();
  return hrtime[0] * 1000000 + hrtime[1] / 1000;
}

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
    const taskCount = files.length;
    this.queue = _ => {
      const fObj = files.shift();
      const mTime = microTime();
      this.makeBlob(fObj.content, (data) => {
        console.log('Created blob', fObj.path.substr(tmpDirPos));
        fileObjs.push({
          path: fObj.path.substr(tmpDirPos),
          mode: '100644',
          type: 'blob',
          sha: data.sha
        });
        if (fileObjs.length === taskCount) {
          callback(fileObjs);
        } else {
          setTimeout(this.queue.bind(this), 1000 - (microTime() - mTime));
        }
      });
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
      sha: sha
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

  rateLimit (callback) {
    const options = {
      auth: this.auth,
      method: 'GET',
      path: '/rate_limit',
    };
    request(options, null, callback);
  }

}

module.exports = Github;
