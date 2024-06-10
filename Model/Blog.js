const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the section schema
const sectionSchema = new Schema({
    subHeader: {
        type: String,
    },
    description: {
        type: String,
    }
});

// Define the blog schema
const blogSchema = new Schema({
    header: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    imageCaption: {
        type: String,
    },
    introduction: {
        type: String,
        required: true
    },
    sections: [sectionSchema],
    male: {
        type: Boolean,
        required: true
    }
});

const blog = new Schema({
  blogs:[blogSchema]
})

// Create a model using the schema
const Blog = mongoose.model('Blog', blog);

module.exports = Blog;
