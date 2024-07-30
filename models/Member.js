const mongoose = require('mongoose');


const memberSchema = new mongoose.Schema({
  name: String,
  joinDate: Date,
  feesPaid: Boolean,
  completed: { type: Boolean, default: false } // Add this line
});

module.exports = mongoose.model('Member', memberSchema);

  

module.exports = mongoose.model('Member', memberSchema);
