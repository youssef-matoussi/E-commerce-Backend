const multer = require('multer');
const path = require('path');
const pool = require('../config/db');
const express = require('express');
const fs = require('fs');

const baseUrl = 'http://localhost:3000'; // Adjust if needed
const app = express();

const cors = require('cors');
app.use(cors({ origin: 'http://localhost:4200' }));


// Set up storage for image uploads using multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Get values from the request body to define the folder structure
        const { gender, category, section, subcategory } = req.body;

        // Define the dynamic folder structure
        const folderPath = `./uploads/products/${gender}/${category}/${section}/${subcategory}`;

        // Check if the folder exists, if not, create it
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true }); // Create the folder structure
        }

        // Specify the destination folder
        cb(null, folderPath); // Destination for the file upload
    },
    filename: (req, file, cb) => {
        // Create the filename using the timestamp
        cb(null, Date.now() + path.extname(file.originalname)); // Filename will be timestamp + extension
    }
});


const generateUniqueReference = async () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let reference;
    let exists = true;
    let length = 5; // Start with 5-character references

    while (exists) {
        reference = '#' + Array.from({ length }, () => characters[Math.floor(Math.random() * characters.length)]).join('');

        // Check if the reference already exists
        const [rows] = await pool.query('SELECT reference FROM products WHERE reference = ?', [reference]);
        exists = rows.length > 0;

        // If all 5-character references are used, increase length to 6
        if (!exists) {
            const totalPossibleRefs = Math.pow(36, length); // 36^5
            const [countRows] = await pool.query('SELECT COUNT(*) as count FROM products');
            if (countRows[0].count >= totalPossibleRefs) {
                length = 6;
            }
        }
    }

    return reference;
};


// const upload = multer({ storage: storage }).single('image'); // 'image' is the key for the uploaded file

const upload = multer({ storage: storage }).array('image', 5); // 'images' is the field name


// Controller to upload product details
// exports.uploadProduct = async (req, res) => {
//     upload(req, res, async (err) => {
//         if (err) {
//             return res.status(500).json({ error: 'Failed to upload image', details: err });
//         }

//         // Extracting product details from the request body
//         const { name, description, gender, category, section, subcategory, price, sizeXS, sizeS, sizeM, sizeL, sizeXL, sizeXXL } = req.body;

//         // Check if the essential fields are present
//         if (!name || !description || !gender || !category || !section || !subcategory || !price || !sizeXS || !sizeS || !sizeM || !sizeL || !sizeXL || !sizeXXL) {
//             return res.status(400).json({ error: 'Please provide all product details' });
//         }

//         // Get the image URL (relative path after saving the file)
//         // const image = req.file ? `/uploads/products/${gender}/${category}/${section}/${subcategory}/${req.file.filename}` : null;

//         const imageUrls = req.files.map(file => `/uploads/products/${gender}/${category}/${section}/${subcategory}/${file.filename}`);

//         // Save product details to the database

//         // try {
//         //     await pool.query(
//         //         'INSERT INTO products (name, image, description, gender, category, section, subcategory, price, sizeXS, sizeS, sizeM, sizeL, sizeXL, sizeXXL) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
//         //         [name, image, description, gender, category, section, subcategory, price, sizeXS, sizeS, sizeM, sizeL, sizeXL, sizeXXL]
//         //     );

//         try {
//             await pool.query(
//                 'INSERT INTO products (name, image, description, gender, category, section, subcategory, price, sizeXS, sizeS, sizeM, sizeL, sizeXL, sizeXXL) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
//                 [name, JSON.stringify(imageUrls), description, gender, category, section, subcategory, price, sizeXS, sizeS, sizeM, sizeL, sizeXL, sizeXXL]
//             );

//             // Send response
//             res.status(201).json({ message: 'Product uploaded successfully!' });
//         } catch (error) {
//             console.error('Error uploading product:', error);
//             res.status(500).json({ error: 'Internal server error' });
//         }
//     });
// };



exports.uploadProduct = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to upload image', details: err });
        }

        // Extract product details from request body
        const { name, description, gender, category, section, subcategory, price, sizeXS, sizeS, sizeM, sizeL, sizeXL, sizeXXL } = req.body;

        if (!name || !description || !gender || !category || !section || !subcategory || !price || !sizeXS || !sizeS || !sizeM || !sizeL || !sizeXL || !sizeXXL) {
            return res.status(400).json({ error: 'Please provide all product details' });
        }

        // Generate a unique reference
        const reference = await generateUniqueReference();

        // Get the image URLs
        const imageUrls = req.files.map(file => `/uploads/products/${gender}/${category}/${section}/${subcategory}/${file.filename}`);

        try {
            await pool.query(
                'INSERT INTO products (reference, name, image, description, gender, category, section, subcategory, price, sizeXS, sizeS, sizeM, sizeL, sizeXL, sizeXXL) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [reference, name, JSON.stringify(imageUrls), description, gender, category, section, subcategory, price, sizeXS, sizeS, sizeM, sizeL, sizeXL, sizeXXL]
            );

            res.status(201).json({ message: 'Product uploaded successfully!', reference });
        } catch (error) {
            console.error('Error uploading product:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
};

// exports.getProductsByCategory = async (req, res) => {
//     const { gender, category, subcategory } = req.params;
  
//     try {
//       const connection = await pool.getConnection();
  
//       const [rows] = await connection.query(
//         'SELECT * FROM products WHERE gender = ? AND category = ? AND subcategory = ?',
//         [gender, category, subcategory]
//       );
  
//       // Construct the full image URL
//       const updatedProducts = rows.map(product => ({
//         ...product,
//         imageUrl: `${baseUrl}${product.image}` // Full image URL
//       }));
  
//       connection.release();
  
//       res.status(200).json(updatedProducts); // Return updated products with full image URL
//     } catch (error) {
//       console.error('Error fetching products:', error);
//       res.status(500).json({ message: 'Internal server error' });
//     }
//   };
  


exports.getProductsByCategory = async (req, res) => {
    const { gender, category, subcategory } = req.params;

    try {
        const connection = await pool.getConnection();

        const [rows] = await connection.query(
            'SELECT * FROM products WHERE gender = ? AND category = ? AND subcategory = ?',
            [gender, category, subcategory]
        );

        // Format the imageUrl properly
        const updatedProducts = rows.map(product => {
            let imageUrls = [];

            if (typeof product.image === 'string') {
                try {
                    // Try parsing as JSON
                    imageUrls = JSON.parse(product.image);
                } catch (error) {
                    // If parsing fails, assume it's a single URL
                    imageUrls = [product.image];
                }
            }

            return {
                ...product,
                imageUrl: imageUrls.map(url => url.trim()) // Ensure no spaces
            };
        });

        connection.release();

        res.status(200).json(updatedProducts);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


exports.getSpecificProduct = async (req, res) => {
    const { reference, gender, category, subcategory } = req.params;

    try {
        const connection = await pool.getConnection();

        const [rows] = await connection.query(
            'SELECT * FROM products WHERE reference = ? AND gender = ? AND category = ? AND subcategory = ?',
            [reference, gender, category, subcategory]
        );

        // Format the imageUrl properly
        const updatedProducts = rows.map(product => {
            let imageUrls = [];

            if (typeof product.image === 'string') {
                try {
                    // Try parsing as JSON
                    imageUrls = JSON.parse(product.image);
                } catch (error) {
                    // If parsing fails, assume it's a single URL
                    imageUrls = [product.image];
                }
            }

            return {
                ...product,
                imageUrl: imageUrls.map(url => url.trim()) // Ensure no spaces
            };
        });

        connection.release();

        res.status(200).json(updatedProducts);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

