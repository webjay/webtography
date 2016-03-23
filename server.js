'use strict';

const createServer = require('http').createServer;
const qsParse = require('querystring').parse;
const Github = require('./lib/github.js');
const wget = require('./lib/wget.js');
const pusher = require('./lib/pusher.js');
const urlParse = require('url').parse;
const tmpdir = require('os').tmpdir;

const Port = process.env.PORT || 3000;

function defaultResponse (response) {
  response.end('Please POST me a url, username and GitHub token');
}

function handler (request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
  response.setHeader('Access-Control-Allow-Headers', 'accept, origin, content-type');
  switch (request.method) {
    case 'OPTIONS':
      response.end();
      break;
    case 'POST':
      var body = '';
      request.on('data', (data) => {
        body += data;
        // keep it below 1mb
        if (body.length > 1e6) {
          response.writeHead(413);
          request.connection.destroy();
        }
      });
      request.on('end', () => {
        const headers = request.headers;
        const isJSON = headers['content-type'].split(';')[0] === 'application/json';
        const data = (isJSON) ? JSON.parse(body) : qsParse(body);
        if (!data.url || !data.username || !data.token) {
          response.writeHead(409);
          return defaultResponse(response);
        }
        response.writeHead(201);
        response.end('I got this: (' + data.url + '). Now go check your repos.\n');
        const gh = new Github(null, data.username, data.token);
        gh.rateLimit((result) => {
          if (result.rate.remaining < 5) {
            return console.error('Rate limit', result);
          }
          console.log('Working with', data.url, data.username, '...' + data.token.substr(-5));
          const dest = tmpdir() + '/' + urlParse(data.url, false, true).hostname;
          wget(data.url, (err) => {
            if (err && err.code !== 8) {
              return console.error(err);
            }
            console.log('Pushing %s to github.com/%s', data.url, data.username);
            pusher(dest, data.username, data.token, data.branch);
          });
        });
      });
      break;
    default:
      defaultResponse(response);
      break;
  }
}

createServer(handler).listen(Port, () => {
  console.log('HTTP server listening on port', Port);
});
