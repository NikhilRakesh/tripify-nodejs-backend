// models/photo.js
const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  src: {
    type: String,
    required: true
  },
  caption: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Photo = mongoose.model('Photo', photoSchema);

module.exports = Photo;
