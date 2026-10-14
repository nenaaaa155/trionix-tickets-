import express from 'express';
import Joi from 'joi';
import mongoose from 'mongoose';
import Agente from '../models/Agente.js';
import Ticket from '../models/Ticket.js';

const router = express.Router();

const agenteSchemaJoi = Joi.object({
  nombre: Joi.string().trim().min(3).max(100).required(),
  email: Joi.string().email().trim().required(),
  especialidad: Joi.string().valid("redes", "software", "hardware", "general").required(),
  activo: Joi.boolean().default(true)
});

// GET /api/agentes - Lista agentes con filtros opcionales (?especialidad= & ?activo=)
router.get('/', async (req, res) => {
  try {
    const { especialidad, activo } = req.query;
    const filtro = {};
    if (especialidad) filtro.especialidad = especialidad;
    if (activo !== undefined) filtro.activo = activo === 'true';

    const agentes = await Agente.find(filtro);
    res.json(agentes);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener agentes', error: error.message });
  }
});

// GET /api/agentes/:id
router.get('/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ mensaje: 'El ID ingresado no es válido' });
  }
  try {
    const agente = await Agente.findById(req.params.id);
    if (!agente) return res.status(404).json({ mensaje: 'Agente no encontrado' });
    res.json(agente);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al buscar el agente', error: error.message });
  }
});

// GET /api/agentes/:id/tickets - Tickets asignados al agente
router.get('/:id/tickets', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ mensaje: 'El ID ingresado no es válido' });
  }
  try {
    const tickets = await Ticket.find({ agenteId: req.params.id });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener tickets del agente', error: error.message });
  }
});

// POST /api/agentes - Crear Agente
router.post('/', async (req, res) => {
  const { error, value } = agenteSchemaJoi.validate(req.body);
  if (error) return res.status(400).json({ mensaje: error.details[0].message });

  try {
    const nuevoAgente = new Agente(value);
    await nuevoAgente.save();
    res.status(201).json(nuevoAgente);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ mensaje: 'El correo electrónico ya está registrado.' });
    }
    res.status(500).json({ mensaje: 'Error al guardar el agente', error: err.message });
  }
});

// PUT /api/agentes/:id
router.put('/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ mensaje: 'El ID ingresado no es válido' });
  }
  const { error, value } = agenteSchemaJoi.validate(req.body);
  if (error) return res.status(400).json({ mensaje: error.details[0].message });

  try {
    const agente = await Agente.findByIdAndUpdate(req.params.id, value, { new: true, runValidators: true });
    if (!agente) return res.status(404).json({ mensaje: 'Agente no encontrado' });
    res.json(agente);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ mensaje: 'El correo electrónico ya está registrado.' });
    }
    res.status(500).json({ mensaje: 'Error al actualizar agente', error: err.message });
  }
});

// DELETE /api/agentes/:id - No se puede eliminar si tiene tickets abiertos
router.delete('/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ mensaje: 'El ID ingresado no es válido' });
  }
  try {
    const ticketsAbiertos = await Ticket.find({ agenteId: req.params.id, estado: 'abierto' });
    if (ticketsAbiertos.length > 0) {
      return res.status(409).json({ mensaje: 'No se puede eliminar el agente porque tiene tickets abiertos asignados.' });
    }

    const agente = await Agente.findByIdAndDelete(req.params.id);
    if (!agente) return res.status(404).json({ mensaje: 'Agente no encontrado' });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar el agente', error: error.message });
  }
});

export default router;