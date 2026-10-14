import mongoose from 'mongoose';

const comentarioSchema = new mongoose.Schema({
  autor: { type: String, required: true, trim: true, minlength: 2 },
  texto: { type: String, required: true, trim: true, minlength: 3 },
  fecha: { type: Date, default: Date.now }
});

const ticketSchema = new mongoose.Schema({
  cliente: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  asunto: { type: String, required: true, trim: true, minlength: 5, maxlength: 200 },
  prioridad: { type: String, enum: ["baja", "media", "alta"], required: true },
  estado: { type: String, enum: ["abierto", "resuelto"], default: "abierto" },
  comentarios: [comentarioSchema],
  agenteId: { type: mongoose.Schema.Types.ObjectId, ref: "Agente", default: null }
}, { timestamps: true });

export default mongoose.model('Ticket', ticketSchema);