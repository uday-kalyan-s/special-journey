import express from 'express'
import { checkUsernameFree, connectDB, createUser, getDescription, loginUser, setDescription } from './database.js'
import dotenv from 'dotenv'
import { createJWT, verifyJWT } from './jwt.js'
import logger from './logger.js'
import rateLimit from 'express-rate-limit'

dotenv.config();
const entries = ["SALT_ROUNDS", "PASSWORD_HASH_SECRET","DB_URL","JWT_HASH_SECRET", "SITE_PORT"]
logger.info("env entries:")
entries.forEach(entry => {
    if (entry in process.env) {
        logger.info(`${entry}:${process.env[entry]}`)
    }
    else {
        logger.warn(`${entry} missing`)
    }
})

connectDB()

let app = express()
app.use(express.json())

app.use((req, res, next) => {
    logger.info(`URL: ${req.url}, body: ${req.body}`)
    res.on('finish', () => {
        logger.info(`response: ${res.statusCode}`)
    })
    next()
})

// allow 5 requests in 20 sec
const authLimiter = rateLimit({
    windowMs: 1000*20, // 5 sec
    limit: 5,
    message: "spamed, slow down"
})

app.get("/test", (req, res) => {
    res.status(200).send({"message": "success"})
})

function needpassmiddleware(req, res, next) {
    if (!('username' in req.body) || !('password' in req.body)) {
        logger.info("missing username or password")
        return res.status(500).send({message: "missing username or password"})
    }
    next()
}
app.use('/signup', needpassmiddleware)
// app.use('/signup', authLimiter)
app.use('/signin', needpassmiddleware)
// app.use('/signin', authLimiter)

app.post('/signup', (req, res) => {
    let username = req.body.username
    let password = req.body.password
    checkUsernameFree(username)
    .then(free => {
        if(free) {
            createUser(username, password).then(() => {
                logger.info(`new user created, username: ${username}`)
                res.sendStatus(200)
            })
        }
        else {
            logger.info(`failed to create user, already exists, username: ${username}`)
            res.sendStatus(500)
        }
    })
})

app.post('/signin', (req, res) => {
    let username = req.body.username
    let password = req.body.password
    loginUser(username, password).then(({user, message, success}) => {
        if (success) {
            let token = createJWT(user.username);
            logger.info(`signed in, username: ${username} token: ${token}`)
            res.status(200).send({token})
        }
        else {
            logger.info(`failed signin: ${message}`)
            res.status(400).send({message})
        }
    })
})



// auth
app.use('/me', (req, res, next) => {
    let token = req.headers.authorization
    if (token == null) {
        logger.info("user not logged in")
        return res.status(401).send({
            message: "not logged in"
        })
    }
    let decoded = verifyJWT(token)
    if (decoded == null) {
        return res.status(400).send("token broken/expired")
    }
    req.username = decoded.username
    next()
})

app.get('/me', (req, res) => {
    let username = req.username
    getDescription(username).then(description => {
        res.status(200).send({
            username,
            description
        })
    })
})

app.put("/me", (req, res) => {
    let username = req.username
    if(!('description' in req.body)) {
        logger.info("description not provided")
        return res.status(400).send()
    }
    let description = req.body.description
    setDescription(username, description).then(() => {
        res.status(200).send({"desc": description})
    })
})

app.listen(Number(process.env.SITE_PORT), () => {
    logger.info(`listening on ${process.env.SITE_PORT}`)
})