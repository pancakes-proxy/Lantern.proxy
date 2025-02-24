const express = require('express');
const http = require('http');
const httpProxy = require('http-proxy');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const dns = require('dns');

const app = express();
const proxy = httpProxy.createProxyServer({
    changeOrigin: true,
    secure: false,
    timeout: 120000, // Increase timeout to 120 seconds
    proxyTimeout: 120000,
    resolve: true, // Enable DNS resolution
    dnsPrefetch: true,
    keepAlive: true
});

// Force the use of IPv4
dns.setDefaultResultOrder('ipv4first');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors()); // Enable CORS for all routes

app.get('/', (req, res) => {
    console.log('GET request received at /');
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/browse', (req, res) => {
    const targetUrl = req.body.url;
    console.log(`Received POST request to /browse with target URL: ${targetUrl}`);

    const options = {
        target: targetUrl,
        headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0'
        }
    };
    console.log(`Proxying request to: ${targetUrl}`);

    function proxyRequest(retries, delay) {
        proxy.web(req, res, options, (err) => {
            if (err) {
                console.error(`Error occurred while proxying request: ${err.message}`);
                if (err.code) {
                    console.error(`Error code: ${err.code}`);
                }
                if (err.stack) {
                    console.error(`Error stack: ${err.stack}`);
                }
                if (retries > 0) {
                    console.log(`Retrying request... (${retries} retries left)`);
                    setTimeout(() => {
                        proxyRequest(retries - 1, delay * 2); // Exponential backoff
                    }, delay);
                } else {
                    res.status(500).send(`Failed to proxy request. Error: ${err.message}`);
                }
            } else {
                console.log('Request successfully proxied.');
                res.status(200).send('Request successfully proxied.');
            }
        });
    }

    proxyRequest(3, 5000); // Retry up to 3 times with an initial delay of 5 seconds
});

const server = http.createServer(app);

server.listen(3000, () => {
    console.log('Proxy server is running on http://localhost:3000');
});

