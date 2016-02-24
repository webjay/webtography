'use strict';

const createServer = require('http').createServer;
const qs = require('querystring');
const worker = require('./worker.js');

const Port = process.env.PORT || 3000;

function defaultResponse (response) {
  response.end('Please POST me a url, username and token');
}

function handler (request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
  if (request.method === 'POST') {
    var body = '';
    request.on('data', (data) => {
      body += data;
      // keep it below 1mb
      if (body.length > 1e6) {
        request.connection.destroy();
      }
    });
    request.on('end', () => {
      const post = qs.parse(body);
      if (!post.url || !post.username || !post.token) {
        return defaultResponse(response);
      }
      response.end('I got this: ' + post.url);
      worker(post.url, post.username, post.token);
    });
  } else {
    defaultResponse(response);
  }
}

createServer(handler).listen(Port, () => {
  console.log('HTTP server listening on port ' + Port);
});
