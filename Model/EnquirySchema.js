const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const enquirySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true, // Remove any trailing spaces
    minlength: 2, // Minimum length for the name
    maxlength: 100 // Maximum length for the name
  },
  phone: {
    type: String,
    required: true,
    trim: true, 
    minlength:10,
    maxlength:10,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true 
  },
  status: {
    type: Boolean,
    default: false 
  },
  expiresAt: {
    type: Date,
    index: { expires: '1m' } 
  }
});

const Enquiry = mongoose.model('Enquiry', enquirySchema);

module.exports = Enquiry;
