const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    name: String,
    joinDate: Date,
    feesPaid: Boolean,
    completed: {
      type: Boolean,
      default: false
    }
  });
  

module.exports = mongoose.model('Member', memberSchema);
