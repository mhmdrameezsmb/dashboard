const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const adminRoutes = require('./routes/admin');

const app = express();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/gym-admin-panel', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Set EJS as the view engine
app.set('view engine', 'ejs');
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
