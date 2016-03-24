'use strict';

const tmpdir = require('os').tmpdir;
const pathBasename = require('path').basename;
const Dirwalk = require('./dirwalk.js');
const Github = require('./github.js');

module.exports = function (dirPath, username, token, branch) {
  const basename = pathBasename(dirPath);
  const repoName = 'Lorem-' + basename;
  const tmpDirPos = (tmpdir() + '/' + basename).length + 1;
  if (branch === undefined) {
    branch = 'master';
  }
  new Dirwalk(dirPath, (files) => {
    if (files.length === 1) return;
    const gh = new Github(repoName, username, token, branch);
    gh.makeRepo(_ => {
      gh.commits((data) => {
        const parents = (data[0] !== undefined) ? [data[0].sha] : null;
        gh.blobster(tmpDirPos, files, (tree) => {
          gh.makeTree(tree, (data) => {
            gh.commit(parents, data.sha, (data) => {
              gh.makeBranch(data.sha, _ => {
                gh.editRepo(_ => {});
                gh.ref(branch, data.sha, _ => {
                  console.log('Done with %s/%s', username, repoName);
                });
              });
            });
          });
        });
      });
    });
  });
};
