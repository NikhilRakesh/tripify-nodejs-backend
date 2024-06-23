const express = require("express");
const router = express.Router();
const Blog = require("../Model/Blog");
const enquirySchema = require("../Model/EnquirySchema");
const PhotoGallerySchema = require("../Model/PhotoGallerySchema");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const axios = require('axios');
const uniqid = require('uniqid');
const store = require('store2');

const transporter = nodemailer.createTransport({
  service: 'gmail', // Use your email service (e.g., 'gmail', 'outlook', etc.)
  auth: {
    user: 'tripifymeenquiry@gmail.com',
    pass: 'mhvh irwx myvd btfq',
  },
});

const merchantId = 'YOUR_MERCHANT_ID';
const saltKey = 'YOUR_SALT_KEY';
const phonePeUrl = 'https://api.phonepe.com/apis/hermes/payments/initiate';


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
        blogData.image = `https://tripifyme.in/uploads/${file.filename}`;
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

    const newEnquiry = new enquirySchema({ name, phone });
    await newEnquiry.save();

    const mailOptions = {
      from: 'tripifymeenquiry@gmail.com',
      to: 'sale@tripifyme.com', // The recipient's email address
      subject: 'New Enquiry Received',
      text: `You have received a new enquiry from:\n\nName: ${name}\nPhone: ${phone}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ message: 'Enquiry submitted but email not sent' });
      }
      console.log('Email sent:', info.response);
      res.status(201).json({ message: 'Enquiry submitted successfully!' });
    });

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
router.delete("/enquiry/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const enquiry = await enquirySchema.findByIdAndDelete(id);

    if (!enquiry) {
      return res.status(404).json({ message: "Enquiry not found" });
    }

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

router.post('/initiatePayment', (req, res) => {
  console.log('initiatePayment');
  const { amount } = req.body;
  const transactionId = 'txn_' + new Date().getTime();
  const callbackUrl = 'http://localhost:5173/api/paymentCallback';

  const payload = {
    merchantId,
    transactionId,
    amount,
    callbackUrl,
  };

  const payloadString = JSON.stringify(payload);
  const checksum = crypto.createHash('sha256').update(payloadString + saltKey).digest('hex');

  res.json({
    url: phonePeUrl,
    payload: payloadString,
    checksum,
  });
});

router.post('/paymentCallback', (req, res) => {
  console.log('paymentCallback');
  const response = req.body;
  const receivedChecksum = req.headers['x-checksum'];

  const responsePayloadString = JSON.stringify(response);
  const calculatedChecksum = crypto.createHash('sha256').update(responsePayloadString + saltKey).digest('hex');

  if (receivedChecksum === calculatedChecksum) {
    // Handle payment success or failure
    res.status(200).send('Payment verified successfully');
  } else {
    res.status(400).send('Checksum verification failed');
  }
});

router.post('/photos', upload.single('image'), async (req, res) => {
  try {
    const { caption } = req.body;

    const photoPath = `https://tripifyme.in/uploads/${req.file.filename}`;

    const newPhoto = new PhotoGallerySchema({
      src: photoPath,
      caption
    });

    await newPhoto.save();

    res.status(201).json({ message: 'Photo uploaded successfully', newPhoto });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ message: 'Failed to upload photo' });
  }
});

router.get('/photos', async (req, res) => {
  try {
    const photos = await PhotoGallerySchema.find();
    res.status(200).json(photos);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ message: 'Failed to fetch photos' });
  }
});

router.delete('/photos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Find the photo by ID and delete it
    const photo = await PhotoGallerySchema.findByIdAndDelete(id);

    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    const filePath = path.join(__dirname, '..', 'uploads', path.basename(photo.src));
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('Failed to delete file:', err);
      }
    });

    res.status(200).json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ message: 'Failed to delete photo' });
  }
});

router.post('/createTransaction', async (req, res) => {
  const { amount, userId, name } = req.body;

  const PHONEPE_MERCHANT_ID = 'M22OQET3GXNNO';
  const PHONEPE_SALT_KEY = 'b0e9efc3-a561-41f8-94e7-022588e8e6f6';
  // const PHONEPE_API_URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox ';
  const PHONEPE_API_URL = 'https://api.phonepe.com/apis/hermes';
  const PHONEPE_KEY_INDEX = 1;


  let tx_uuid = uniqid();
  store.set('uuid', { tx: tx_uuid });
  
  let normalPayLoad = {
    merchantId: PHONEPE_MERCHANT_ID,
    merchantTransactionId: tx_uuid,
    merchantUserId: userId,
    name: name,
    amount: amount * 100, // Amount in paise
    redirectUrl: "https://tripifyme.in/api/paymentSuccess",
    redirectMode: "POST",
    mobileNumber: "8891268078",
    paymentInstrument: {
      type: "PAY_PAGE"
    }
  };

  let bufferObj = JSON.stringify(normalPayLoad);
  let base64String = Buffer.from(bufferObj).toString("base64");

  let string = base64String + '/pg/v1/pay' + PHONEPE_SALT_KEY;

  let sha256_val = crypto.createHash('sha256').update(string).digest('hex');
  let checksum = sha256_val + '###' + PHONEPE_KEY_INDEX;

  axios.post(`${PHONEPE_API_URL}/pg/v1/pay`, {
    request: base64String
  }, {
    headers: {
      'Content-Type': 'application/json',
      'X-VERIFY': checksum,
      'accept': 'application/json'
    }
  }).then(function (response) {
    console.log('Response:', response.data);
    if (response.data.success && response.data.data && response.data.data.instrumentResponse && response.data.data.instrumentResponse.redirectInfo) {
      res.json({
        success: true,
        data: {
          paymentUrl: response.data.data.instrumentResponse.redirectInfo.url
        }
      });
    } else {
      res.json({ success: false, message: 'Failed to get redirect URL from PhonePe' });
    }
  }).catch(function (error) {
    console.error('Error in createTransaction:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    res.status(500).json({ error: error.message, details: error.response?.data });
  });
});


module.exports = router;   
