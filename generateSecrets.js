const crypto = require('crypto');
const fs = require('fs');

// Generate a new JWT_SECRET
const jwtSecret = crypto.randomBytes(32).toString('hex');

// Generate a new REFRESH_TOKEN_SECRET
const refreshTokenSecret = crypto.randomBytes(32).toString('hex');

// Create or update the .env file with the new secrets
const envFileContent = `
JWT_SECRET=${jwtSecret}
REFRESH_TOKEN_SECRET=${refreshTokenSecret}
`;

fs.writeFileSync('.env', envFileContent);

console.log('New secrets generated and saved to .env file:');
console.log(`JWT_SECRET: ${jwtSecret}`);
console.log(`REFRESH_TOKEN_SECRET: ${refreshTokenSecret}`);
