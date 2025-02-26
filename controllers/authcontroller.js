const bcrypt = require('bcrypt');
const jwt = require('../utils/JWT');
const pool = require('../config/db');
const { sendVerificationEmail, sendResetEmail, generateCode } = require('../utils/mailer');
const crypto = require('crypto');

exports.register = async (req, res) => {
    try {
        const { nom, prenom, email, password, date_de_naissance, phone_number } = req.body;

        // Check for missing fields
        if (!nom || !prenom || !email || !password || !date_de_naissance || !phone_number) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if the email already exists
        const [emailResult] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (emailResult.length > 0) {
            return res.status(400).json({ error: 'Cette adresse e-mail existe déjà' });
        }

        // Check if the phone number already exists
        const [phoneResult] = await pool.query('SELECT * FROM users WHERE phone_number = ?', [phone_number]);
        if (phoneResult.length > 0) {
            return res.status(400).json({ error: 'Ce numéro de téléphone existe déjà' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Set the token creation time
        const tokenCreationTime = new Date();

        // Insert the new user into the database
        await pool.query(
            'INSERT INTO users (nom, prenom, email, password, date_de_naissance, phone_number, verification_token, token_creation_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [nom, prenom, email, hashedPassword, date_de_naissance, phone_number, verificationToken, tokenCreationTime]
        );

        // Send the verification email
        await sendVerificationEmail(email, verificationToken);

        res.status(201).json({ message: 'Signup successful. Please check your email to verify your account.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};





exports.verifyUser = async (req, res) => {
    try {
        const { token } = req.params;

        // Query for the user by verification token
        const [rows] = await pool.query('SELECT * FROM users WHERE verification_token = ?', [token]);

        if (!rows.length) {
            // Return an HTML error message instead of JSON
            return res.status(400).send(`
                <html>
                    <head>
                        <title>Verification Failed</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                background-color: #f4f4f9;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                height: 100vh;
                                margin: 0;
                            }
                            .message {
                                background-color: #dc3545;
                                color: white;
                                padding: 20px;
                                border-radius: 5px;
                                text-align: center;
                                width: 80%;
                                max-width: 500px;
                                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                            }
                            .message h1 {
                                margin: 0;
                            }
                            .emoji {
                                font-size: 2rem;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="message">
                            <h1>Invalid or expired token <span class="emoji">❌</span></h1>
                            <p>Please request a new verification email.</p>
                        </div>
                    </body>
                </html>
            `);
        }

        const user = rows[0];
        const tokenCreationTime = new Date(user.token_creation_time); // Get token creation time
        const currentTime = new Date();

        // Calculate the difference in minutes between current time and token creation time
        const timeDifferenceInMinutes = (currentTime - tokenCreationTime) / (1000 * 60);

        // Check if the token has expired (5 minutes)
        if (timeDifferenceInMinutes > 5) {
            // Delete the user if the token expired
            await pool.query('DELETE FROM users WHERE id = ?', [user.id]);
            
            return res.status(400).send(`
                <html>
                    <head>
                        <title>Verification Expired</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                background-color: #f4f4f9;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                height: 100vh;
                                margin: 0;
                            }
                            .message {
                                background-color: #dc3545;
                                color: white;
                                padding: 20px;
                                border-radius: 5px;
                                text-align: center;
                                width: 80%;
                                max-width: 500px;
                                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                            }
                            .message h1 {
                                margin: 0;
                            }
                            .emoji {
                                font-size: 2rem;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="message">
                            <h1>Verification token expired <span class="emoji">⏳</span></h1>
                            <p>Your account has been deleted. Please sign up again.</p>
                        </div>
                    </body>
                </html>
            `);
        }

        // If the token is valid and not expired, update verification status
        await pool.query('UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?', [user.id]);

        // Send a custom HTML response with a success message
        return res.status(200).send(`
            <html>
                <head>
                    <title>Account Verified</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f4f4f9;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                        }
                        .message {
                            background-color: #28a745;
                            color: white;
                            padding: 20px;
                            border-radius: 5px;
                            text-align: center;
                            width: 80%;
                            max-width: 500px;
                            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                        }
                        .message h1 {
                            margin: 0;
                        }
                        .emoji {
                            font-size: 2rem;
                        }
                    </style>
                </head>
                <body>
                    <div class="message">
                        <h1>Your email was verified successfully <span class="emoji">✅</span></h1>
                        <p>You can now log in.</p>
                    </div>
                </body>
            </html>
        `);
    } catch (error) {
        console.error("Error in verifyUser:", error);
        return res.status(500).send(`
            <html>
                <head>
                    <title>Server Error</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f4f4f9;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                        }
                        .message {
                            background-color: #dc3545;
                            color: white;
                            padding: 20px;
                            border-radius: 5px;
                            text-align: center;
                            width: 80%;
                            max-width: 500px;
                            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                        }
                        .message h1 {
                            margin: 0;
                        }
                        .emoji {
                            font-size: 2rem;
                        }
                    </style>
                </head>
                <body>
                    <div class="message">
                        <h1>Internal Server Error <span class="emoji">⚠️</span></h1>
                        <p>Something went wrong. Please try again later.</p>
                    </div>
                </body>
            </html>
        `);
    }
};









exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const [user] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (!user || user.length === 0) return res.status(400).json({ error: 'Invalid credentials' });

        // Check if the account is verified
        if (!user[0].is_verified) return res.status(403).json({ error: 'Please verify your email before logging in' });

        const passwordMatch = await bcrypt.compare(password, user[0].password);
        if (!passwordMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const accessToken = await jwt.signAccessToken(user[0].id, { expiresIn: '1h' }); // 1 hour expiration

        // Include user data in the response
        res.status(200).json({
            message: 'Login successful',
            accessToken,
            user: {
                nom: user[0].nom, // Include last name
                prenom: user[0].prenom, // Include first name
                email: user[0].email
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


exports.logout = async (req, res) => {
    try {
        // If using cookies for token storage
        res.clearCookie("accessToken"); // This clears the cookie with the accessToken if it's stored there

        // If using localStorage/sessionStorage in a frontend app, you just need to clear them on the client-side
        // For example, in a frontend app: localStorage.removeItem("accessToken");

        res.status(200).json({ message: 'Logout successful. Please log in again.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


// Forgot password - Step 1: Generate and send reset code
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        // Check if user exists
        const [user] = await pool.query('SELECT reset_code, reset_code_time FROM users WHERE email = ?', [email]);
        if (user.length === 0) return res.status(404).json({ error: 'User not found' });

        const storedCode = user[0].reset_code;
        const codeTime = user[0].reset_code_time ? new Date(user[0].reset_code_time) : null;
        const currentTime = new Date();

        // Check if a valid reset code was already sent within the last 1 minute
        if (storedCode && codeTime) {
            const timeDiff = (currentTime - codeTime) / (1000 * 60); // Convert to minutes
            if (timeDiff < 1) {
                return res.status(400).json({ error: 'Reset code already sent, please verify your email.' });
            }
        }

        // Generate new reset code and update in database
        const resetCode = generateCode();
        const resetTime = new Date();

        await pool.query(
            'UPDATE users SET reset_code = ?, reset_code_time = ? WHERE email = ?',
            [resetCode, resetTime, email]
        );

        // Send email
        await sendResetEmail(email, resetCode);

        res.status(200).json({ message: 'Reset code sent to email' });
    } catch (error) {
        console.error('Error in forgotPassword:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


// Verify reset code - Step 2
exports.verifyResetCode = async (req, res) => {
    try {
        const { email, resetCode } = req.body;
        if (!email || !resetCode) return res.status(400).json({ error: 'Email and reset code are required' });

        // Check if the code exists and is valid
        const [user] = await pool.query('SELECT reset_code, reset_code_time FROM users WHERE email = ?', [email]);
        if (user.length === 0) return res.status(404).json({ error: 'User not found' });

        const storedCode = user[0].reset_code;
        const codeTime = new Date(user[0].reset_code_time);
        const currentTime = new Date();

        // Check if the code matches and is not expired (valid for 10 minutes)
        if (storedCode !== resetCode) return res.status(400).json({ error: 'Invalid reset code' });

        const timeDiff = (currentTime - codeTime) / (1000 * 60);
        if (timeDiff > 10) return res.status(400).json({ error: 'Reset code expired' });

        // Set reset_verified to 1
        await pool.query('UPDATE users SET reset_verified = 1 WHERE email = ?', [email]);

        res.status(200).json({ message: 'Reset code verified. You can now reset your password.' });
    } catch (error) {
        console.error('Error in verifyResetCode:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



// Reset password - Step 3
exports.resetPassword = async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;
        if (!email || !newPassword || !confirmPassword) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if the new password and confirm password match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Fetch user data
        const [rows] = await pool.query('SELECT reset_verified FROM users WHERE email = ?', [email]);
        if (rows.length === 0) return res.status(400).json({ error: 'Invalid reset request' });

        const { reset_verified } = rows[0];

        // Ensure reset_verified is 1 (i.e., the code was verified)
        if (reset_verified !== 1) {
            return res.status(400).json({ error: 'You must verify your reset code first' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the password and clear reset code and time
        await pool.query('UPDATE users SET password = ?, reset_verified = 0 WHERE email = ?', [hashedPassword, email]);

        res.status(200).json({ message: 'Password reset successfully. You can now log in.' });
    } catch (error) {
        console.error('Error in resetPassword:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


