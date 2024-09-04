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
function reloadWebsite() {
  axios.get(url)
    .then(response => {
      console.log(`Reloaded at ${new Date().toISOString()}: Status Code ${response.status}`);
    })
    .catch(error => {
      console.error(`Error reloading at ${new Date().toISOString()}:`, error.message);
    });
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
