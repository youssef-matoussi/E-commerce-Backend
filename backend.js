const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const path = require('path');
const cron = require('node-cron');  // Import node-cron
const axios = require('axios');  // Import axios for making HTTP requests

const authRoutes = require('./routes/authRoutes');
const ProductRoutes = require('./routes/ProductRoutes');
const ProfilRoutes = require('./routes/ProfilRoutes');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: ['http://localhost:4200', 'http://192.168.0.100:4200'] }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from "uploads" directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api', authRoutes);
app.use('/api', ProductRoutes);  // For upload product routes
app.use('/api', ProfilRoutes);  // For upload product routes

const server = http.createServer(app);
server.listen(port, '0.0.0.0', () => console.log(`Server running on port ${port}`));

// =======================
//   KEEP-ALIVE SERVICE
// =======================

// Define your Render backend URL
const serverURL = `https://e-commerce-backend-a46t.onrender.com`;  // Replace with your actual Render URL

// Schedule a cron job to run every 5 minutes
// cron.schedule('*/5 * * * *', async () => {
//     try {
//         console.log('Sending keep-alive ping...');
//         await axios.get(serverURL);
//         console.log('Keep-alive ping successful ✅');
//     } catch (error) {
//         console.error('Error sending keep-alive ping:', error.message);
//     }
// });
