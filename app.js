import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { connectDB } from './db.js';
import ticketRoutes from './routes/tickets.js';
import agenteRoutes from './routes/agentes.js';

const app = express();
const PORT = process.env.PORT || 8080;

// Conectar a MongoDB antes de escuchar peticiones
connectDB();

app.use(express.json());
app.use(express.static('public'));

app.use('/api/tickets', ticketRoutes);
app.use('/api/agentes', agenteRoutes);

app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});