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
      let body = '';
      request.on('data', (data) => {
        body += data;
        // keep it below 1mb
        if (body.length > 1e6) {
          response.writeHead(413);
          request.connection.destroy();
        }
      });
      request.on('end', _ => {
        const headers = request.headers;
        const isJSON = headers['content-type'].split(';')[0] === 'application/json';
        const data = (isJSON) ? JSON.parse(body) : qsParse(body);
        const urlObj = urlParse(data.url);
        if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
          response.writeHead(409);
          return defaultResponse(response);
        }
        const url = urlObj.protocol + '//' + urlObj.hostname + urlObj.pathname;
        if (!data.username || !data.token) {
          response.writeHead(409);
          return defaultResponse(response);
        }
        const gh = new Github(null, data.username, data.token);
        gh.rateLimit((result) => {
          if (result.rate === undefined) {
            response.writeHead(401);
            response.end('Bad credentials');
            return;
          }
          if (result.rate.remaining < 5) {
            return console.error('Rate limit', result);
          }
          response.writeHead(201);
          response.end('I got this: (' + url + '). Now go check your repos.\n');
          console.log('Working with', url, data.username, '...' + data.token.substr(-5));
          const dest = tmpdir() + '/' + urlObj.hostname;
          wget(url, (err, stdout, stderr) => {
            if (err && err.code !== 8) {
              return console.error(err, stderr);
            }
            // console.log(stdout);
            console.log('Pushing %s to github.com/%s', url, data.username);
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

const server = createServer(handler);

server.listen(Port, _ => {
  console.log('HTTP server listening on port', Port);
});

process.on('SIGTERM', _ => {
  server.close();
});
