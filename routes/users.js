const express = require('express');
const router = express.Router();
const user = require('../models/User');
const protect = require('../middleware/auth');

router.get("/", protect, async (req, res) => {
    try{
        const users = await user.find({_id: {$ne: req.user._id}}).select(
            "username email createdAt"
        );
        res.json(users);
    }catch(err){
        res.status(500).json({message: "Server error", error: err.message})
    }
});

module.exports = router;
