// const nodemailer = require('nodemailer');
// require('dotenv').config();

// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS  // Utilise le mot de passe d'application ici
//     }
// });

// const sendVerificationEmail = async (email, token) => {
//     const verificationLink = `${process.env.BASE_URL}/api/verify/${token}`;
//     const mailOptions = {
//         from: process.env.EMAIL_USER,
//         to: email,
//         subject: 'Verify Your Email',
//         html: `<h2>Verify Your Email</h2>
//                 <h1 style="text-align:center; color:green;">Your account was succesfully created</h3>
//                <p style="text-align:center;">Please click <a href="${verificationLink}">here</a> to verify your account.</p>`
//     };

//     return transporter.sendMail(mailOptions);
// };

// module.exports = { sendVerificationEmail };



const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS  // Use app password for Gmail
    }
});

/**
 * Sends a verification email for account activation.
 * @param {string} email - User's email address.
 * @param {string} token - Verification token.
 */
const sendVerificationEmail = async (email, token) => {
    const verificationLink = `${process.env.BASE_URL}/api/verify/${token}`;
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify Your Email',
        html: `<h1 style="text-align:center; color:green;">Your account was successfully created</h1>
               <H2 style="text-align:center;">Please click <a href="${verificationLink}">here</a> to verify your account.</h2>`
    };

    return transporter.sendMail(mailOptions);
};

/**
 * Generates a 6-digit verification code.
 * @returns {string} A random 6-digit code.
 */
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

/**
 * Sends a password reset email with a reset code.
 * @param {string} email - User's email address.
 * @param {string} resetCode - 6-digit reset code.
 */
const sendResetEmail = async (email, resetCode) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset Code',
        html: `<h2 style="text-align:center; ">Your password reset code is: ${resetCode} <br> It will expire in 10 minutes. </h1>`
    };

    return transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail, sendResetEmail, generateCode };
