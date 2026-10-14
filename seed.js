import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Agente from './models/Agente.js';
import Ticket from './models/Ticket.js';

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB para poblamiento...');

    await Agente.deleteMany({});
    await Ticket.deleteMany({});

    const agente1 = await Agente.create({
      nombre: 'Carlos Mendoza',
      email: 'carlos@trionix.com',
      especialidad: 'redes',
      activo: true
    });

    const agente2 = await Agente.create({
      nombre: 'Sofía Torres',
      email: 'sofia@trionix.com',
      especialidad: 'software',
      activo: true
    });

    await Ticket.create({
      cliente: 'Banco Central',
      asunto: 'Error en la API de pagos',
      prioridad: 'alta',
      estado: 'abierto',
      agenteId: agente1._id,
      comentarios: [{ autor: 'Soporte', texto: 'Revisando logs de red.' }]
    });

    await Ticket.create({
      cliente: 'Clínica del Norte',
      asunto: 'Fallo al imprimir facturas',
      prioridad: 'media',
      estado: 'abierto',
      agenteId: null,
      comentarios: []
    });

    console.log('Datos iniciales creados exitosamente.');
    process.exit();
  } catch (err) {
    console.error('Error al poblar la base de datos:', err);
    process.exit(1);
  }
};

seed();