// =====================================================================
// PETSTYLE · FRONTEND (SPA) — consume la API REST del backend
// Roles: CLIENTE y ADMINISTRADOR, cada uno con su propia vista.
// =====================================================================

const ESTADOS_TERMINALES = ['Entregada', 'Rechazada', 'Cancelada'];
const INTERVALO_REFRESCO_MS = 5000; // "tiempo real" por consulta periódica

// Rutas de la SPA (una por vista). El router las protege según el rol.
const RUTA_LOGIN = '#/login';
const RUTA_CLIENTE = '#/cliente';
const RUTA_ADMIN = '#/admin';
const rutaDeRol = (rol) => (rol === 'ADMINISTRADOR' ? RUTA_ADMIN : RUTA_CLIENTE);

// Estado local
let perfilActual = null; // { id, nombre, email, telefono, rol }
let rolLogin = 'CLIENTE'; // tipo de acceso elegido en la pantalla de login
let listaCitasGlobal = [];
let timerRefresco = null;

// ---------------------------------------------------------------------
// Cliente HTTP: agrega el token y normaliza errores
// ---------------------------------------------------------------------
const TOKEN_KEY = 'petstyle_token';
const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

async function api(metodo, ruta, cuerpo) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let resp;
  try {
    resp = await fetch(`/api${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor');
  }

  const datos = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const err = new Error(datos.error || 'Error inesperado');
    err.status = resp.status;
    throw err;
  }
  return datos;
}

// Escapa texto del usuario antes de insertarlo en innerHTML (evita XSS)
function esc(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// ELEMENTOS DOM
const pantallaLogin = document.getElementById('pantalla-login');
const pantallaSistema = document.getElementById('pantalla-sistema');
const vistaCliente = document.getElementById('vista-cliente');
const vistaAdmin = document.getElementById('vista-admin');
const labelUsuario = document.getElementById('label-usuario');
const btnLogout = document.getElementById('btn-logout');

const formAuthLogin = document.getElementById('form-auth-login');
const formAuthRegistro = document.getElementById('form-auth-registro');
const selectorRolLogin = document.getElementById('login-rol');
const loginHint = document.getElementById('login-hint');

const checkRuta = document.getElementById('check-ruta');
const boxDireccion = document.getElementById('box-direccion');
const inputDireccion = document.getElementById('cita-direccion');
const inputFechaCita = document.getElementById('cita-fecha');
const formMascota = document.getElementById('form-mascota');
const formCita = document.getElementById('form-cita');
const selectMascotas = document.getElementById('cita-mascota');
const listaMascotasEl = document.getElementById('lista-mascotas');
const mascotaEditId = document.getElementById('mascota-edit-id');
const btnGuardarMascota = document.getElementById('btn-guardar-mascota');
const btnCancelarEdicion = document.getElementById('btn-cancelar-edicion');
const listaMisCitasEl = document.getElementById('lista-mis-citas');

const btnCargarCitas = document.getElementById('btn-cargar-citas');
const contenedorCitas = document.getElementById('contenedor-citas');
const filtroBuscar = document.getElementById('filtro-buscar');
const filtroEstado = document.getElementById('filtro-estado');

// =====================================================================
// UI · NOTIFICACIONES TOAST
// =====================================================================
let toastTimer = null;
function mostrarNotificacion(mensaje, esError = false) {
  const toastEl = document.getElementById('app-toast');
  const toastMsg = document.getElementById('toast-mensaje');
  const toastIcon = toastEl.querySelector('.toast__icon');

  toastMsg.textContent = mensaje;
  toastEl.classList.toggle('toast--error', esError);
  toastIcon.className = `ph-fill ${esError ? 'ph-warning-circle' : 'ph-check-circle'} toast__icon`;

  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3800);
}
document.querySelector('.toast__close').addEventListener('click', () => {
  document.getElementById('app-toast').classList.remove('show');
});

function bloquearBoton(boton, textoCarga) {
  boton.dataset.textoOriginal = boton.textContent;
  boton.textContent = textoCarga;
  boton.disabled = true;
}
function liberarBoton(boton) {
  boton.textContent = boton.dataset.textoOriginal || boton.textContent;
  boton.disabled = false;
}

// =====================================================================
// ROUTER (SPA) + GUARDIA POR ROL (RBAC en la interfaz)
// #/login   -> pantalla de acceso (solo sin sesión)
// #/cliente -> vista del cliente   (solo rol CLIENTE)
// #/admin   -> vista del administrador (solo rol ADMINISTRADOR)
// La seguridad real la impone el backend; esto solo guía la navegación.
// =====================================================================
function irA(hash) {
  if (location.hash === hash) renderRuta();
  else location.hash = hash; // dispara 'hashchange' -> renderRuta()
}

function detenerRefresco() {
  clearInterval(timerRefresco);
  timerRefresco = null;
}

function renderRuta() {
  const hash = location.hash || RUTA_LOGIN;

  // Sin sesión: siempre al login
  if (!perfilActual) {
    detenerRefresco();
    pantallaSistema.classList.add('d-none');
    pantallaLogin.classList.remove('d-none');
    if (location.hash !== RUTA_LOGIN) history.replaceState(null, '', RUTA_LOGIN);
    return;
  }

  // Con sesión: solo puede estar en la ruta de SU rol
  const destino = rutaDeRol(perfilActual.rol);
  if (hash !== destino) {
    if (hash === RUTA_ADMIN || hash === RUTA_CLIENTE) {
      mostrarNotificacion('Zona restringida: no tienes acceso a esa sección', true);
    }
    history.replaceState(null, '', destino);
  }

  pantallaLogin.classList.add('d-none');
  pantallaSistema.classList.remove('d-none');
  detenerRefresco();

  if (perfilActual.rol === 'ADMINISTRADOR') montarVistaAdmin();
  else montarVistaCliente();
}
window.addEventListener('hashchange', renderRuta);

async function montarVistaCliente() {
  labelUsuario.innerHTML = `<i class="ph-fill ph-heart"></i> ${esc(perfilActual.nombre)}`;
  vistaCliente.classList.remove('d-none');
  vistaAdmin.classList.add('d-none');

  // No permitir fechas pasadas en el selector
  const ahora = new Date();
  ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
  inputFechaCita.min = ahora.toISOString().slice(0, 16);

  await cargarMascotas();
  await cargarMisCitas();
  timerRefresco = setInterval(cargarMisCitas, INTERVALO_REFRESCO_MS);
}

async function montarVistaAdmin() {
  labelUsuario.innerHTML = `<i class="ph ph-identification-badge"></i> Administrador: ${esc(perfilActual.nombre)}`;
  vistaAdmin.classList.remove('d-none');
  vistaCliente.classList.add('d-none');

  await cargarCitasAdmin();
  timerRefresco = setInterval(cargarCitasAdmin, INTERVALO_REFRESCO_MS);
}

// =====================================================================
// AUTENTICACIÓN (FN-01)
// =====================================================================

// Tabs Ingresar / Crear cuenta
const tabButtons = document.querySelectorAll('.tab-btn');
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');

    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    document.getElementById(btn.dataset.target).classList.add('active');
  });
});

// Selector de tipo de acceso: Cliente / Administrador
const TEXTOS_HINT = {
  CLIENTE: '<i class="ph ph-paw-print"></i> Accede para gestionar tus mascotas y tus citas.',
  ADMINISTRADOR: '<i class="ph ph-shield-check"></i> Acceso al panel operativo. Las cuentas de Administrador las crea el responsable del sistema.'
};
selectorRolLogin.querySelectorAll('.role-switch__opt').forEach(opt => {
  opt.addEventListener('click', () => {
    rolLogin = opt.dataset.value;
    selectorRolLogin.querySelectorAll('.role-switch__opt').forEach(o => {
      const activo = o === opt;
      o.classList.toggle('active', activo);
      o.setAttribute('aria-checked', String(activo));
    });
    loginHint.innerHTML = TEXTOS_HINT[rolLogin];
  });
});

// Registro público: el servidor SIEMPRE crea la cuenta como CLIENTE.
formAuthRegistro.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nombre = document.getElementById('reg-nombre').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const telefono = document.getElementById('reg-telefono').value.trim();
  const password = document.getElementById('reg-password').value;

  const btn = document.getElementById('btn-registro-submit');
  bloquearBoton(btn, 'Creando cuenta…');

  try {
    const { token, perfil } = await api('POST', '/auth/registro', { nombre, email, telefono, password });
    setToken(token);
    perfilActual = perfil;
    formAuthRegistro.reset();
    mostrarNotificacion(`¡Bienvenido a PetStyle, ${nombre}! Registro exitoso 🎉`);
    irA(rutaDeRol(perfil.rol));
  } catch (err) {
    mostrarNotificacion(err.message, true);
  } finally {
    liberarBoton(btn);
  }
});

// Login: el servidor verifica credenciales Y que la cuenta tenga el rol elegido.
formAuthLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-usuario').value.trim();
  const password = document.getElementById('login-password').value;

  const btn = document.getElementById('btn-login-submit');
  bloquearBoton(btn, 'Verificando…');

  try {
    const { token, perfil } = await api('POST', '/auth/login', { email, password, rol: rolLogin });
    setToken(token);
    perfilActual = perfil;
    formAuthLogin.reset();
    irA(rutaDeRol(perfil.rol)); // cada rol aterriza en SU vista
  } catch (err) {
    mostrarNotificacion(err.message, true);
  } finally {
    liberarBoton(btn);
  }
});

function cerrarSesion(mensaje = 'Sesión cerrada') {
  detenerRefresco();
  setToken(null);
  perfilActual = null;
  if (mensaje) mostrarNotificacion(mensaje);
  irA(RUTA_LOGIN);
}
btnLogout.addEventListener('click', () => cerrarSesion());

// Si el token venció o el rol cambió, el servidor responde 401 y volvemos al login
function manejarErrorSesion(err) {
  if (err.status === 401) {
    cerrarSesion('Tu sesión expiró. Inicia sesión de nuevo.');
    return true;
  }
  return false;
}

// Dirección de recogida condicional (FN-03)
checkRuta.addEventListener('change', () => {
  if (checkRuta.checked) {
    boxDireccion.classList.remove('d-none');
    inputDireccion.setAttribute('required', 'true');
  } else {
    boxDireccion.classList.add('d-none');
    inputDireccion.removeAttribute('required');
  }
});

// =====================================================================
// VISTA CLIENTE · MASCOTAS (FN-02: CRUD)
// =====================================================================
function limpiarFormularioMascota() {
  formMascota.reset();
  mascotaEditId.value = '';
  btnGuardarMascota.textContent = 'Guardar mascota';
  btnCancelarEdicion.classList.add('d-none');
}
btnCancelarEdicion.addEventListener('click', limpiarFormularioMascota);

formMascota.addEventListener('submit', async (e) => {
  e.preventDefault();
  const cuerpo = {
    nombre: document.getElementById('mascota-nombre').value.trim(),
    especie: document.getElementById('mascota-especie').value,
    raza: document.getElementById('mascota-raza').value.trim(),
    edad: document.getElementById('mascota-edad').value
  };
  const idEnEdicion = mascotaEditId.value;

  try {
    if (idEnEdicion) {
      await api('PUT', `/mascotas/${idEnEdicion}`, cuerpo);
      mostrarNotificacion('🐾 Mascota actualizada correctamente');
      limpiarFormularioMascota();
    } else {
      await api('POST', '/mascotas', cuerpo);
      mostrarNotificacion('🐾 Mascota agregada correctamente');
      formMascota.reset();
    }
    await cargarMascotas();
  } catch (err) {
    if (!manejarErrorSesion(err)) mostrarNotificacion(err.message, true);
  }
});

async function cargarMascotas() {
  let mascotas;
  try {
    mascotas = await api('GET', '/mascotas');
  } catch (err) {
    if (manejarErrorSesion(err)) return;
    selectMascotas.innerHTML = '<option value="">No se pudieron cargar tus mascotas</option>';
    listaMascotasEl.innerHTML = `<p class="pet-list__empty">Error al cargar mascotas.</p>`;
    return;
  }

  const seleccionPrevia = selectMascotas.value;
  if (mascotas.length === 0) {
    selectMascotas.innerHTML = '<option value="">Sin mascotas. ¡Registra una!</option>';
    listaMascotasEl.innerHTML = `<p class="pet-list__empty">Aún no has registrado mascotas.</p>`;
    return;
  }

  selectMascotas.innerHTML = '<option value="">Selecciona tu mascota...</option>' +
    mascotas.map(m => `<option value="${m.id}">${esc(m.nombre)} (${esc(m.especie)} - ${esc(m.raza)})</option>`).join('');
  if (seleccionPrevia) selectMascotas.value = seleccionPrevia;

  listaMascotasEl.innerHTML = '';
  mascotas.forEach(m => {
    const icono = m.especie === 'Gato' ? 'ph-cat' : 'ph-dog';
    const item = document.createElement('div');
    item.className = 'pet-item animate-fade-in';
    item.innerHTML = `
      <span class="pet-item__icon"><i class="ph-fill ${icono}"></i></span>
      <span class="pet-item__info">
        <span class="pet-item__name">${esc(m.nombre)}</span>
        <span class="pet-item__meta">${esc(m.especie)} · ${esc(m.raza)}${m.edad != null ? ` · ${m.edad} ${m.edad === 1 ? 'año' : 'años'}` : ''}</span>
      </span>
      <span class="pet-item__actions">
        <button type="button" class="icon-btn" title="Editar" data-accion="editar" data-id="${m.id}"><i class="ph ph-pencil-simple"></i></button>
        <button type="button" class="icon-btn icon-btn--danger" title="Eliminar" data-accion="eliminar" data-id="${m.id}"><i class="ph ph-trash"></i></button>
      </span>
    `;
    listaMascotasEl.appendChild(item);
  });

  listaMascotasEl.querySelectorAll('[data-accion="editar"]').forEach(btn => {
    btn.addEventListener('click', () => iniciarEdicionMascota(btn.dataset.id, mascotas));
  });
  listaMascotasEl.querySelectorAll('[data-accion="eliminar"]').forEach(btn => {
    btn.addEventListener('click', () => eliminarMascota(btn.dataset.id));
  });
}

function iniciarEdicionMascota(id, mascotas) {
  const mascota = mascotas.find(m => String(m.id) === String(id));
  if (!mascota) return;

  document.getElementById('mascota-nombre').value = mascota.nombre;
  document.getElementById('mascota-especie').value = mascota.especie;
  document.getElementById('mascota-raza').value = mascota.raza;
  document.getElementById('mascota-edad').value = mascota.edad ?? '';
  mascotaEditId.value = mascota.id;

  btnGuardarMascota.textContent = 'Actualizar mascota';
  btnCancelarEdicion.classList.remove('d-none');
  formMascota.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function eliminarMascota(id) {
  if (!window.confirm('¿Eliminar esta mascota? Esta acción no se puede deshacer.')) return;
  try {
    await api('DELETE', `/mascotas/${id}`);
    mostrarNotificacion('Mascota eliminada');
    if (mascotaEditId.value === String(id)) limpiarFormularioMascota();
    await cargarMascotas();
  } catch (err) {
    if (!manejarErrorSesion(err)) mostrarNotificacion(err.message, true);
  }
}

// =====================================================================
// VISTA CLIENTE · CITAS (FN-03 agendar + FN-04 estado en "Mis citas")
// =====================================================================
formCita.addEventListener('submit', async (e) => {
  e.preventDefault();
  const mascota_id = selectMascotas.value;
  const requiere_ruta = checkRuta.checked;

  if (!mascota_id) return mostrarNotificacion('Selecciona una mascota', true);

  try {
    await api('POST', '/citas', {
      mascota_id: Number(mascota_id),
      servicio: document.getElementById('cita-servicio').value,
      estilo_corte: document.getElementById('cita-corte').value,
      especificaciones: document.getElementById('cita-notas').value,
      requiere_ruta,
      direccion: requiere_ruta ? inputDireccion.value : null,
      fecha_hora: inputFechaCita.value
    });
    mostrarNotificacion('✨ ¡Cita agendada exitosamente! Quedó en estado Pendiente.');
    formCita.reset();
    boxDireccion.classList.add('d-none');
    await cargarMisCitas();
  } catch (err) {
    if (!manejarErrorSesion(err)) mostrarNotificacion(err.message, true);
  }
});

async function cargarMisCitas() {
  if (!perfilActual || perfilActual.rol !== 'CLIENTE') return;
  try {
    renderizarMisCitas(await api('GET', '/citas/mias'));
  } catch (err) {
    if (manejarErrorSesion(err)) return;
    listaMisCitasEl.innerHTML = `<p class="pet-list__empty">No se pudieron cargar tus citas.</p>`;
  }
}

function renderizarMisCitas(citas) {
  if (citas.length === 0) {
    listaMisCitasEl.innerHTML = `<p class="pet-list__empty">Aún no has agendado ninguna cita.</p>`;
    return;
  }

  listaMisCitasEl.innerHTML = citas.map(c => {
    const fecha = new Date(c.fecha_hora).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
    const botonCancelar = c.estado === 'Pendiente'
      ? `<button type="button" class="btn-mini" data-cancelar="${c.id}">Cancelar cita</button>` : '';
    return `
      <div class="mi-cita-item">
        <span class="mi-cita-item__info">
          <span class="pet-item__name">${esc(c.mascota_nombre)} · ${esc(c.servicio)}</span>
          <span class="pet-item__meta"><i class="ph ph-clock"></i> ${fecha}${c.requiere_ruta ? ' · <i class="ph ph-van"></i> con ruta' : ''}</span>
        </span>
        <span class="mi-cita-item__side">
          <span class="badge ${badgeClaseEstado(c.estado)}">${esc(c.estado)}</span>
          ${botonCancelar}
        </span>
      </div>`;
  }).join('');
}

// Delegación de eventos: el listado se redibuja cada 5 s, así el clic no se pierde
listaMisCitasEl.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-cancelar]');
  if (!btn) return;
  if (!window.confirm('¿Cancelar esta cita?')) return;
  try {
    await api('PATCH', `/citas/${btn.dataset.cancelar}/cancelar`);
    mostrarNotificacion('Cita cancelada');
    await cargarMisCitas();
  } catch (err) {
    if (!manejarErrorSesion(err)) mostrarNotificacion(err.message, true);
    await cargarMisCitas();
  }
});

// =====================================================================
// VISTA ADMINISTRADOR · PANEL OPERATIVO (FN-04)
// =====================================================================
async function cargarCitasAdmin() {
  if (!perfilActual || perfilActual.rol !== 'ADMINISTRADOR') return;
  try {
    listaCitasGlobal = await api('GET', '/citas');
  } catch (err) {
    if (manejarErrorSesion(err)) return;
    contenedorCitas.innerHTML = `<p style="color:var(--coral-deep); padding: 1rem;">Error: ${esc(err.message)}</p>`;
    return;
  }
  actualizarMetricas(listaCitasGlobal);
  aplicarFiltros();
}

function actualizarMetricas(citas) {
  document.getElementById('cnt-total').textContent = citas.length;
  document.getElementById('cnt-pendientes').textContent = citas.filter(c => !ESTADOS_TERMINALES.includes(c.estado)).length;
  document.getElementById('cnt-ruta').textContent = citas.filter(c => c.requiere_ruta).length;
}

function aplicarFiltros() {
  const texto = filtroBuscar.value.toLowerCase();
  const estado = filtroEstado.value;

  renderizarTarjetasCitas(listaCitasGlobal.filter(cita => {
    const mascota = (cita.mascota_nombre || '').toLowerCase();
    const servicio = (cita.servicio || '').toLowerCase();
    return (mascota.includes(texto) || servicio.includes(texto)) &&
           (estado === 'TODOS' || cita.estado === estado);
  }));
}

function badgeClaseEstado(estado) {
  switch (estado) {
    case 'Aprobada': return 'badge--aprobada';
    case 'En proceso': return 'badge--proceso';
    case 'Entregada': return 'badge--entregada';
    case 'Rechazada': return 'badge--rechazada';
    case 'Cancelada': return 'badge--cancelada';
    default: return 'badge--pendiente';
  }
}

// Botones de un clic según el estado actual, o un candado si el ciclo terminó
function construirAccionesRapidas(cita) {
  const botones = [];

  if (cita.estado === 'Pendiente') {
    botones.push(`<button type="button" class="btn--advance" data-accion="Aprobada" data-id="${cita.id}"><i class="ph ph-check-circle"></i> Aprobar</button>`);
    botones.push(`<button type="button" class="btn--advance btn--advance-danger" data-accion="Rechazada" data-id="${cita.id}"><i class="ph ph-x-circle"></i> Rechazar</button>`);
  } else if (cita.estado === 'Aprobada') {
    botones.push(`<button type="button" class="btn--advance" data-accion="En proceso" data-id="${cita.id}"><i class="ph ph-gear-six"></i> Poner en proceso</button>`);
    botones.push(`<button type="button" class="btn--advance btn--advance-danger" data-accion="Rechazada" data-id="${cita.id}"><i class="ph ph-x-circle"></i> Rechazar</button>`);
  } else if (cita.estado === 'En proceso') {
    botones.push(`<button type="button" class="btn--advance" data-accion="Entregada" data-id="${cita.id}"><i class="ph ph-package"></i> Marcar como entregada</button>`);
  }

  if (botones.length === 0) {
    const esCancelacion = cita.estado === 'Rechazada' || cita.estado === 'Cancelada';
    const texto = cita.estado === 'Entregada' ? 'Ciclo completado' : `Cita ${cita.estado.toLowerCase()}`;
    return `<span class="status-locked ${esCancelacion ? 'status-locked--cancel' : ''}"><i class="ph ph-lock-simple"></i> ${texto}</span>`;
  }
  return `<div class="acciones-rapidas">${botones.join('')}</div>`;
}

function renderizarTarjetasCitas(citas) {
  if (citas.length === 0) {
    contenedorCitas.innerHTML = `
      <div class="empty-state">
        <i class="ph ph-tray"></i>
        No se encontraron citas
      </div>`;
    return;
  }

  contenedorCitas.innerHTML = citas.map(cita => {
    const imgUrl = cita.mascota_especie === 'Gato'
      ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=150&q=80'
      : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=150&q=80';
    const fecha = new Date(cita.fecha_hora).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
    const direccion = cita.requiere_ruta ? (cita.direccion || 'Sin especificar') : 'No aplica (sin ruta)';

    return `
      <div class="cita-card">
        <div>
          <div class="cita-card__top">
            <img src="${imgUrl}" class="cita-card__avatar" alt="">
            <div>
              <div class="cita-card__name">${esc(cita.mascota_nombre)}</div>
              <div class="cita-card__breed">${esc(cita.mascota_raza)}</div>
            </div>
            <span class="badge ${badgeClaseEstado(cita.estado)} cita-card__badge">${esc(cita.estado)}</span>
          </div>

          <p class="cita-card__line"><strong>Servicio:</strong> ${esc(cita.servicio)}</p>
          <p class="cita-card__line"><i class="ph ph-clock"></i> ${fecha}</p>
          ${cita.especificaciones ? `<p class="cita-card__notes">"${esc(cita.especificaciones)}"</p>` : ''}

          <div class="cita-card__contacto">
            <p class="cita-card__line"><i class="ph ph-user"></i> <strong>Cliente:</strong> ${esc(cita.cliente_nombre)}</p>
            <p class="cita-card__line"><i class="ph ph-phone"></i> <strong>Teléfono:</strong> ${esc(cita.cliente_telefono || 'No registrado')}</p>
            <p class="cita-card__line ${cita.requiere_ruta ? 'cita-card__route' : ''}"><i class="ph ph-map-pin"></i> <strong>Dirección:</strong> ${esc(direccion)}</p>
          </div>
        </div>

        <div class="cita-card__footer">${construirAccionesRapidas(cita)}</div>
      </div>`;
  }).join('');
}

// Delegación de eventos para los botones de estado
contenedorCitas.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-accion]');
  if (btn) cambiarEstado(btn.dataset.id, btn.dataset.accion);
});

async function cambiarEstado(citaId, nuevoEstado) {
  if (nuevoEstado === 'Rechazada' &&
      !window.confirm('¿Rechazar esta cita? El cliente verá el estado "Rechazada".')) {
    return;
  }
  try {
    await api('PATCH', `/citas/${citaId}/estado`, { estado: nuevoEstado });
    mostrarNotificacion(`Cita actualizada a: ${nuevoEstado}`);
  } catch (err) {
    if (!manejarErrorSesion(err)) mostrarNotificacion(err.message, true);
  }
  await cargarCitasAdmin();
}

btnCargarCitas.addEventListener('click', cargarCitasAdmin);
filtroBuscar.addEventListener('input', aplicarFiltros);
filtroEstado.addEventListener('change', aplicarFiltros);

// =====================================================================
// ARRANQUE: restaura la sesión si ya había un token y navega según el rol
// =====================================================================
document.addEventListener('DOMContentLoaded', async () => {
  if (getToken()) {
    try {
      ({ perfil: perfilActual } = await api('GET', '/auth/me'));
    } catch {
      setToken(null);
      perfilActual = null;
    }
  }
  renderRuta();
});
