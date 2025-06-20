import mongoose, { model, Schema } from "mongoose"
import bcrypt from 'bcrypt'
import logger from './logger.js'

const UserSchema = new Schema({
    username: String,
    hashed_password: String,
    description: String,
    tokens: [String]
})

export const User = model('User', UserSchema)

async function hash(password) {
    let salt = await bcrypt.genSalt(Number(process.env.SALT_ROUNDS))
    let hashedPswd = await bcrypt.hash(password, salt)
    return hashedPswd
}

export async function checkUsernameFree(username) {
    return await User.findOne({username}) == null
}

export async function createUser(username, password) {
    let hashedPswd = await hash(password)
    let newUser = new User({
        username,
        hashed_password: hashedPswd,
        description: "",
        tokens: []
    })
    await newUser.save()
}

export async function loginUser(username, password) {
    let user = await User.findOne({username: username})
    if (user == null) {
        return {user, message: "user not found", success: false}
    }
    else {
        let matches = await bcrypt.compare(password, user.hashed_password)
        if (matches) {
            return {user, message: "success", success: true}
        }
        else {
            return {user, message: "wrong password", success: false}
        }
    }
}

export async function getDescription(username) {
    let user = await User.findOne({username:username})
    return user.description
}

export async function setDescription(username, description) {
    await User.findOneAndUpdate({username: username}, {description: description})
}

export function connectDB() {
    mongoose.connect(process.env.DB_URL)
    .then(() => logger.info("database connection succesful"))
    .catch(err => logger.error(err))
}