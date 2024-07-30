const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const adminRoutes = require('./routes/admin');

const app = express();

// Connect to MongoDB
mongoose.connect('mongodb+srv://rameez:0@cluster0.xnqwvnx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0l', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB:', err);
});

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files (including service-worker.js)
app.use(express.static(path.join(__dirname, 'public')));

// Parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Use the admin routes
app.use('/admin', adminRoutes);

// Base route to render dashboard
app.get('/', (req, res) => {
  res.redirect('/admin/dashboard');
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).send('Page Not Found');
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
