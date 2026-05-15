// ===== CONFIGURACIÓN =====
const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

let currentUser = null;
let modoGoogle  = false;
let userId      = 'local';
let isEditingName = false;
let loadingSaveProfile = false;
let profileNameDraft = '';
let profileNameError = '';

// ===== STORAGE =====
function getData(key) {
  try { return JSON.parse(localStorage.getItem(userId + '_' + key)) || []; }
  catch { return []; }
}
function setData(key, val) {
  localStorage.setItem(userId + '_' + key, JSON.stringify(val));
}

function normalizeIngreso(ingreso) {
  const id = typeof ingreso.id === 'string' && !Number.isNaN(parseInt(ingreso.id, 10))
    ? parseInt(ingreso.id, 10)
    : ingreso.id;
  const monto = typeof ingreso.monto === 'string' && ingreso.monto !== ''
    ? parseFloat(ingreso.monto)
    : ingreso.monto;
  const desc = (ingreso.desc || 'Ingreso').toString().trim() || 'Ingreso';
  let fecha = ingreso.fecha || '';
  let mes = ingreso.mes;
  let anio = ingreso.anio;

  if ((mes === undefined || mes === null || anio === undefined || anio === null) && fecha) {
    const d = new Date(fecha + 'T00:00:00');
    if (!Number.isNaN(d.getMonth()) && !Number.isNaN(d.getFullYear())) {
      mes = d.getMonth();
      anio = d.getFullYear();
    }
  }

  if (typeof mes === 'string' && mes !== '') mes = parseInt(mes, 10);
  if (typeof anio === 'string' && anio !== '') anio = parseInt(anio, 10);

  if (!fecha && typeof mes === 'number' && typeof anio === 'number') {
    fecha = `${anio}-${String(mes + 1).padStart(2, '0')}-01`;
  }

  return { ...ingreso, id, monto, desc, fecha, mes, anio, tipo: 'ingreso' };
}

function cargarIngresos() {
  return getData('ingresos').map(normalizeIngreso);
}

function getProfileItem(key) {
  return localStorage.getItem(userId + '_perfil_' + key) || '';
}
function setProfileItem(key, value) {
  localStorage.setItem(userId + '_perfil_' + key, value);
}
function getSavedProfileName() {
  return getProfileItem('nombre');
}
function getCurrentProfileName(googleName = '') {
  const saved = getSavedProfileName();
  return saved || googleName || 'Invitado';
}
function renderPerfilUsuario(nombre = '', email = '') {
  const savedName = getSavedProfileName();
  const currentEmail = document.querySelector('.perfil-email')?.textContent || 'Sin correo';
  const profileName = getCurrentProfileName(nombre);
  const profileEmail = email || currentEmail;
  const profilePhoto = getProfileItem('foto') || '';
  const nombreEl = document.querySelector('.perfil-user-name');
  const emailEl = document.querySelector('.perfil-email');
  const photoEl = document.getElementById('profile-photo');
  const nameDisplay = document.getElementById('profile-name-view');
  const nameEdit = document.getElementById('profile-name-edit');
  const nameInput = document.getElementById('profile-name-input');
  const nameError = document.getElementById('profile-error');
  const saveBtn = document.getElementById('btn-save-profile');
  if (nombreEl) nombreEl.textContent = profileName;
  if (emailEl) emailEl.textContent = profileEmail;
  if (photoEl) photoEl.src = profilePhoto;
  if (nameInput) {
    nameInput.value = profileNameDraft;
    nameInput.disabled = !isEditingName;
    nameInput.setAttribute('aria-invalid', profileNameError ? 'true' : 'false');
  }
  if (nameError) nameError.textContent = profileNameError;
  if (nameDisplay) nameDisplay.style.display = isEditingName ? 'none' : 'flex';
  if (nameEdit) {
    nameEdit.classList.toggle('active', isEditingName);
  }
  if (saveBtn) {
    saveBtn.disabled = loadingSaveProfile;
    saveBtn.textContent = loadingSaveProfile ? 'Guardando...' : 'Guardar';
  }
  const fallback = document.querySelector('.avatar-fallback');
  if (fallback) fallback.style.display = profilePhoto ? 'none' : 'flex';
}
function startEditNombre() {
  isEditingName = true;
  profileNameDraft = '';
  profileNameError = '';
  renderPerfilUsuario();
  setTimeout(() => {
    const input = document.getElementById('profile-name-input');
    if (input) {
      input.focus();
    }
  }, 50);
}
function cancelEditNombre() {
  isEditingName = false;
  profileNameDraft = '';
  profileNameError = '';
  renderPerfilUsuario();
}
function updateProfileDraft(event) {
  profileNameDraft = event.target.value;
  profileNameError = '';
  renderPerfilUsuario();
}
function validateProfileName(name) {
  const trimmed = name.trim();
  if (trimmed.length < 3) return 'El nombre debe tener al menos 3 caracteres';
  if (trimmed.length > 25) return 'Máximo 25 caracteres';
  if (!/^[a-zA-Z0-9_ ]+$/.test(trimmed)) return 'Solo letras, números, espacios y guion bajo';
  return '';
}
function saveNombrePerfil() {
  if (loadingSaveProfile) return;
  const parsedName = profileNameDraft.trim();
  const error = validateProfileName(parsedName);
  if (error) {
    profileNameError = error;
    renderPerfilUsuario();
    return;
  }
  loadingSaveProfile = true;
  profileNameError = '';
  renderPerfilUsuario();
  setTimeout(() => {
    setProfileItem('nombre', parsedName);
    profileNameDraft = parsedName;
    isEditingName = false;
    loadingSaveProfile = false;
    renderPerfilUsuario();
    showToast('✅ Nombre actualizado');
  }, 300);
}
function handleProfilePhoto(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;
    if (typeof dataUrl === 'string') {
      setProfileItem('foto', dataUrl);
      renderPerfilUsuario();
      showToast('✅ Foto de perfil guardada');
    }
  };
  reader.readAsDataURL(file);
}
function showProfileFeedback(message, isError = false) {
  const feedback = document.getElementById('profile-confirmation');
  if (!feedback) return;
  feedback.textContent = message;
  feedback.classList.add('visible');
  feedback.style.background = isError ? 'rgba(255, 121, 97, 0.12)' : 'rgba(0, 227, 140, 0.08)';
  feedback.style.color = isError ? '#E03E3E' : 'var(--success)';
  clearTimeout(feedback._timeout);
  feedback._timeout = setTimeout(() => {
    feedback.classList.remove('visible');
  }, 2800);
}

// ===== NAVEGACIÓN =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  const target = document.getElementById(id);
  if (target) {
    target.classList.add('active');
    target.style.display = '';
  }

  const nav = document.getElementById('bottom-nav-global');
  if (nav) nav.style.display = id === 'screen-bienvenida' || id === 'screen-splash' ? 'none' : 'flex';

  if (id === 'screen-dashboard') actualizarNav('nav-inicio');
  if (id === 'screen-historial') actualizarNav('nav-movimientos');
  if (id === 'screen-servicios') actualizarNav('nav-servicios');
  if (id === 'screen-perfil')    actualizarNav('nav-perfil');
  if (id === 'screen-ingreso' || id === 'screen-gasto') actualizarNav(null);

  if (id === 'screen-dashboard') renderDashboard();
  if (id === 'screen-servicios') renderServicios();
  if (id === 'screen-historial') renderHistorial();
  if (id === 'screen-ingreso')   poblarSelectMes();
  if (id === 'screen-gasto') {
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('gasto-fecha').value = hoy;
  }
  window.scrollTo(0, 0);
}

function actualizarNav(activeId) {
  ['nav-inicio','nav-movimientos','nav-servicios','nav-perfil'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active', el.id === activeId);
  });
}

function navTo(screenId, btn) {
  showScreen(screenId);
}

function ocultarTodosScreens() {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
}

// ===== TOAST =====
function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ===== ENTRADA =====
function entrarAlApp(nombre, email, detalle) {
  // Ocultar todo primero
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });

  // Mostrar nav
  const nav = document.getElementById('bottom-nav-global');
  if (nav) nav.style.display = 'flex';

  // Mostrar dashboard
  const dashboard = document.getElementById('screen-dashboard');
  if (dashboard) {
    dashboard.classList.add('active');
    dashboard.style.display = 'block';
  }

  renderPerfilUsuario(nombre, email, detalle);

  const esInvitado = !modoGoogle;
  const btnGoogle  = document.getElementById('btn-conectar-google');
  const btnSalir   = document.getElementById('btn-cerrar-sesion');
  const cardPass   = document.getElementById('card-cambiar-pass');
  if (btnGoogle) btnGoogle.style.display = esInvitado  ? 'block' : 'none';
  if (btnSalir)  btnSalir.style.display  = !esInvitado ? 'block' : 'none';
  if (cardPass)  cardPass.style.display  = !esInvitado ? 'block' : 'none';

  actualizarNav('nav-inicio');
  renderDashboard();
  window.scrollTo(0, 0);
}

function entrarComoInvitado() {
  const deviceId = localStorage.getItem('cashiro-device-id') || generarDeviceId();
  userId      = 'invitado_' + deviceId;
  modoGoogle  = false;
  currentUser = null;
  entrarAlApp('Sin cuenta', '', 'Datos solo en este dispositivo');
  showToast('💡 Conéctate con Google para respaldar');
}

function generarDeviceId() {
  const id = 'dev_' + Math.random().toString(36).slice(2);
  localStorage.setItem('cashiro-device-id', id);
  return id;
}

function logout() {
  if (modoGoogle && currentUser) logoutGoogle();
  currentUser = null;
  modoGoogle  = false;
  userId      = 'local';
  ocultarTodosScreens();
  const nav = document.getElementById('bottom-nav-global');
  if (nav) nav.style.display = 'none';
  const bienvenida = document.getElementById('screen-bienvenida');
  if (bienvenida) {
    bienvenida.classList.add('active');
    bienvenida.style.display = 'block';
  }
}

function confirmLogout() {
  const modal = document.getElementById('modal-logout');
  if (!modal) return;
  modal.style.display = 'flex';
  modal.style.visibility = 'visible';
  modal.style.pointerEvents = 'all';
  setTimeout(() => modal.classList.add('open'), 10);
}

function closeLogoutModal() {
  const modal = document.getElementById('modal-logout');
  if (!modal) return;
  modal.classList.remove('open');
  setTimeout(() => {
    modal.style.display = 'none';
    modal.style.visibility = 'hidden';
    modal.style.pointerEvents = 'none';
  }, 220);
}

function logoutConfirmed() {
  closeLogoutModal();
  logout();
}

// ===== GOOGLE AUTH =====
async function handleGoogleLogin() {
  showToast('⏳ Conectando con Google...');
  try {
    const user = await loginGoogle();
    if (user) {
      currentUser = user;
      modoGoogle  = true;
      userId      = user.uid;

      const gastosInvitado    = getData('gastos');
      const ingresosInvitado  = cargarIngresos();
      const serviciosInvitado = getData('servicios');
      const hayLocales = gastosInvitado.length || ingresosInvitado.length || serviciosInvitado.length;

      const [gastosNube, ingresosNube, serviciosNube] = await Promise.all([
        obtenerColeccion(user.uid, 'gastos'),
        obtenerColeccion(user.uid, 'ingresos'),
        obtenerColeccion(user.uid, 'servicios')
      ]);
      const hayNube = gastosNube.length || ingresosNube.length || serviciosNube.length;

      if (hayLocales && !hayNube) {
        const promesas = [];
        gastosInvitado.forEach(g    => promesas.push(guardarDato(user.uid, 'gastos',    g.id,     g)));
        ingresosInvitado.forEach(i  => promesas.push(guardarDato(user.uid, 'ingresos',  i.id,     i)));
        serviciosInvitado.forEach(s => promesas.push(guardarDato(user.uid, 'servicios', s.id,     s)));
        await Promise.all(promesas);
        showToast('☁️ Datos migrados a tu cuenta');
      } else if (hayNube) {
        setData('gastos',    gastosNube);
        setData('ingresos',  ingresosNube);
        setData('servicios', serviciosNube);
      }

      entrarAlApp(user.displayName || 'Usuario', user.email, 'Cuenta Google activa');
      showToast('✅ Bienvenido ' + (user.displayName || '').split(' ')[0]);
    } else {
      showToast('❌ Error al conectar con Google');
    }
  } catch(e) {
    console.error(e);
    showToast('❌ Error al conectar con Google');
  }
}

// ===== INGRESO MENSUAL =====
function poblarSelectMes() {
  const sel = document.getElementById('ingreso-mes');
  sel.innerHTML = MESES.map((m, i) =>
    `<option value="${i}" ${i === new Date().getMonth() ? 'selected' : ''}>${m}</option>`
  ).join('');
}

function guardarIngreso() {
  const mesEl = document.getElementById('ingreso-mes');
  const anioEl = document.getElementById('ingreso-anio');
  const montoEl = document.getElementById('ingreso-monto');
  const descEl = document.getElementById('ingreso-desc');
  
  if (!mesEl || !anioEl || !montoEl) { 
    showToast('⚠️ Error: campos faltantes'); 
    return; 
  }
  
  const mes = parseInt(mesEl.value);
  const anio = parseInt(anioEl.value);
  const monto = parseFloat(montoEl.value.replace(/\./g, ''));
  const desc = (descEl?.value || '').trim() || 'Ingreso';
  
  if (!mes && mes !== 0) { showToast('⚠️ Selecciona un mes'); return; }
  if (!anio || anio < 2000 || anio > 2100) { showToast('⚠️ Año inválido'); return; }
  if (!monto || monto <= 0) { showToast('⚠️ Ingresa un monto válido'); return; }
  
  const ingresos = cargarIngresos();
  const fecha = new Date().toISOString().split('T')[0];
  const nuevo = { id: Date.now(), mes, anio, monto, desc, fecha, tipo: 'ingreso' };
  ingresos.push(nuevo);
  setData('ingresos', ingresos);
  
  if (modoGoogle) guardarEnFirebase('ingresos', nuevo.id, nuevo);
  
  montoEl.value = '';
  if (descEl) descEl.value = '';
  showToast('✅ Ingreso guardado');
  renderDashboard();
  showScreen('screen-dashboard');
}

// ===== GASTOS =====
function toggleFechaFin() {
  const tipo = document.getElementById('gasto-tipo').value;
  document.getElementById('grupo-fecha-fin').style.display = tipo === 'fijo' ? 'block' : 'none';
}

function toggleFechaFinEdit() {
  const tipo = document.getElementById('edit-tipo').value;
  document.getElementById('edit-grupo-fecha-fin').style.display = tipo === 'fijo' ? 'block' : 'none';
  document.getElementById('edit-estado-fijo').style.display     = tipo === 'fijo' ? 'block' : 'none';
}

function guardarGasto() {
  const cat      = document.getElementById('gasto-categoria').value;
  const desc     = document.getElementById('gasto-desc').value.trim();
  const monto = parseFloat(
  document.getElementById('gasto-monto').value.replace(/\./g, '')
);
  const fecha    = document.getElementById('gasto-fecha').value;
  const tipo     = document.getElementById('gasto-tipo').value;
  const fechaFin = tipo === 'fijo' ? document.getElementById('gasto-fecha-fin').value : null;

  if (!desc)                { showToast('⚠️ Escribe una descripción'); return; }
  if (!monto || monto <= 0) { showToast('⚠️ Ingresa un monto válido'); return; }
  if (!fecha)               { showToast('⚠️ Selecciona una fecha'); return; }

  const gastos = getData('gastos');
  const nuevo  = { id: Date.now(), cat, desc, monto, fecha, tipo, fechaFin, activo: true };
  gastos.push(nuevo);
  setData('gastos', gastos);
  if (modoGoogle) guardarEnFirebase('gastos', nuevo.id, nuevo);

  document.getElementById('gasto-desc').value      = '';
  document.getElementById('gasto-monto').value     = '';
  document.getElementById('gasto-fecha-fin').value = '';
  document.getElementById('grupo-fecha-fin').style.display = 'none';
  document.getElementById('gasto-tipo').value      = 'variable';
  showToast(tipo === 'fijo' ? '🔁 Gasto fijo guardado' : '✅ Gasto guardado');
  showScreen('screen-dashboard');
}

// ===== MODAL EDITAR =====
function abrirModalReal() {
  const modal = document.getElementById('modal-editar');
  modal.style.display       = 'flex';
  modal.style.visibility    = 'visible';
  modal.style.pointerEvents = 'all';
  setTimeout(() => modal.classList.add('open'), 10);
}

function cerrarModal() {
  const modal = document.getElementById('modal-editar');
  modal.classList.remove('open');
  setTimeout(() => {
    modal.style.display       = 'none';
    modal.style.visibility    = 'hidden';
    modal.style.pointerEvents = 'none';
  }, 300);
}

function abrirModal(id, movType = 'gasto') {
  const modal = document.getElementById('modal-editar');
  const title = modal.querySelector('.modal-title');
  const movInput = document.getElementById('edit-movtype');
  const catGroup = document.getElementById('edit-categoria-group');
  const tipoGroup = document.getElementById('edit-tipo-group');
  const fechaFinGroup = document.getElementById('edit-grupo-fecha-fin');
  const estadoFijo = document.getElementById('edit-estado-fijo');
  const btn = document.getElementById('btn-toggle-activo');

  movInput.value = movType;
  if (movType === 'ingreso') {
    const ingresos = cargarIngresos();
    const i = ingresos.find(item => String(item.id) === String(id));
    if (!i) return;
    title.textContent = '✏️ Editar Ingreso';
    document.getElementById('edit-id').value = i.id;
    document.getElementById('edit-desc').value = i.desc;
    document.getElementById('edit-monto').value = i.monto;
    document.getElementById('edit-fecha').value = i.fecha || '';
    if (catGroup) catGroup.style.display = 'none';
    if (tipoGroup) tipoGroup.style.display = 'none';
    if (fechaFinGroup) fechaFinGroup.style.display = 'none';
    if (estadoFijo) estadoFijo.style.display = 'none';
    btn.style.display = 'none';
  } else {
    const gastos = getData('gastos');
    const g = gastos.find(item => String(item.id) === String(id));
    if (!g) return;
    title.textContent = '✏️ Editar Gasto';
    document.getElementById('edit-id').value = g.id;
    document.getElementById('edit-desc').value = g.desc;
    document.getElementById('edit-monto').value = g.monto;
    document.getElementById('edit-fecha').value = g.fecha || '';
    document.getElementById('edit-categoria').value = g.cat;
    document.getElementById('edit-tipo').value = g.tipo || 'variable';
    document.getElementById('edit-fecha-fin').value = g.fechaFin || '';
    const esFijo = g.tipo === 'fijo';
    if (catGroup) catGroup.style.display = 'block';
    if (tipoGroup) tipoGroup.style.display = 'block';
    if (fechaFinGroup) fechaFinGroup.style.display = esFijo ? 'block' : 'none';
    if (estadoFijo) estadoFijo.style.display = esFijo ? 'block' : 'none';
    btn.style.display = 'inline-flex';
    btn.textContent = g.activo !== false ? '⏸️ Desactivar este gasto fijo' : '▶️ Reactivar este gasto fijo';
    btn.className = g.activo !== false ? 'btn-toggle-fijo' : 'btn-toggle-fijo reactivar';
  }
  abrirModalReal();
}

function guardarEdicion() {
  const movType = document.getElementById('edit-movtype').value || 'gasto';
  const id       = document.getElementById('edit-id').value;
  const desc     = document.getElementById('edit-desc').value.trim();
const monto = parseFloat(
  document.getElementById('edit-monto').value.replace(/\./g, '')
);
  const fecha    = document.getElementById('edit-fecha').value;
  if (!desc)                { showToast('⚠️ Escribe una descripción'); return; }
  if (!monto || monto <= 0) { showToast('⚠️ Monto inválido'); return; }

  if (movType === 'ingreso') {
    const ingresos = cargarIngresos();
    const idx = ingresos.findIndex(i => String(i.id) === String(id));
    if (idx >= 0) {
      const date = fecha || ingresos[idx].fecha;
      const d = new Date(date + 'T00:00:00');
      const mes = !Number.isNaN(d.getMonth()) ? d.getMonth() : ingresos[idx].mes;
      const anio = !Number.isNaN(d.getFullYear()) ? d.getFullYear() : ingresos[idx].anio;
      ingresos[idx] = { id, desc, monto, fecha: date, mes, anio, tipo: 'ingreso' };
      if (modoGoogle) guardarEnFirebase('ingresos', parseInt(id, 10), ingresos[idx]);
    }
    setData('ingresos', ingresos);
    cerrarModal();
    showToast('✅ Ingreso actualizado');
  } else {
    const cat      = document.getElementById('edit-categoria').value;
    const tipo     = document.getElementById('edit-tipo').value;
    const fechaFin = tipo === 'fijo' ? document.getElementById('edit-fecha-fin').value : null;
    const gastos = getData('gastos');
    const idx    = gastos.findIndex(g => String(g.id) === String(id));
    if (idx >= 0) {
      const activo = gastos[idx].activo !== false;
      gastos[idx]  = { id, cat, desc, monto, fecha, tipo, fechaFin, activo };
      if (modoGoogle) guardarEnFirebase('gastos', parseInt(id, 10), gastos[idx]);
    }
    setData('gastos', gastos);
    cerrarModal();
    showToast('✅ Gasto actualizado');
  }

  renderDashboard();
  renderHistorial();
}

function eliminarGasto() {
  const movType = document.getElementById('edit-movtype').value || 'gasto';
  const id = document.getElementById('edit-id').value;
  if (!confirm('¿Seguro que quieres eliminar este movimiento?')) return;

  if (movType === 'ingreso') {
    const ingresos = cargarIngresos();
    const ingresoAEliminar = ingresos.find(i => String(i.id) === String(id));
    const nuevosIngresos = ingresos.filter(i => String(i.id) !== String(id));
    setData('ingresos', nuevosIngresos);

    if (modoGoogle && currentUser && ingresoAEliminar) {
      // Intentar eliminar con ambos formatos de ID
      const idNumerico = String(ingresoAEliminar.id);
      const idMesAnio  = `${ingresoAEliminar.mes}_${ingresoAEliminar.anio}`;
      Promise.all([
        eliminarDato(currentUser.uid, 'ingresos', idNumerico),
        eliminarDato(currentUser.uid, 'ingresos', idMesAnio)
      ]).then(() => console.log('Ingreso eliminado de Firebase'))
        .catch(e => console.error('Error Firebase:', e));
    }
    showToast('🗑️ Ingreso eliminado');

  } else {
    const gastos = getData('gastos');
    const nuevosGastos = gastos.filter(g => String(g.id) !== String(id));
    setData('gastos', nuevosGastos);
    if (modoGoogle && currentUser) {
      eliminarDato(currentUser.uid, 'gastos', String(id))
        .catch(e => console.error('Error Firebase:', e));
    }
    showToast('🗑️ Gasto eliminado');
  }

  cerrarModal();
  renderDashboard();
  renderHistorial();
}

function toggleActivoFijo() {
  const id     = document.getElementById('edit-id').value;
  const gastos = getData('gastos');
  const idx    = gastos.findIndex(g => String(g.id) === String(id));
  if (idx < 0) return;
  gastos[idx].activo = gastos[idx].activo === false;
  setData('gastos', gastos);
  if (modoGoogle) guardarEnFirebase('gastos', parseInt(id, 10), gastos[idx]);
  const activo = gastos[idx].activo;
  const btn    = document.getElementById('btn-toggle-activo');
  btn.textContent = activo ? '⏸️ Desactivar este gasto fijo' : '▶️ Reactivar este gasto fijo';
  btn.className   = activo ? 'btn-toggle-fijo' : 'btn-toggle-fijo reactivar';
  showToast(activo ? '▶️ Gasto fijo reactivado' : '⏸️ Gasto fijo desactivado');
  renderDashboard();
}

// ===== SERVICIOS =====
function guardarServicio() {
  const nombre = document.getElementById('srv-nombre').value.trim();
  const monto = parseFloat(
  document.getElementById('srv-monto').value.replace(/\./g, '')
);
  const dia    = parseInt(document.getElementById('srv-dia').value);
  if (!nombre)                     { showToast('⚠️ Escribe el nombre'); return; }
  if (!monto || monto <= 0)        { showToast('⚠️ Monto inválido'); return; }
  if (!dia || dia < 1 || dia > 31) { showToast('⚠️ Día inválido (1-31)'); return; }
  const servicios = getData('servicios');
  const nuevo = { id: Date.now(), nombre, monto, dia };
  servicios.push(nuevo);
  setData('servicios', servicios);
  if (modoGoogle) guardarEnFirebase('servicios', nuevo.id, nuevo);
  document.getElementById('srv-nombre').value = '';
  document.getElementById('srv-monto').value  = '';
  document.getElementById('srv-dia').value    = '';
  showToast('✅ Servicio agregado');
  renderServicios();
}

function eliminarServicio(id) {
  setData('servicios', getData('servicios').filter(s => s.id !== id));
  if (modoGoogle) eliminarDeFirebase('servicios', id);
  renderServicios();
  showToast('🗑️ Servicio eliminado');
}

function renderServicios() {
  const lista = document.getElementById('lista-servicios');
  if (!lista) return;
  const servicios = getData('servicios');
  lista.innerHTML = servicios.length === 0
    ? '<p style="color:var(--text-muted);text-align:center;padding:20px">No tienes servicios registrados</p>'
    : servicios.map(s => `
      <div class="servicio-item">
        <div class="srv-info">
          <span class="srv-nombre">🔔 ${s.nombre}</span>
          <span class="srv-dia">Vence el día ${s.dia} de cada mes</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <span class="srv-monto">$${formatNum(s.monto)}</span>
          <button class="btn-del" onclick="eliminarServicio(${s.id})">✕</button>
        </div>
      </div>`).join('');
}

// ===== GASTOS FIJOS =====
function obtenerGastosDeMes(gastos, mes, anio) {
  const resultado = [];
  gastos.forEach(g => {
    if (g.tipo === 'fijo') {
      if (g.activo === false) return;
      const inicio  = new Date(g.fecha + 'T00:00:00');
      const despues = anio > inicio.getFullYear() ||
        (anio === inicio.getFullYear() && mes >= inicio.getMonth());
      if (!despues) return;
      if (g.fechaFin) {
        const [finAnio, finMes] = g.fechaFin.split('-').map(Number);
        if (!(anio < finAnio || (anio === finAnio && mes <= finMes - 1))) return;
      }
      resultado.push({
        ...g,
        fecha: `${anio}-${String(mes+1).padStart(2,'0')}-${String(inicio.getDate()).padStart(2,'0')}`,
        esFijoVirtual: true
      });
    } else {
      const d = new Date(g.fecha + 'T00:00:00');
      if (d.getMonth() === mes && d.getFullYear() === anio) resultado.push(g);
    }
  });
  return resultado;
}

// ===== DASHBOARD =====
function renderDashboard() {
  const hoy  = new Date();
  const mes  = hoy.getMonth();
  const anio = hoy.getFullYear();
  const ingresos     = cargarIngresos();
  const ingresosMes  = ingresos.filter(i => i.mes === mes && i.anio === anio);
  const totalIngreso = ingresosMes.reduce((a, i) => a + i.monto, 0);
  const gastos       = getData('gastos');
  const gastosMes    = obtenerGastosDeMes(gastos, mes, anio);
  const totalGastos  = gastosMes.reduce((a, g) => a + g.monto, 0);
  const saldo        = totalIngreso - totalGastos;

  document.getElementById('saldo-display').textContent = '$' + formatNum(saldo);
  document.getElementById('mes-display').textContent =
    `${MESES[mes]} ${anio}  ·  Ingreso $${formatNum(totalIngreso)}  ·  Gastos $${formatNum(totalGastos)}`;

  const saldoEl = document.getElementById('saldo-display');
  saldoEl.style.background = saldo >= 0
    ? 'linear-gradient(90deg,#00E38C,#3A86FF)'
    : 'linear-gradient(90deg,#FF4D6D,#FFC857)';
  saldoEl.style.webkitBackgroundClip = 'text';
  saldoEl.style.webkitTextFillColor  = 'transparent';

  const pct = totalIngreso > 0 ? Math.min((totalGastos / totalIngreso) * 100, 100) : 0;
  const bar  = document.getElementById('balance-bar');
  const lbl  = document.getElementById('balance-bar-pct');
  if (bar) {
    bar.style.width      = pct + '%';
    bar.style.background = pct > 85
      ? 'linear-gradient(90deg,#FF4D6D,#FFC857)'
      : 'linear-gradient(90deg,#00E38C,#3A86FF)';
  }
  if (lbl) lbl.textContent = Math.round(pct) + '% gastado';

  renderVencimientos(hoy);

  const movimientos = [
    ...gastos.map(g => ({ ...g, movType: 'gasto', fecha: g.fecha })),
    ...ingresos.map(i => ({ ...i, movType: 'ingreso', fecha: i.fecha || `${i.anio}-${String(i.mes + 1).padStart(2, '0')}-01` }))
  ]
    .filter(m => m.fecha)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 5);

  const listaG = document.getElementById('lista-gastos-recientes');
  listaG.innerHTML = movimientos.length === 0
    ? '<p style="color:var(--text-muted);text-align:center;padding:20px">Sin movimientos registrados</p>'
    : movimientos.map(m => `
        <div class="gasto-item" onclick="abrirModal(${m.id}, '${m.movType}')">
          <div class="gasto-info">
            <span class="gasto-cat">${m.movType === 'ingreso' ? 'Ingreso' : m.cat}${m.tipo === 'fijo' ? '<span class="badge-fijo">FIJO</span>' : ''}</span>
            <span class="gasto-desc">${m.desc}</span>
            <span class="gasto-fecha-small">${formatFecha(m.fecha)}</span>
          </div>
          <span class="${m.movType === 'ingreso' ? 'gasto-monto-pos' : 'gasto-monto-neg'}">${m.movType === 'ingreso' ? '+' : '-'}$${formatNum(m.monto)}</span>
        </div>`).join('') + '<p class="edit-hint">Toca cualquier movimiento para editar ✏️</p>';
}

function renderVencimientos(hoy) {
  const servicios = getData('servicios');
  const lista     = document.getElementById('lista-vencimientos');
  if (!lista) return;
  if (servicios.length === 0) {
    lista.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px">Sin servicios registrados</p>';
    return;
  }
  const items = servicios.map(s => {
    let venc = new Date(hoy.getFullYear(), hoy.getMonth(), s.dia);
    if (venc < hoy) venc = new Date(hoy.getFullYear(), hoy.getMonth() + 1, s.dia);
    const dias = Math.ceil((venc - hoy) / 86400000);
    let badge, clase;
    if (dias <= 3)      { badge = `⚠️ ${dias}d`; clase = 'badge-urgente'; }
    else if (dias <= 7) { badge = `🔔 ${dias}d`; clase = 'badge-pronto';  }
    else                { badge = `✅ ${dias}d`;  clase = 'badge-ok';      }
    return { s, dias, badge, clase, venc };
  }).sort((a, b) => a.dias - b.dias);
  lista.innerHTML = items.map(({ s, venc, badge, clase }) => `
    <div class="venc-item">
      <div class="venc-info">
        <span class="venc-nombre">${s.nombre}</span>
        <span class="venc-fecha">Vence: ${formatFecha(venc.toISOString().split('T')[0])} · $${formatNum(s.monto)}</span>
      </div>
      <span class="venc-badge ${clase}">${badge}</span>
    </div>`).join('');
}

// ===== HISTORIAL =====
function renderHistorial() {
  const container = document.getElementById('historial-meses');
  if (!container) return;
  const gastos = getData('gastos');
  const ingresos = cargarIngresos();
  if (gastos.length === 0 && ingresos.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:30px">Sin movimientos registrados aún</p>';
    renderGraficas();
    return;
  }
  const mesesSet = new Set();
  gastos.forEach(g => {
    const d = new Date(g.fecha + 'T00:00:00');
    mesesSet.add(`${d.getFullYear()}-${d.getMonth()}`);
  });
  ingresos.forEach(i => {
    if (i.fecha) {
      const d = new Date(i.fecha + 'T00:00:00');
      mesesSet.add(`${d.getFullYear()}-${d.getMonth()}`);
    } else {
      mesesSet.add(`${i.anio}-${i.mes}`);
    }
  });
  const mesesOrdenados = [...mesesSet]
    .map(k => { const [a, m] = k.split('-'); return { anio: +a, mes: +m }; })
    .sort((a, b) => b.anio - a.anio || b.mes - a.mes);
  let html = '';
  mesesOrdenados.forEach(({ mes, anio }, i) => {
    const movs = [
      ...obtenerGastosDeMes(gastos, mes, anio).map(g => ({ ...g, movType: 'gasto' })),
      ...ingresos.filter(j => j.mes === mes && j.anio === anio).map(j => ({ ...j, movType: 'ingreso' }))
    ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const totalGastos = movs.filter(m => m.movType === 'gasto').reduce((s, m) => s + m.monto, 0);
    const totalIngresos = movs.filter(m => m.movType === 'ingreso').reduce((s, m) => s + m.monto, 0);
    const total = totalIngresos - totalGastos;
    const porCat = {};
    movs.filter(m => m.movType === 'gasto').forEach(g => { porCat[g.cat] = (porCat[g.cat] || 0) + g.monto; });
    const catHtml = Object.entries(porCat).sort((a,b) => b[1]-a[1]).map(([cat, tot]) => `
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">
        <span style="color:var(--text-muted);font-size:13px">${cat}</span>
        <span style="font-weight:700;font-size:13px">$${formatNum(tot)}</span>
      </div>`).join('');
    const movimientosHtml = movs.map(m => `
      <div class="gasto-item" onclick="abrirModal(${m.id}, '${m.movType}')">
        <div class="gasto-info">
          <span class="gasto-cat">${m.movType === 'ingreso' ? 'Ingreso' : m.cat}${m.movType === 'gasto' && m.tipo==='fijo'?'<span class="badge-fijo">FIJO</span>':''}</span>
          <span class="gasto-desc">${m.desc}</span>
          <span class="gasto-fecha-small">${formatFecha(m.fecha)}</span>
        </div>
        <span class="${m.movType === 'ingreso' ? 'gasto-monto-pos' : 'gasto-monto-neg'}">${m.movType === 'ingreso' ? '+' : '-'}$${formatNum(m.monto)}</span>
      </div>`).join('');
    html += `
      <div class="mes-card">
        <div class="mes-header" onclick="toggleMes('mes-h-${i}')">
          <span class="mes-nombre">📅 ${MESES[mes]} ${anio}</span>
          <span class="mes-total">${total >= 0 ? '+' : '-'}$${formatNum(Math.abs(total))}</span>
        </div>
        <div class="mes-body" id="mes-h-${i}" style="display:none">
          <div style="margin-bottom:12px">${catHtml}</div>
          <div style="display:flex;flex-direction:column;gap:8px">${movimientosHtml}</div>
        </div>
      </div>`;
  });
  container.innerHTML = html || '<p style="color:var(--text-muted);text-align:center;padding:30px">Sin movimientos registrados</p>';
  renderGraficas();
}

function toggleMes(id) {
  const el = document.getElementById(id);
  el.style.display = el.style.display === 'none' ? 'flex' : 'none';
}

// ===== TABS =====
function switchTab(tabId) {
  document.getElementById('tab-grafica').style.display   = tabId === 'tab-grafica'   ? 'block' : 'none';
  document.getElementById('tab-historial').style.display = tabId === 'tab-historial' ? 'block' : 'none';
  document.querySelectorAll('.tab-btn').forEach((b, i) => {
    b.classList.toggle('active',
      (i === 0 && tabId === 'tab-grafica') || (i === 1 && tabId === 'tab-historial'));
  });
  if (tabId === 'tab-grafica')   renderGraficas();
  if (tabId === 'tab-historial') renderHistorial();
}

// ===== GRÁFICAS =====
let chartBar = null;
let chartPie = null;

function renderGraficas() {
  const gastos = getData('gastos');
  const hoy    = new Date();
  const COLORS = ['#00E38C','#3A86FF','#FF4D6D','#FFC857','#38f9d7','#ff6584'];
  const labelsBar = [];
  const dataBar   = [];
  for (let i = 2; i >= 0; i--) {
    let m = hoy.getMonth() - i;
    let a = hoy.getFullYear();
    if (m < 0) { m += 12; a -= 1; }
    labelsBar.push(MESES[m].slice(0, 3));
    dataBar.push(obtenerGastosDeMes(gastos, m, a).reduce((s, g) => s + g.monto, 0));
  }
  const ctxBar = document.getElementById('myChart');
  if (!ctxBar) return;
  if (chartBar) chartBar.destroy();
  chartBar = new Chart(ctxBar.getContext('2d'), {
    type: 'bar',
    data: {
      labels: labelsBar,
      datasets: [{
        data: dataBar,
        backgroundColor: ['rgba(0,227,140,0.7)','rgba(58,134,255,0.7)','rgba(255,77,109,0.7)'],
        borderRadius: 10,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: 'rgba(234,242,255,0.5)' }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { ticks: { color: 'rgba(234,242,255,0.5)', callback: v => '$' + formatNum(v) }, grid: { color: 'rgba(255,255,255,0.04)' } }
      }
    }
  });
  document.getElementById('chart-legend').innerHTML = `
    <div class="chart-legend">
      ${labelsBar.map((l, i) => `
        <div class="legend-item">
          <div class="legend-dot" style="background:${COLORS[i]}"></div>
          ${l}: $${formatNum(dataBar[i])}
        </div>`).join('')}
    </div>`;

  const porCat = {};
  obtenerGastosDeMes(gastos, hoy.getMonth(), hoy.getFullYear())
    .forEach(g => { porCat[g.cat] = (porCat[g.cat] || 0) + g.monto; });
  const catLabels = Object.keys(porCat);
  const catData   = Object.values(porCat);
  const ctxPie    = document.getElementById('myChartCat');
  if (!ctxPie) return;
  if (chartPie) chartPie.destroy();
  if (catLabels.length === 0) {
    document.getElementById('chart-legend-cat').innerHTML =
      '<p style="color:var(--text-muted);text-align:center;padding:10px">Sin gastos este mes</p>';
    return;
  }
  chartPie = new Chart(ctxPie.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: catLabels,
      datasets: [{ data: catData, backgroundColor: COLORS.slice(0, catLabels.length), borderWidth: 0, hoverOffset: 8 }]
    },
    options: { responsive: true, cutout: '65%', plugins: { legend: { display: false } } }
  });
  document.getElementById('chart-legend-cat').innerHTML = `
    <div class="chart-legend">
      ${catLabels.map((l, i) => `
        <div class="legend-item">
          <div class="legend-dot" style="background:${COLORS[i]}"></div>
          ${l}: $${formatNum(catData[i])}
        </div>`).join('')}
    </div>`;
  const analisis = document.getElementById('analisis-result');
  if (analisis) analisis.innerHTML = 'Dale al botón y te muestro tu resumen de gastos.';
}

function setAnalisisText(html) {
  const analisis = document.getElementById('analisis-result');
  if (analisis) analisis.innerHTML = html;
}

function generarAnalisisMovimientos() {
  const gastos = getData('gastos');
  if (!gastos.length) {
    setAnalisisText('Aún no tienes gastos registrados. Añade algunos y dale al botón para ver tu resumen.');
    return;
  }

  const hoy = new Date();
  const mes = hoy.getMonth();
  const anio = hoy.getFullYear();
  const gastosMes = obtenerGastosDeMes(gastos, mes, anio);
  const totalActual = gastosMes.reduce((sum, gasto) => sum + gasto.monto, 0);

  if (!totalActual) {
    setAnalisisText('Todavía no hay gastos este mes. Agrega algunos y vuelve a ver tu resumen.');
    return;
  }

  const prevMes = mes === 0 ? 11 : mes - 1;
  const prevAnio = mes === 0 ? anio - 1 : anio;
  const gastosPrev = obtenerGastosDeMes(gastos, prevMes, prevAnio);
  const totalPrev = gastosPrev.reduce((sum, gasto) => sum + gasto.monto, 0);
  const cambio = totalPrev === 0 ? null : Math.round(((totalActual - totalPrev) / totalPrev) * 100);

  const categorias = {};
  gastosMes.forEach(g => { categorias[g.cat] = (categorias[g.cat] || 0) + g.monto; });
  const categoriasOrdenadas = Object.entries(categorias).sort((a, b) => b[1] - a[1]);
  const [topCat, topMonto] = categoriasOrdenadas[0] || ['Sin categoría', 0];
  const participacionTop = Math.round((topMonto / totalActual) * 100);

  const gastosFijos = gastosMes
    .filter(g => g.tipo === 'fijo' && g.activo !== false)
    .reduce((sum, gasto) => sum + gasto.monto, 0);

  const topGastos = [...gastosMes]
    .sort((a, b) => b.monto - a.monto)
    .slice(0, 3);

  const topGastosHtml = topGastos.map((g, index) => `
    <div class="analysis-list-item">
      <div class="analysis-list-icon">${index + 1}</div>
      <div>
        <div class="analysis-list-item-title">${g.cat}</div>
        <div class="analysis-list-item-sub">$${formatNum(g.monto)}</div>
      </div>
    </div>
  `).join('');

  const cambioTexto = totalPrev === 0
    ? `Sin comparación con ${MESES[prevMes]} ${prevAnio}`
    : cambio > 0
      ? `+${Math.abs(cambio)}% vs ${MESES[prevMes]} ${prevAnio}`
      : cambio < 0
        ? `-${Math.abs(cambio)}% vs ${MESES[prevMes]} ${prevAnio}`
        : `igual a ${MESES[prevMes]} ${prevAnio}`;

  const fixedText = gastosFijos
    ? `$${formatNum(gastosFijos)}`
    : 'Sin gastos fijos activos';

 const badgeClass = cambio > 0 ? 'analysis-badge negativo' : 'analysis-badge';
  setAnalisisText(`
    <div class="analysis-summary">
      <div class="analysis-row">
        <div class="analysis-row-header">
          <div>
            <div class="analysis-key">Total gastado este mes</div>
            <div class="analysis-value">$${formatNum(totalActual)}</div>
          </div>
          <span class="${badgeClass}">${cambioTexto}</span>
        </div>
      </div>
      <div class="analysis-row">
        <div class="analysis-key">Categoría principal</div>
        <div class="analysis-row-header">
          <div class="analysis-value">${topCat}</div>
          <span class="analysis-badge">${participacionTop}% del total</span>
        </div>
      </div>
      <div class="analysis-row">
        <div class="analysis-key">Gastos fijos del mes</div>
        <div class="analysis-value">${fixedText}</div>
      </div>
      <div class="analysis-row">
        <div class="analysis-list-title">🏆 Top 3 gastos</div>
        <div class="analysis-list">${topGastosHtml}</div>
      </div>
      <div class="analysis-note">📊 Resumen de ${MESES[mes]} ${anio}</div>
    </div>
  `);
  }

// ===== FIREBASE HELPERS =====
async function guardarEnFirebase(coleccion, id, data) {
  if (!modoGoogle || !currentUser) return;
  try { await guardarDato(currentUser.uid, coleccion, id, data); }
  catch(e) { console.error(e); }
}

async function eliminarDeFirebase(coleccion, id) {
  if (!modoGoogle || !currentUser) return;
  try { await eliminarDato(currentUser.uid, coleccion, id); }
  catch(e) { console.error(e); }
}

// ===== FAB MENU =====
function toggleFabMenu() {
  const menu = document.getElementById('fab-menu');
  menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}
function cerrarFabMenu() {
  document.getElementById('fab-menu').style.display = 'none';
}

// ===== UTILIDADES =====
function formatCurrencyInput(input) {
  input.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');

    if (!value) {
      e.target.value = '';
      return;
    }

    // Evita límites y problemas con Number()
    e.target.value = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  });
}
function formatNum(n) { return Math.round(n).toLocaleString('es-CO'); }
function formatFecha(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}

const MIN_SPLASH_TIME = 1400;
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  const hoy     = new Date().toISOString().split('T')[0];
  const fechaEl = document.getElementById('gasto-fecha');
  if (fechaEl) fechaEl.value = hoy;

  const modalEl = document.getElementById('modal-editar');
  if (modalEl) {
    modalEl.style.display       = 'none';
    modalEl.style.visibility    = 'hidden';
    modalEl.style.pointerEvents = 'none';
    modalEl.addEventListener('click', function(e) {
      if (e.target === this) cerrarModal();
    });
  }

  const logoutModal = document.getElementById('modal-logout');
  if (logoutModal) {
    logoutModal.style.display       = 'none';
    logoutModal.style.visibility    = 'hidden';
    logoutModal.style.pointerEvents = 'none';
    logoutModal.addEventListener('click', function(e) {
      if (e.target === this) closeLogoutModal();
    });
  }

  const nav = document.getElementById('bottom-nav-global');
  if (nav) nav.style.display = 'none';

  const fabMenu = document.getElementById('fab-menu');
  if (fabMenu) fabMenu.style.display = 'none';

  const splashStart = Date.now();
  // Mostrar splash
  ocultarTodosScreens();
  const splash = document.getElementById('screen-splash');
  if (splash) {
    splash.classList.add('active');
    splash.style.display = '';
  }

  // Verificar sesión activa
let user = null;
  try {
    user = await Promise.race([
      getCurrentUser(),
      new Promise(resolve => setTimeout(() => resolve(null), 5000))
    ]);
    if (user) {
      currentUser = user;
      modoGoogle  = true;
      userId      = user.uid;
        const [gastosNube, ingresosNube, serviciosNube] = await Promise.all([
        obtenerColeccion(user.uid, 'gastos'),
        obtenerColeccion(user.uid, 'ingresos'),
        obtenerColeccion(user.uid, 'servicios')
      ]);
      setData('gastos',    gastosNube);
      setData('ingresos',  ingresosNube.map(normalizeIngreso));
      setData('servicios', serviciosNube);
    }
  } catch(e) {
    console.error('Error auth:', e);
  }

  const elapsed = Date.now() - splashStart;
  if (elapsed < MIN_SPLASH_TIME) {
    await sleep(MIN_SPLASH_TIME - elapsed);
  }

  if (user) {
    entrarAlApp(user.displayName || 'Usuario', user.email, 'Cuenta Google activa');
    showToast('✅ Bienvenido ' + (user.displayName || '').split(' ')[0]);
  } else {
    ocultarTodosScreens();
    const bienvenida = document.getElementById('screen-bienvenida');
    if (bienvenida) {
      bienvenida.classList.add('active');
      bienvenida.style.display = '';
    }
  }
// Inputs con separador de miles
[
  'ingreso-monto',
  'gasto-monto',
  'srv-monto',
  'edit-monto'
].forEach(id => {
  const input = document.getElementById(id);
  if (input) formatCurrencyInput(input);
});
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
});