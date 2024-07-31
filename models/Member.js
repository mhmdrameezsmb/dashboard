const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  joinDate: {
    type: Date,
    required: true
  },
  feesPaid: {
    type: Boolean,
    required: true
  }
});

module.exports = mongoose.model('Member', memberSchema);
