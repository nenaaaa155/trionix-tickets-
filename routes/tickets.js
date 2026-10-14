import express from 'express';
import Joi from 'joi';
import mongoose from 'mongoose';
import Ticket from '../models/Ticket.js';
import Agente from '../models/Agente.js';

const router = express.Router();

// Auxiliar para renombrar 'agenteId' resuelto a 'agente' en la respuesta JSON
function formatearTicket(ticketDoc) {
  const obj = ticketDoc.toObject ? ticketDoc.toObject() : ticketDoc;
  obj.agente = obj.agenteId || null;
  delete obj.agenteId;
  return obj;
}

const createTicketSchema = Joi.object({
  cliente: Joi.string().trim().min(2).max(100).required(),
  asunto: Joi.string().trim().min(5).max(200).required(),
  prioridad: Joi.string().valid('baja', 'media', 'alta').required()
});

const updateTicketSchema = Joi.object({
  cliente: Joi.string().trim().min(2).max(100),
  asunto: Joi.string().trim().min(5).max(200),
  prioridad: Joi.string().valid('baja', 'media', 'alta'),
  estado: Joi.string().valid('abierto', 'resuelto')
});

const comentarioSchemaJoi = Joi.object({
  autor: Joi.string().trim().min(2).required(),
  texto: Joi.string().trim().min(3).required()
});

// GET /api/tickets - Lista tickets con filtros (?estado= & ?prioridad=) y populate de 'agenteId'
router.get('/', async (req, res) => {
  try {
    const { estado, prioridad } = req.query;
    const filtro = {};
    if (estado) filtro.estado = estado;
    if (prioridad) filtro.prioridad = prioridad;

    const tickets = await Ticket.find(filtro).populate('agenteId', 'nombre especialidad');
    res.json(tickets.map(formatearTicket));
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener tickets', error: error.message });
  }
});

// GET /api/tickets/:id
router.get('/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ mensaje: 'El ID ingresado no es válido' });
  }
  try {
    const ticket = await Ticket.findById(req.params.id).populate('agenteId', 'nombre especialidad');
    if (!ticket) return res.status(404).json({ mensaje: 'Ticket no encontrado' });
    res.json(formatearTicket(ticket));
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al buscar el ticket', error: error.message });
  }
});

// POST /api/tickets
router.post('/', async (req, res) => {
  const { error, value } = createTicketSchema.validate(req.body);
  if (error) return res.status(400).json({ mensaje: error.details[0].message });

  try {
    const nuevoTicket = new Ticket({ ...value, estado: 'abierto' });
    await nuevoTicket.save();
    res.status(201).json(formatearTicket(nuevoTicket));
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear el ticket', error: error.message });
  }
});

// PUT /api/tickets/:id
router.put('/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ mensaje: 'El ID ingresado no es válido' });
  }
  const { error, value } = updateTicketSchema.validate(req.body);
  if (error) return res.status(400).json({ mensaje: error.details[0].message });

  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id, 
      value, 
      { new: true, runValidators: true }
    ).populate('agenteId', 'nombre especialidad');

    if (!ticket) return res.status(404).json({ mensaje: 'Ticket no encontrado' });
    res.json(formatearTicket(ticket));
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar el ticket', error: error.message });
  }
});

// DELETE /api/tickets/:id
router.delete('/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ mensaje: 'El ID ingresado no es válido' });
  }
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) return res.status(404).json({ mensaje: 'Ticket no encontrado' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar el ticket', error: error.message });
  }
});

// POST /api/tickets/:id/asignar - Endpoint de asignación
router.post('/:id/asignar', async (req, res) => {
  const { agenteId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(req.params.id) || !mongoose.Types.ObjectId.isValid(agenteId)) {
    return res.status(400).json({ mensaje: 'Formato de ID no válido' });
  }

  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ mensaje: 'Ticket no encontrado' });

    const agente = await Agente.findById(agenteId);
    if (!agente) return res.status(404).json({ mensaje: 'Agente no encontrado' });
    if (!agente.activo) return res.status(400).json({ mensaje: 'El agente seleccionado está inactivo' });

    ticket.agenteId = agente._id;
    await ticket.save();

    const ticketActualizado = await Ticket.findById(ticket._id).populate('agenteId', 'nombre especialidad');
    res.status(200).json(formatearTicket(ticketActualizado));
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al asignar el agente', error: error.message });
  }
});

// POST /api/tickets/:id/comentarios - Agregar comentario embebido
router.post('/:id/comentarios', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ mensaje: 'El ID ingresado no es válido' });
  }

  const { error, value } = comentarioSchemaJoi.validate(req.body);
  if (error) return res.status(400).json({ mensaje: error.details[0].message });

  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ mensaje: 'Ticket no encontrado' });

    ticket.comentarios.push(value);
    await ticket.save();

    const ticketActualizado = await Ticket.findById(ticket._id).populate('agenteId', 'nombre especialidad');
    res.status(201).json(formatearTicket(ticketActualizado));
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al agregar comentario', error: error.message });
  }
});

export default router;