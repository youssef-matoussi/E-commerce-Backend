const JWT = require('jsonwebtoken');
require('dotenv').config();

exports.verifyAccessToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    JWT.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err) return res.status(401).json({ error: 'Unauthorized' });

        req.customerID = payload.customerID;
        next();
    });
};
