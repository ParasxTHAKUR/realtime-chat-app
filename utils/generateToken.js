const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
    return jwt.sign({id: userId}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE_IN || "7d",
    })
}

module.exports = generateToken;