const app = require('./src/app');
const connectToDb = require('./src/db/db');
const initSocketServer = require('./src/sockets/socket.server');
const http = require("http");
const server = http.createServer(app);   // express server se kaam nhi chlega so we require http server

// Process-wide error handlers to prevent crashes on unhandled rejections or uncaught exceptions
process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
    console.error("❌ Uncaught Exception:", error);
});

connectToDb();

initSocketServer(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT,()=>{
    console.log(`Running on port ${PORT}`);
    
})

