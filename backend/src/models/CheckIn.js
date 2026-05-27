const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    time: {
      type: Date,
      required: true,
      default: Date.now,
    },
    imagePath: {
      type: String,
      default: null,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const CheckIn = mongoose.model('CheckIn', checkInSchema);

module.exports = CheckIn;
