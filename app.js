// ===== CONFIGURACIÓN =====
const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

let currentUser = null;
let modoGoogle  = false;
let userId      = 'local';

// ===== STORAGE =====
function getData(key) {
  try { return JSON.parse(localStorage.getItem(userId + '_' + key)) || []; }
  catch { return []; }
}
function setData(key, val) {
  localStorage.setItem(userId + '_' + key, JSON.stringify(val));
}
function getProfileItem(key) {
  return localStorage.getItem(userId + '_perfil_' + key) || '';
}
function setProfileItem(key, value) {
  localStorage.setItem(userId + '_perfil_' + key, value);
}
function renderPerfilUsuario(nombre = '', email = '', plan = '') {
  const storedName = getProfileItem('nombre');
  const currentName = document.querySelector('.perfil-nombre')?.textContent || 'Invitado';
  const currentEmail = document.querySelector('.perfil-email')?.textContent || 'Sin correo';
  const currentPlan = document.querySelector('.perfil-plan')?.textContent || 'Sin cuenta';
  const profileName = storedName || nombre || currentName;
  const profileEmail = email || currentEmail;
  const profilePhoto = getProfileItem('foto') || '';
  const nombreEl = document.querySelector('.perfil-nombre');
  const emailEl = document.querySelector('.perfil-email');
  const planEl = document.querySelector('.perfil-plan');
  const photoEl = document.getElementById('profile-photo');
  const nameInput = document.getElementById('profile-name-input');
  const fallback = document.querySelector('.avatar-fallback');
  if (nombreEl) nombreEl.textContent = profileName;
  if (emailEl) emailEl.textContent = profileEmail;
  if (planEl) planEl.textContent = plan || currentPlan;
  if (nameInput) nameInput.value = profileName;
  if (photoEl) photoEl.src = profilePhoto;
  if (fallback) fallback.style.display = profilePhoto ? 'none' : 'flex';
}
function toggleEditNombre() {
  const btn = document.getElementById('profile-btn-action');
  const input = document.getElementById('profile-name-input');
  if (!btn || !input) return;
  const accion = btn.textContent.toLowerCase();
  if (accion.includes('editar')) {
    input.disabled = false;
    input.focus();
    input.select();
  } else if (accion.includes('guardar')) {
    guardarNombrePerfil();
    input.disabled = true;
  }
}
function actualizarBotonPerfil() {
  const nombreInput = document.getElementById('profile-name-input');
  const btn = document.getElementById('profile-btn-action');
  if (!nombreInput || !btn) return;
  const nombreActual = nombreInput.value.trim();
  const nombreGuardado = getProfileItem('nombre');
  const esIgual = nombreActual === nombreGuardado;
  btn.textContent = esIgual ? 'Editar' : 'Guardar';
  btn.classList.toggle('disabled', esIgual);
  btn.disabled = esIgual;
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
function guardarNombrePerfil() {
  const nombreInput = document.getElementById('profile-name-input');
  if (!nombreInput) return;
  const nombre = nombreInput.value.trim();
  if (!nombre) {
    showProfileFeedback('⚠️ Ingresa tu nombre', true);
    showToast('⚠️ Ingresa tu nombre');
    return;
  }
  setProfileItem('nombre', nombre);
  renderPerfilUsuario();
  actualizarBotonPerfil();
  nombreInput.disabled = true;
  showToast('✅ Nombre actualizado');
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
      const ingresosInvitado  = getData('ingresos');
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
        gastosInvitado.forEach(g    => promesas.push(guardarDato(user.uid, 'gastos',    g.id,                 g)));
        ingresosInvitado.forEach(i  => promesas.push(guardarDato(user.uid, 'ingresos',  `${i.mes}_${i.anio}`, i)));
        serviciosInvitado.forEach(s => promesas.push(guardarDato(user.uid, 'servicios', s.id,                 s)));
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
  const mes   = parseInt(document.getElementById('ingreso-mes').value);
  const anio  = parseInt(document.getElementById('ingreso-anio').value);
  const monto = parseFloat(document.getElementById('ingreso-monto').value);
  if (!monto || monto <= 0) { showToast('⚠️ Ingresa un monto válido'); return; }
  const ingresos = getData('ingresos');
  const idx = ingresos.findIndex(i => i.mes === mes && i.anio === anio);
  if (idx >= 0) ingresos[idx].monto = monto;
  else ingresos.push({ mes, anio, monto });
  setData('ingresos', ingresos);
  if (modoGoogle) guardarEnFirebase('ingresos', `${mes}_${anio}`, { mes, anio, monto });
  showToast('✅ Ingreso guardado');
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
  const monto    = parseFloat(document.getElementById('gasto-monto').value);
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

function abrirModal(id) {
  const gastos = getData('gastos');
  const g = gastos.find(g => g.id === id);
  if (!g) return;
  document.getElementById('edit-id').value        = g.id;
  document.getElementById('edit-desc').value      = g.desc;
  document.getElementById('edit-monto').value     = g.monto;
  document.getElementById('edit-fecha').value     = g.fecha || '';
  document.getElementById('edit-categoria').value = g.cat;
  document.getElementById('edit-tipo').value      = g.tipo || 'variable';
  document.getElementById('edit-fecha-fin').value = g.fechaFin || '';
  const esFijo = g.tipo === 'fijo';
  document.getElementById('edit-grupo-fecha-fin').style.display = esFijo ? 'block' : 'none';
  document.getElementById('edit-estado-fijo').style.display     = esFijo ? 'block' : 'none';
  const btn    = document.getElementById('btn-toggle-activo');
  const activo = g.activo !== false;
  btn.textContent = activo ? '⏸️ Desactivar este gasto fijo' : '▶️ Reactivar este gasto fijo';
  btn.className   = activo ? 'btn-toggle-fijo' : 'btn-toggle-fijo reactivar';
  abrirModalReal();
}

function guardarEdicion() {
  const id       = parseInt(document.getElementById('edit-id').value);
  const cat      = document.getElementById('edit-categoria').value;
  const desc     = document.getElementById('edit-desc').value.trim();
  const monto    = parseFloat(document.getElementById('edit-monto').value);
  const fecha    = document.getElementById('edit-fecha').value;
  const tipo     = document.getElementById('edit-tipo').value;
  const fechaFin = tipo === 'fijo' ? document.getElementById('edit-fecha-fin').value : null;
  if (!desc)                { showToast('⚠️ Escribe una descripción'); return; }
  if (!monto || monto <= 0) { showToast('⚠️ Monto inválido'); return; }
  const gastos = getData('gastos');
  const idx    = gastos.findIndex(g => g.id === id);
  if (idx >= 0) {
    const activo = gastos[idx].activo !== false;
    gastos[idx]  = { id, cat, desc, monto, fecha, tipo, fechaFin, activo };
    if (modoGoogle) guardarEnFirebase('gastos', id, gastos[idx]);
  }
  setData('gastos', gastos);
  cerrarModal();
  showToast('✅ Gasto actualizado');
  renderDashboard();
  renderHistorial();
}

function eliminarGasto() {
  const id = parseInt(document.getElementById('edit-id').value);
  if (!confirm('¿Seguro que quieres eliminar este gasto?')) return;
  const gastos = getData('gastos').filter(g => g.id !== id);
  setData('gastos', gastos);
  if (modoGoogle) eliminarDeFirebase('gastos', id);
  cerrarModal();
  showToast('🗑️ Gasto eliminado');
  renderDashboard();
  renderHistorial();
}

function toggleActivoFijo() {
  const id     = parseInt(document.getElementById('edit-id').value);
  const gastos = getData('gastos');
  const idx    = gastos.findIndex(g => g.id === id);
  if (idx < 0) return;
  gastos[idx].activo = gastos[idx].activo === false;
  setData('gastos', gastos);
  if (modoGoogle) guardarEnFirebase('gastos', id, gastos[idx]);
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
  const monto  = parseFloat(document.getElementById('srv-monto').value);
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
  const ingresos     = getData('ingresos');
  const ingreso      = ingresos.find(i => i.mes === mes && i.anio === anio);
  const totalIngreso = ingreso ? ingreso.monto : 0;
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

  const recientes = [...gastos]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 5);

  const listaG = document.getElementById('lista-gastos-recientes');
  listaG.innerHTML = recientes.length === 0
    ? '<p style="color:var(--text-muted);text-align:center;padding:20px">Sin movimientos registrados</p>'
    : recientes.map(g => `
        <div class="gasto-item" onclick="abrirModal(${g.id})">
          <div class="gasto-info">
            <span class="gasto-cat">${g.cat}${g.tipo==='fijo'?'<span class="badge-fijo">FIJO</span>':''}</span>
            <span class="gasto-desc">${g.desc}</span>
            <span class="gasto-fecha-small">${formatFecha(g.fecha)}</span>
          </div>
          <span class="gasto-monto-neg">-$${formatNum(g.monto)}</span>
        </div>`).join('') + '<p class="edit-hint">Toca cualquier gasto para editar ✏️</p>';
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
  if (gastos.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:30px">Sin gastos registrados aún</p>';
    renderGraficas();
    return;
  }
  const mesesSet = new Set();
  gastos.forEach(g => {
    const d = new Date(g.fecha + 'T00:00:00');
    mesesSet.add(`${d.getFullYear()}-${d.getMonth()}`);
  });
  const mesesOrdenados = [...mesesSet]
    .map(k => { const [a, m] = k.split('-'); return { anio: +a, mes: +m }; })
    .sort((a, b) => b.anio - a.anio || b.mes - a.mes);
  let html = '';
  mesesOrdenados.forEach(({ mes, anio }, i) => {
    const del_mes = obtenerGastosDeMes(gastos, mes, anio)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const total  = del_mes.reduce((s, g) => s + g.monto, 0);
    const porCat = {};
    del_mes.forEach(g => { porCat[g.cat] = (porCat[g.cat] || 0) + g.monto; });
    const catHtml = Object.entries(porCat).sort((a,b) => b[1]-a[1]).map(([cat, tot]) => `
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">
        <span style="color:var(--text-muted);font-size:13px">${cat}</span>
        <span style="font-weight:700;font-size:13px">$${formatNum(tot)}</span>
      </div>`).join('');
    const gastosHtml = del_mes.map(g => `
      <div class="gasto-item" onclick="abrirModal(${g.id})">
        <div class="gasto-info">
          <span class="gasto-cat">${g.cat}${g.tipo==='fijo'?'<span class="badge-fijo">FIJO</span>':''}</span>
          <span class="gasto-desc">${g.desc}</span>
          <span class="gasto-fecha-small">${formatFecha(g.fecha)}</span>
        </div>
        <span class="gasto-monto-neg">-$${formatNum(g.monto)}</span>
      </div>`).join('');
    html += `
      <div class="mes-card">
        <div class="mes-header" onclick="toggleMes('mes-h-${i}')">
          <span class="mes-nombre">📅 ${MESES[mes]} ${anio}</span>
          <span class="mes-total">-$${formatNum(total)}</span>
        </div>
        <div class="mes-body" id="mes-h-${i}" style="display:none">
          <div style="margin-bottom:12px">${catHtml}</div>
          <div style="display:flex;flex-direction:column;gap:8px">${gastosHtml}</div>
        </div>
      </div>`;
  });
  container.innerHTML = html || '<p style="color:var(--text-muted);text-align:center;padding:30px">Sin gastos registrados</p>';
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

  setAnalisisText(`
    <div class="analysis-summary">
      <div class="analysis-row">
        <div>
          <div class="analysis-key">Total del mes</div>
          <div class="analysis-value">$${formatNum(totalActual)}</div>
        </div>
        <span class="analysis-badge">${cambioTexto}</span>
      </div>
      <div class="analysis-row">
        <div>
          <div class="analysis-key">Categoría principal</div>
          <div class="analysis-value">${topCat}</div>
        </div>
        <div class="analysis-value">${participacionTop}%</div>
      </div>
      <div class="analysis-row">
        <div>
          <div class="analysis-key">Gastos fijos</div>
          <div class="analysis-value">${fixedText}</div>
        </div>
      </div>
      <div>
        <div class="analysis-list-title">Top 3 gastos</div>
        <div class="analysis-list">${topGastosHtml}</div>
      </div>
      <div class="analysis-note">Resumen breve para ver cómo está tu mes.</div>
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
    user = await getCurrentUser();
    if (user) {
      currentUser = user;
      modoGoogle  = true;
      userId      = user.uid;
      const [gastosNube, ingresosNube, serviciosNube] = await Promise.all([
        obtenerColeccion(user.uid, 'gastos'),
        obtenerColeccion(user.uid, 'ingresos'),
        obtenerColeccion(user.uid, 'servicios')
      ]);
      if (gastosNube.length)    setData('gastos',    gastosNube);
      if (ingresosNube.length)  setData('ingresos',  ingresosNube);
      if (serviciosNube.length) setData('servicios', serviciosNube);
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

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/cashiroapp/sw.js').catch(() => {});
  }
});