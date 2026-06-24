const express = require('express');
const authRoutes = require('./routes/auth.routes')
const cookieParser = require('cookie-parser')
const chatRoutes = require('./routes/chat.routes')
const cors = require("cors")
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const app = express();

// Security Headers
app.use(helmet());

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Compression
app.use(compression());

app.use(express.json());
app.use(cookieParser());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { message: "Too many requests from this IP, please try again after 15 minutes" }
});
app.use("/api/", limiter);

// CORS configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4000',
    'https://medha-ai-chatbot-1.onrender.com'
];

if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
    origin: function (origin, callback) {
        // Allow all origins to ensure global access (e.g. from deployed frontend or multiple environments)
        // while supporting credentials: true (which requires returning the exact origin instead of '*')
        if (!origin) return callback(null, true);
        
        const isAllowed = allowedOrigins.indexOf(origin) !== -1 || 
                          origin.startsWith('http://localhost:') || 
                          origin.startsWith('http://127.0.0.1:');
                          
        if (isAllowed) {
            return callback(null, true);
        }
        
        // Fallback: allow the origin to ensure global access
        return callback(null, true);
    },
    credentials: true
}));

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err);
    res.status(err.status || 500).json({
        message: err.message || "Internal Server Error",
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

module.exports = app;