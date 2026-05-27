const mongoose = require('mongoose');

const processedEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const ProcessedEvent = mongoose.model('ProcessedEvent', processedEventSchema);

module.exports = ProcessedEvent;
