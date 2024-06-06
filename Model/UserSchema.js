const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the user schema
const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true // Ensures that usernames are unique
  },
  password: {
    type: String,
    required: true
  }
});

// Create a model using the schema
const User = mongoose.model('User', UserSchema);

module.exports = User;
