// routes/messages.js
const express = require("express");
const router = express.Router();
const Message = require("../models/messages");
const User = require("../models/users");


// Send a message
router.post("/send",  async (req, res) => {
  const { receiverId, content } = req.body;

  if (!receiverId || !content) {
    return res
      .status(400)
      .json({ error: "Receiver ID and content are required" });
  }

  try {
    const sender = await User.findOne({ where: { userId: req.user.userId } });
    if (!sender) {
      return res.status(404).json({ error: "Sender not found" });
    }

    const receiver = await User.findOne({ where: { userId: receiverId } });
    if (!receiver) {
      return res.status(404).json({ error: "Receiver not found" });
    }

    const message = new Message({
      senderId: req.user.userId,
      receiverId,
      content,
      roles: sender.roles,
      status: "sent",
    });

    await message.save();
    res.status(201).json({ message: "Message sent", data: message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get conversation between two users
router.get("/conversation/:receiverId",  async (req, res) => {
  const { receiverId } = req.params;

  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.user.userId, receiverId },
        { senderId: receiverId, receiverId: req.user.userId },
      ],
    }).sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      {
        receiverId: req.user.userId,
        senderId: receiverId,
        status: { $ne: "read" },
      },
      { $set: { status: "read" } }
    );

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent conversations
router.get("/recent",  async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: req.user.userId }, { receiverId: req.user.userId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderId", req.user.userId] },
              "$receiverId",
              "$senderId",
            ],
          },
          lastMessage: { $first: "$content" },
          createdAt: { $first: "$createdAt" },
          status: { $first: "$status" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "userId",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          userId: "$_id",
          username: "$user.username",
          name: "$user.name",
          lastMessage: 1,
          createdAt: 1,
          status: 1,
        },
      },
    ]);

    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
