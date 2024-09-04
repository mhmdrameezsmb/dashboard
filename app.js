const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');   

const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const axios = require('axios');


const url = `https://alsangymdashboard.onrender.com/test`;
const interval = 900000; // Interval in milliseconds (15 minutes)

const headersArray = [
  {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
  },
  {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },
  {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1'
  },
  {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
  },
  {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Mobile Safari/537.36'
  },
  {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_4_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
  },
  {
    'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1'
  },
  {
    'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0'
  },
  {
    'User-Agent': 'Mozilla/5.0 (Linux; U; Android 9; en-us; Nexus 5 Build/LMY48B) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30'
  },
  {
    'User-Agent': 'Mozilla/5.0 (Windows Phone 10.0; Android 6.0.1; Microsoft; Lumia 950) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Mobile Safari/537.36 Edge/15.14977'
  }
];

let headerIndex = 0;

function reloadWebsite() {
  const headers = headersArray[headerIndex];

  axios.get(url, { headers })
    .then(response => {
      console.log(`Reloaded at ${new Date().toISOString()}: Status Code ${response.status} with Header Index ${headerIndex}`);
    })
    .catch(error => {
      console.error(`Error reloading at ${new Date().toISOString()}:`, error.message);
    });

  headerIndex = (headerIndex + 1) % headersArray.length; // Cycle through headers
}

setInterval(reloadWebsite, interval);


// Connect to MongoDB
mongoose.connect('mongodb+srv://rameez:0@cluster0.xnqwvnx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0l', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

// Use the admin routes
app.use('/admin', (req, res, next) => {
    req.io = io;
    next();
}, adminRoutes);

// Base route to render dashboard
app.get('/', (req, res) => {
    res.redirect('/admin/dashboard');
});

// Test route to verify the API is working
app.get('/test', (req, res) => {
    res.status(200).json({ message: 'Web Site is Working!' });
});

// Handle 404 errors
app.use((req, res) => {
    res.status(404).send('Page Not Found');
});

// Start the server
server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});

let connectedUsers = 0;

io.on('connection', (socket) => {
  connectedUsers++;
  console.log('A user connected. Total connected users:', connectedUsers);

  socket.on('disconnect', () => {
    connectedUsers--;
    console.log('A user disconnected. Total connected users:', connectedUsers);
  });
});

// Export io for use in routes
module.exports = io;
