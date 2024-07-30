const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  name: String,
  joinDate: Date,
  feesPaid: Boolean,
});

module.exports = mongoose.model('Member', memberSchema);
