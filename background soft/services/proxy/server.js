const express = require('express');
const http = require('http');
const httpProxy = require('http-proxy');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const proxy = httpProxy.createProxyServer({});

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/browse', (req, res) => {
    const targetUrl = req.body.url;
    proxy.web(req, res, { target: targetUrl }, (err) => {
        res.status(500).send('Error occurred while proxying request');
    });
});

const server = http.createServer(app);

server.listen(3000, () => {
    console.log('Proxy server is running on http://localhost:3000');
});
