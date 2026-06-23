const chatModel = require("../models/chat.model");
const messageModel = require("../models/message.model");

async function createChat(req, res) {
  try {
    const { title } = req.body;
    const user = req.user;

    const chat = await chatModel.create({
      user: user._id,
      title: title || "New Chat"
    });

    res.status(201).json({
      msg: "Chat created successfully",
      chat: {
        _id: chat._id,
        title: chat.title,
        lastActivity: chat.lastActivity,
        user: chat.user,
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create chat", error: error.message });
  }
}

async function getUserChats(req, res) {
  try {
    const user = req.user;
    const chats = await chatModel.find({ user: user._id }).sort({ lastActivity: -1 });
    res.status(200).json({ chats });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch chats", error: error.message });
  }
}

async function getChatMessages(req, res) {
  try {
    const { chatId } = req.params;
    const messages = await messageModel.find({ chat: chatId }).sort({ createdAt: 1 });
    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch messages", error: error.message });
  }
}

module.exports = { createChat, getUserChats, getChatMessages };
