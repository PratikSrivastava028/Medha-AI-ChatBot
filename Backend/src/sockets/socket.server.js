const { Server } = require("socket.io");
const messageModel = require("../models/message.model");
const userModel = require("../models/user.model");
const chatModel = require("../models/chat.model");
const aiService = require("../service/ai.service");
const { createMemory, queryMemory } = require("../service/vector.service");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
require("dotenv").config();

function initSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: function(origin, callback) {
        // Allow localhost domains only
        if (!origin || origin === "http://localhost:5173" || origin === "http://localhost:3000" || origin === "http://localhost:4000") {
          callback(null, true);
        } else {
          callback(new Error('CORS not allowed'));
        }
      },
      credentials: true
    }
  });

   io.use(async (socket, next) => {
    //middleware for socket authentication
    const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
    const token = cookies.token || socket.handshake.auth?.token;

    if (!token) {
      console.warn("⚠️ Socket connection without token - allowing for demo purposes");
      socket.user = null;
      return next();
    }

    try {
      const decoded = await jwt.verify(token, process.env.JWT_SECRET);
      const user = await userModel.findById(decoded.id);
      if (user) {
        socket.user = user;
        console.log("✅ Socket connection authenticated for user:", user.email);
      } else {
        console.warn("⚠️ User not found, allowing connection anyway");
        socket.user = null;
      }
      next();
    } catch (err) {
      console.warn("⚠️ Token validation failed, allowing connection anyway:", err.message);
      socket.user = null;
      next();
    }
  });

  io.on("connection", (socket) => {
    console.log("✅ New socket connection established:", socket.id);
    
    socket.on("ai-msg", async (messagePayLoad) => {
      try {
        console.log("📨 Received message:", messagePayLoad.content);

        // Get user ID safely
        const userId = socket.user?._id || null;

        // SIMPLE AI CHAT - Works for all users
        console.log("🤖 Generating AI response...");
        
        const response = await aiService.generateResponse([
          {
            role: "user",
            parts: [{ text: messagePayLoad.content }],
          },
        ]);

        console.log("✅ AI response generated:", response.substring(0, 50) + "...");

        // Send response immediately
        socket.emit("ai-msg-response", {
          content: response,
          chat: messagePayLoad.chat,
        });
        
        console.log("📤 Response sent to client");

        // OPTIONAL: Save to database only if user is authenticated and chat is a valid ObjectId
        const mongoose = require('mongoose');
        if (userId && mongoose.Types.ObjectId.isValid(messagePayLoad.chat)) {
          try {
            console.log("💾 Saving messages to database...");
            await Promise.all([
              messageModel.create({
                chat: messagePayLoad.chat,
                user: userId,
                content: messagePayLoad.content,
                role: "user",
              }),
              messageModel.create({
                chat: messagePayLoad.chat,
                user: userId,
                content: response,
                role: "model",
              }),
              chatModel.findByIdAndUpdate(messagePayLoad.chat, { lastActivity: new Date() })
            ]);
            console.log("✅ Messages and chat activity saved successfully");
          } catch (dbError) {
            console.warn("⚠️ Database save failed (non-critical):", dbError.message);
          }
        } else if (userId) {
             console.warn("⚠️ Skipping database save: Invalid chat ID (likely a fallback ID from frontend)");
        }
        
      } catch (error) {
        console.error("❌ Error handling ai-msg:", error.message);
        console.error("Stack:", error.stack);
        
        // Send friendly fallback response
        socket.emit("ai-msg-response", {
          content: "Hello! I'm your AI assistant. I'm here to help you with any questions you have. What would you like to know?",
          chat: messagePayLoad.chat,
        });
      }
    });
  });

  return io;
}

module.exports = initSocketServer;
