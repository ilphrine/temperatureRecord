// Get dependencies
const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
//require('./getTemperature');

// Get the API routes
const api = require('./routes/api');

const app = express();
// Get port from environment and store in Express.
const port = process.env.PORT || '8000';
// Create HTTP server.
const server = http.createServer(app);


// Parsers for POST data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));

// Point static path to dist
app.use(express.static(path.join(__dirname, '../dist/')));

// Set the api routes
app.use('/api', api);

// Catch all other routes and return the index file
app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.get('/query', (req, res) => {
	// Query your redis dataset here
	console.log(req);
	// client.get('data', (err, reply) => {
	// 	// Handle errors if they occur
	// 	if (err) {
	// 		throw err;
	// 		res.status(500).end();
	// 	} else { // You could send a string
	// 		res.send(reply.toString());
	// 	}
	// 	// or json
	// 	// res.json({ data: reply.toString() });
	// });
});

app.set('port', port);

// Listen on provided port, on all network interfaces.
server.listen(port, () => console.log(`API running on http://130.120.230.169:${port}`));
