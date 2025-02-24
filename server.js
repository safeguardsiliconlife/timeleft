const express = require('express');
const path = require('path');
const fs = require('fs');
const net = require('net');

const app = express();
const port = 3017;

// Array of allowed IP addresses (including private IP ranges and localhost)
const allowedIPs = [
    '127.0.0.1',
];




// Middleware to check if the client's IP is allowed
const ipFilter = (req, res, next) => {
    let clientIP = req.ip || req.connection.remoteAddress;

    // Convert IPv6 localhost to IPv4
    if (clientIP === '::1') {
        clientIP = '127.0.0.1';
    }
    // Convert IPv6 to IPv4 if it's an IPv4-mapped IPv6 address
    else if (clientIP.substr(0, 7) === '::ffff:') {
        clientIP = clientIP.substr(7);
    }

    // Check if the IP is a valid IPv4 address
    if (!net.isIPv4(clientIP)) {
        return res.status(403).send('Invalid IP Address');
    }

    const isAllowed = allowedIPs.some(ip => {
        if (ip.includes('/')) {
            // It's a CIDR notation, we need to check if the client IP is in this range
            const [base, bits] = ip.split('/');
            const mask = ~(2 ** (32 - bits) - 1);
            const baseInt = ipToInt(base);
            const clientInt = ipToInt(clientIP);
            return (baseInt & mask) === (clientInt & mask);
        } else {
            // It's a single IP address
            return clientIP === ip;
        }
    });

    if (isAllowed) {
        next();
    } else {
        res.status(403).send('Access Denied');
    }
};

// Helper function to convert IP to integer
function ipToInt(ip) {
    return ip.split('.').reduce((int, oct) => (int << 8) + parseInt(oct, 10), 0) >>> 0;
}

// Apply IP filter middleware to all routes
app.use(ipFilter);

// Set correct MIME type for CSS files
app.use('/css', (req, res, next) => {
    res.type('text/css');
    next();
});

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Serve the HTML file for the clock
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'views/large_clock_display.html');
    fs.readFile(filePath, 'utf8', (err, content) => {
        if (err) {
            res.status(500).send('Error loading the file');
        } else {
            res.send(content);
        }
    });
});

// Add new route for time visualization
app.get('/visualize', (req, res) => {
    const filePath = path.join(__dirname, 'views/time_visualization.html');
    fs.readFile(filePath, 'utf8', (err, content) => {
        if (err) {
            res.status(500).send('Error loading the file');
        } else {
            res.send(content);
        }
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
