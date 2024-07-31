const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  name: String,
  joinDate: Date,
  feesPaid: Boolean,
  paymentHistory: [{
    month: Number,
    year: Number,
    paid: Boolean
  }]
});

module.exports = mongoose.model('Member', memberSchema);
