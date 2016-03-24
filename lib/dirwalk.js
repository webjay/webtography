'use strict';

const fs = require('fs');
const pathJoin = require('path').join;

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
      if (err) {
        console.error(err);
        return callback();
      }
      this.remaining += files.length;
      for (let name of files) {
        let filePath = pathJoin(dirPath, name);
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

module.exports = Dirwalk;
