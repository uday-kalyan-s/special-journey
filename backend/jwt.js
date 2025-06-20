import jwt from 'jsonwebtoken'
import logger from './logger.js'

export function createJWT(username) {
    let payload = {
        username,
    }
    const token = jwt.sign(payload, process.env.JWT_HASH_SECRET, {
        algorithm: 'HS256', expiresIn: '1h'
    })
    console.log("Generated token: ", token)
    return token
}

export function verifyJWT(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_HASH_SECRET);
        logger.info(`payload: ${payload}`)
        return decoded
    }
    catch (err) {
        logger.info("wrong format of token")
    }
}
