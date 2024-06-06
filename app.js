require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const port = 8000; 
const  bodyParser = require("body-parser");
const mongoose = require('mongoose');
const morgan = require('morgan')
const routers = require('./Routes/AllRouter')
const path = require('path');

app.use(cors({
    credentials: true,
origin:[
    "http://localhost:5173",  
      "http://localhost",
      "https://tripifyme.in:8000",
      "https://tripifyme.in"
]
}));

app.use(express.json()); 
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(morgan("dev"));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api',routers)
const dbURI = process.env.DB_URI; 
console.log('DB_URI:', dbURI);

// test api
app.get('/', (req, res) => {
  res.send('Hello, its tripify!');
});  


mongoose.connect(dbURI)
  .then(() => {
    console.log('Database connected');
    app.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Error connecting to the database:', err);
  });
