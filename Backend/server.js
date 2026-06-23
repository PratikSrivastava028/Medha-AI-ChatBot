const app = require('./src/app');
const connectToDb = require('./src/db/db');
const initSocketServer = require('./src/sockets/socket.server');
const http = require("http");
const server = http.createServer(app);   // express server se kaam nhi chlega so we require http server

connectToDb();

initSocketServer(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT,()=>{
    console.log(`Running on port ${PORT}`);
    
})
