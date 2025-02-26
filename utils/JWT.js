const JWT = require('jsonwebtoken')
const createError = require('http-errors')
require("dotenv").config();

module.exports = {
  signAccessToken: (customerID) => {
    return new Promise((resolve, reject) => {
      const payload = {customerID}
      const secret = process.env.JWT_SECRET
      const options = {
        expiresIn: '1h',
        issuer: 'pickurpage.com',
        audience: 'customerID',
      }
      JWT.sign(payload, secret, options, (err, token) => {
        if (err) {
          console.log(err.message)
          reject(createError.InternalServerError())
          return
        }
        resolve(token)
      })
    })
  },
  verifyAccessToken: (req, res, next) => {
    if (!req.headers['authorization']) return next(createError.Unauthorized())
    const authHeader = req.headers['authorization']
    const bearerToken = authHeader.split(' ')
    const token = bearerToken[1]
    JWT.verify(token, process.env.JWT_SECRET, (err, payload) => {
      if (err) {
        const message =
          err.name === 'JsonWebTokenError' ? 'Unauthorized' : err.message
        return next(createError.Unauthorized(message))
      }
      const customerID = payload.customerID
      req.customerID=customerID
    })
    next();
  },
  signRefreshToken: (customerID) => {
    return new Promise((resolve, reject) => {

      const payload = {
        
        customerID,
        
      }
      const options={
        expiresIn:'1h'
      }
      const secret = process.env.REFRESH_TOKEN_SECRET
      

      JWT.sign(payload, secret,options, (err, token) => {
        if (err) reject(err)

        client.SET(customerID.toString(), token, 'EX', 365000 , (err, reply) => {
          if (err) {
            reject(createError.InternalServerError())
            return
          }
        })
        resolve(token)

      })
    })
  },
  verifyRefreshToken: (refreshToken) => {
    return new Promise((resolve, reject) => {
      JWT.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err, payload) => {
          if (err) return reject(createError.Unauthorized())
          const customerID = payload.customerID
          client.GET(customerID.toString(), (err, result) => {
            if (err || (refreshToken != result)) {
              console.log(err.message)
              reject(createError.Unauthorized())
              
            }
           
          })
          resolve(customerID)

        }
      )
    })
  },
}