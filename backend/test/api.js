import mongoose from 'mongoose'
import request from 'supertest'
import { User } from '../database.js'

const base = "http://node-server:3000"

describe("test if services are running", () => {
    it("should check if nodejs api runs", (done) => {
        request(base)
        .get("/test")
        .expect(200)
        .expect(JSON.stringify({"message": "success"}), done)
    })
    it("should check if mongo server connects", async () => {
        await mongoose.connect("mongodb://mongo-server:27017/test")
    })
})

describe("check API endpoints", () => {
    describe("check signup", () => {
        it("check success signup", (done) => {
            request(base)
            .post("/signup")
            .set('Content-Type', 'application/json')
            .send(JSON.stringify({username: "testuser", password: "testpassword"}))
            .expect(200)
            .end((err, res) => {
                User.deleteOne({username: "testuser"})
                .then(() => done(err))
            })
        })
        it("check missing fields", (done) => {
            request(base)
            .post("/signup")
            .set('Content-Type', 'application/json')
            .send(JSON.stringify({username: "testuser"}))
            .expect(500, done)
        })
        it("check repeated", (done) => {
            let user = new User({
                username: "testuser2",
                hashed_password: "shit"
            })
            user.save().then(() => {
                request(base)
                .post("/signup")
                .set('Content-Type', 'application/json')
                .send(JSON.stringify({username: "testuser2", password: "abcd"}))
                .expect(500)
                .end((err, res) => {
                    User.deleteOne({username: "testuser2"})
                    .then(() => done(err))
                })
            })
        })
    })
    describe("check signin", () => {
        it("check missing fields", (done) => {
            request(base)
            .post("/signin")
            .set('Content-Type', 'application/json')
            .send(JSON.stringify({username: "testuser"}))
            .expect(500, done)
        })
        it("check succesful signin", (done) => {
            request(base)
            .post("/signup")
            .set('Content-Type', 'application/json')
            .send(JSON.stringify({username: "testuser2", password: "shit"}))
            .end(() => {
                request(base)
                .post("/signin")
                .set('Content-Type', 'application/json')
                .send(JSON.stringify({username: "testuser2", password: "shit"}))
                .expect(200)
                .end((err, res) => {
                    User.deleteOne({username: "testuser2"})
                    .then(() => done(err))
                })
            })
        })
        it("check wrong password", (done) => {
            request(base)
            .post("/signup")
            .set('Content-Type', 'application/json')
            .send(JSON.stringify({username: "testuser2", password: "shit"}))
            .end(() => {
                request(base)
                .post("/signin")
                .set('Content-Type', 'application/json')
                .send(JSON.stringify({username: "testuser2", password: "shit22"}))
                .expect(400)
                .end((err, res) => {
                    User.deleteOne({username: "testuser2"})
                    .then(() => done(err))
                })
            })
        })
    })
})