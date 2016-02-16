'use strict';

const createServer = require('http').createServer;
const qs = require('querystring');
const worker = require('./worker.js');

const Port = process.env.PORT || 3000; 

function handler (request, response) {
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
			response.end('I got this: ' + post.url);
			worker(post.url, post.username, post.token);
		});
	} else {
		response.end('Please POST me a url');
	}
}

const server = createServer(handler);

server.listen(Port, () => {
	console.log(`HTTP server listening on ${Port}`);
});
