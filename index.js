require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { setIO } = require('./socketInstance');
const socketHandlers = require('./sockets');

const authRoutes = require('./routes/authRoutes');
const listingRoutes = require('./routes/listingRoutes');
const bidRoutes = require('./routes/bidRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const peelerRoutes = require('./routes/peelerRoutes');
const laborRoutes = require('./routes/laborRoutes');
const laborJobRoutes = require('./routes/laborJobRoutes');

const app = express();
const server = http.createServer(app);

connectDB();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

// app.use('/api/auth', authRoutes);
// app.use('/api/listings', listingRoutes);
// app.use('/api/bids', bidRoutes);
// app.use('/api/deliveries', deliveryRoutes);
// app.use('/api/peelers', peelerRoutes);
// app.use('/api/labor', laborRoutes);
// app.use('/api/jobs', laborJobRoutes);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL, credentials: true },
});
setIO(io);
// socketHandlers(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server on ${PORT}`));