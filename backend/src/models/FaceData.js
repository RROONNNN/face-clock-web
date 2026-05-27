const mongoose = require('mongoose');

const faceDataSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    updatedTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    listFaceEmbedding: {
      type: [[Number]],
      required: true,
      default: [],
    },
    imageUrl: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const FaceData = mongoose.model('FaceData', faceDataSchema);

module.exports = FaceData;
