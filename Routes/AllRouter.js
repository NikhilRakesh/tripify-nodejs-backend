const express = require("express");
const router = express.Router();
const Blog = require("../Model/Blog");
const enquirySchema = require("../Model/EnquirySchema");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cron = require('node-cron');


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Specify the destination directory
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname); // Generate a unique filename
  }
});

const upload = multer({ storage: storage });

// create blog for male
router.post("/blog", upload.any(), async (req, res) => {
  try {

    const blogs = Object.values(JSON.parse(JSON.stringify(req.body)));


    const savedBlogs = await Promise.all(blogs.map(async (blogData, index) => {
      const file = req.files.find(f => f.fieldname === `${index}[image]`);
      if (file) {
        blogData.image = `https://tripifyme.in:/uploads/${file.filename}`;
      }

      blogData.sections = blogData.sections ? blogData.sections.map(section => ({
        subHeader: section.subHeader || '',
        description: section.description || ''
      })) : [];

      // Convert `male` to a boolean value
      blogData.male = blogData.male === 'true'; // Convert 'true' string to true, and 'false' string to false
      console.log(typeof (blogData.introduction));
      blogData.introduction = String(blogData.introduction);
      blogData.author = String(blogData.author);
      blogData.header = String(blogData.header);

      return blogData;
    }));

    const newBlog = new Blog({ blogs: savedBlogs });

    await newBlog.save();
    res.status(201).json();
  } catch (error) {
    console.error("Error saving blog:", error);
    res.status(500).json({ message: "Error saving blog" });
  }
});


// all blogs
router.get("/blog", async (req, res) => {
  try {
    const blogs = await Blog.find({});

    res.status(200).json(blogs);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ message: "Error fetching blogs" });
  }
});

// delete blogs
router.delete("/blog/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedBlog = await Blog.findByIdAndDelete(id);

    if (!deletedBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ message: "Error deleting blog" });
  }
});

// save enquiry
router.post("/enquiry", async (req, res) => {
  try {
    const { name, phone } = req.body;
    // Create a new enquiry
    const newEnquiry = new enquirySchema({ name, phone });
    await newEnquiry.save();

    res.status(201).json({ message: "Enquiry submitted successfully!" });
  } catch (error) {
    console.error("Error submitting enquiry:", error);
    res.status(500).json({ message: "Error submitting enquiry" });
  }
});

// find all enquiry
router.get("/enquiry", async (req, res) => {
  try {
    const enquiries = await enquirySchema.find({});
    res.status(200).json(enquiries);
  } catch (error) {
    console.error("Error fetching enquiries:", error);
    res.status(500).json({ message: "Error fetching enquiries" });
  }
});

// complete the enquiry
router.put("/enquiry/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const enquiry = await enquirySchema.findById(id);

    if (!enquiry) {
      return res.status(404).json({ message: "Enquiry not found" });
    }

    enquiry.status = true;
    enquiry.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await enquiry.save();

    res.status(200).json({ message: "Enquiry status updated successfully" });
  } catch (error) {
    console.error("Error updating enquiry status:", error);
    res.status(500).json({ message: "Error updating enquiry status" });
  }
});

// find blog using id
router.get("/blog/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.status(200).json(blog);
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).json({ message: "Error fetching blog" });
  }
});

// admin-login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (username === "tripifyme@admin" && password === "n{aM-67$(_8&*") {
      res.json({ success: true, message: "Admin login successful" });
    } else {
      res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });
    }
  } catch (error) {
    console.error("Error fetching login:", error);
    res.status(500).json({ message: "Error fetching login" });
  }
});

// Schedule the job to run every day at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    const result = await enquirySchema.deleteMany({ status: true, expiresAt: { $lte: new Date() } });
    console.log(`${result.deletedCount} expired enquiries deleted.`);
  } catch (error) {
    console.error('Error deleting expired enquiries:', error);
  }
});


module.exports = router;
