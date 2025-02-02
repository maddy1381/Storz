const router = require("express").Router();
const authMiddleware = require("../middlewares/authMiddleware");
const { Magic } = require('@magic-sdk/admin');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/user')

const magic = new Magic(process.env.MAGIC_SECRET_KEY);
router.post('/api/user/login', async (req, res) => {
    try {
        console.log("called")
        const didToken = req.headers.authorization.substring(7);
        await magic.token.validate(didToken);
        console.log("user is authenticated");
        return res.status(200).json({ authenticated: true });
    } catch (error) {
        console.log("user is not authenticated");
        return res.status(500).json({ error: error.message });
    }
});

router.post('/api/user/create', authMiddleware, async (req, res) => {
    const magic_id = req.body.magic_id;
    const user_name = req.body.user_name;
    const email = req.body.email;

    if (!user_name || !magic_id || !email) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const count = await User.count();
    console.log("doc count:" + count);
    if (count == 0) {
        console.log("trying to create a user")
        const encryption_key = uuidv4();
        const user = new User({
            magic_id: magic_id,
            email: email,
            user_name: user_name,
            encryption_key: encryption_key,
            files: []
        })
        console.log("saving user")
        await user.save();
        return res.status(200).json({ message: "User created successfully" });
    }
    else {
        console.log("finding user if exists")
        const user = await User.findOne({ magic_id: magic_id });
        console.log("user: " + user);
        if (user) {
            console.log("User already exists!")
            return res.status(200).json({ message: "User already exists" });
        } else {
            console.log("User not found!")
            try {
                console.log("trying to create a user")
                const encryption_key = uuidv4();
                const user = new User({
                    magic_id: magic_id,
                    email: email,
                    user_name: user_name,
                    encryption_key: encryption_key,
                    files: []
                })
                console.log("saving user")
                await user.save();
                return res.status(200).json({ message: "User created successfully" });
            } catch (err) {
                return res.status(500).json({ error: err.message });
            }
        }
    }
})

module.exports = router