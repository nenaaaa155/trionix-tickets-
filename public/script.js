let agentesCache = [];

document.addEventListener('DOMContentLoaded', () => {
  cargarAgentes();
  cargarTickets();

  document.getElementById('agent-form').addEventListener('submit', crearAgente);
  document.getElementById('ticket-form').addEventListener('submit', crearTicket);
});

function mostrarMensaje(mensaje, esError = true) {
  const alertBox = document.getElementById('alert-box');
  alertBox.textContent = mensaje;
  alertBox.className = `alert ${esError ? 'error' : 'success'}`;
  setTimeout(() => alertBox.className = 'alert hidden', 4000);
}

async function cargarAgentes() {
  try {
    const res = await fetch('/api/agentes?activo=true');
    agentesCache = await res.json();
  } catch (err) {
    mostrarMensaje('Error al obtener agentes');
  }
}

async function cargarTickets() {
  try {
    const res = await fetch('/api/tickets');
    const tickets = await res.json();
    renderizarTickets(tickets);
  } catch (err) {
    mostrarMensaje('Error al obtener tickets');
  }
}

function renderizarTickets(tickets) {
  const container = document.getElementById('tickets-list');
  container.innerHTML = '';

  if (tickets.length === 0) {
    container.innerHTML = '<p>No hay tickets registrados actualmente.</p>';
    return;
  }

  tickets.forEach(ticket => {
    const div = document.createElement('div');
    div.className = `ticket-item ${ticket.prioridad}`;

    const agenteNombre = ticket.agente 
      ? `${ticket.agente.nombre} (${ticket.agente.especialidad})` 
      : '<em>Sin asignar</em>';

    let opcionesAgentes = `<option value="">Seleccionar agente...</option>`;
    agentesCache.forEach(a => {
      opcionesAgentes += `<option value="${a._id}">${a.nombre} - ${a.especialidad}</option>`;
    });

    let comentariosHTML = (ticket.comentarios || []).map(c => 
      `<div class="comment-item"><strong>${c.autor}:</strong> ${c.texto}</div>`
    ).join('');

    div.innerHTML = `
      <div class="ticket-header">
        <h3>${ticket.asunto}</h3>
        <span class="badge ${ticket.prioridad}">${ticket.prioridad}</span>
      </div>
      <div class="ticket-body">
        <p><strong>Cliente:</strong> ${ticket.cliente} | <strong>Estado:</strong> ${ticket.estado}</p>
        <p><strong>Agente Asignado:</strong> ${agenteNombre}</p>
      </div>

      <div class="assign-box">
        <select id="select-agente-${ticket._id}">${opcionesAgentes}</select>
        <button onclick="asignarAgente('${ticket._id}')" class="btn-primary">Asignar</button>
      </div>

      <div style="margin-top: 0.8rem;">
        ${ticket.estado === 'abierto' ? `<button onclick="marcarResuelto('${ticket._id}')" class="btn-resolve">Marcar como resuelto</button>` : ''}
        <button onclick="eliminarTicket('${ticket._id}')" class="btn-delete">Eliminar</button>
      </div>

      <div class="comments-section">
        <h4>Comentarios</h4>
        ${comentariosHTML || '<p style="font-size:0.8rem; color:#64748b;">Sin comentarios.</p>'}
        <form onsubmit="agregarComentario(event, '${ticket._id}')" class="comment-form">
          <input type="text" placeholder="Autor" id="autor-${ticket._id}" required />
          <input type="text" placeholder="Comentario..." id="texto-${ticket._id}" required />
          <button type="submit" class="btn-primary">Comentar</button>
        </form>
      </div>
    `;

    container.appendChild(div);
  });
}

async function crearAgente(e) {
  e.preventDefault();
  const body = {
    nombre: document.getElementById('agent-nombre').value,
    email: document.getElementById('agent-email').value,
    especialidad: document.getElementById('agent-especialidad').value
  };

  const res = await fetch('/api/agentes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!res.ok) {
    mostrarMensaje(data.mensaje);
  } else {
    document.getElementById('agent-form').reset();
    await cargarAgentes();
    await cargarTickets();
  }
}

async function crearTicket(e) {
  e.preventDefault();
  const body = {
    cliente: document.getElementById('ticket-cliente').value,
    asunto: document.getElementById('ticket-asunto').value,
    prioridad: document.getElementById('ticket-prioridad').value
  };

  const res = await fetch('/api/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!res.ok) {
    mostrarMensaje(data.mensaje);
  } else {
    document.getElementById('ticket-form').reset();
    cargarTickets();
  }
}

async function asignarAgente(ticketId) {
  const agenteId = document.getElementById(`select-agente-${ticketId}`).value;
  if (!agenteId) return mostrarMensaje('Selecciona un agente válido');

  const res = await fetch(`/api/tickets/${ticketId}/asignar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agenteId })
  });

  if (res.ok) cargarTickets();
  else {
    const data = await res.json();
    mostrarMensaje(data.mensaje);
  }
}

async function marcarResuelto(id) {
  const res = await fetch(`/api/tickets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado: 'resuelto' })
  });

  if (res.ok) cargarTickets();
}

async function eliminarTicket(id) {
  if (!confirm('¿Desea eliminar el ticket?')) return;
  const res = await fetch(`/api/tickets/${id}`, { method: 'DELETE' });
  if (res.ok) cargarTickets();
}

async function agregarComentario(e, ticketId) {
  e.preventDefault();
  const autor = document.getElementById(`autor-${ticketId}`).value;
  const texto = document.getElementById(`texto-${ticketId}`).value;

  const res = await fetch(`/api/tickets/${ticketId}/comentarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ autor, texto })
  });

  if (res.ok) cargarTickets();
  else {
    const data = await res.json();
    mostrarMensaje(data.mensaje);
  }
}