const mongoose = require('mongoose');

const checkOutSchema = new mongoose.Schema(
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

const CheckOut = mongoose.model('CheckOut', checkOutSchema);

module.exports = CheckOut;
