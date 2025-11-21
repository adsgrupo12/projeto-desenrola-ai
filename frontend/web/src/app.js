const API_BASE = window.localStorage.getItem('apiBase') || 'http://localhost:3001';

const toastEl = document.getElementById('toast');
const toastBody = document.getElementById('toast-body');
const toast = toastEl ? new bootstrap.Toast(toastEl) : null;

const state = {
  sessionToken: null,
  role: null,
  services: []
};

function showToast(message) {
  if (!toast || !toastBody) return;
  toastBody.textContent = message;
  toast.show();
}

function setSession(token, role) {
  state.sessionToken = token;
  state.role = role;
  if (token) {
    localStorage.setItem('sessionToken', token);
    localStorage.setItem('role', role);
  } else {
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('role');
  }
  const logoutBtn = document.getElementById('btn-logout');
  const cardCreate = document.getElementById('card-create-service');
  if (logoutBtn) logoutBtn.classList.toggle('d-none', !token);
  if (cardCreate) cardCreate.style.display = role === 'PRESTADOR' ? 'block' : 'none';
}

async function api(path, options = {}) {
  const headers = options.headers || {};
  headers['Content-Type'] = 'application/json';
  if (state.sessionToken) headers['Authorization'] = `Bearer ${state.sessionToken}`;

  const resp = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Erro ${resp.status}: ${text}`);
  }
  if (resp.status === 204) return null;
  return resp.json();
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.target;
  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: {
        email: form.email.value,
        senha: form.senha.value
      }
    });
    setSession(data.sessionToken, data.role);
    const info = document.getElementById('user-info');
    if (info) info.textContent = `${data.nome} (${data.role})`;
    showToast('Login realizado');
    await loadServices();
  } catch (err) {
    showToast(err.message);
  }
}

async function handleRegister(event) {
  event.preventDefault();
  event.stopPropagation();
  const form = event.target;
  try {
    const role = form.isPrestador ? (form.isPrestador.checked ? 'PRESTADOR' : 'CLIENTE') : form.role?.value || 'CLIENTE';
    await api('/auth/register', {
      method: 'POST',
      body: {
        nome: form.nome.value,
        email: form.email.value,
        telefone: form.telefone.value,
        senha: form.senha.value,
        role
      }
    });
    showToast('Conta criada. Faça login.');
  } catch (err) {
    showToast(err.message);
  }
  return false;
}

async function handleCreateService(event) {
  event.preventDefault();
  const form = event.target;
  try {
    await api('/services', {
      method: 'POST',
      body: {
        titulo: form.titulo.value,
        descricao: form.descricao.value,
        categoria: form.categoria.value,
        preco: form.preco.value ? Number(form.preco.value) : null,
        cidade: form.cidade.value,
        uf: form.uf.value
      }
    });
    form.reset();
    showToast('Serviço criado');
    await loadServices();
  } catch (err) {
    showToast(err.message);
  }
}

async function handleRequestService(serviceId) {
  try {
    await api('/requests', {
      method: 'POST',
      body: { servicoId: serviceId }
    });
    showToast('Solicitação enviada');
  } catch (err) {
    showToast(err.message);
  }
}

function renderServices(list) {
  const container = document.getElementById('services-list');
  if (!container) return;
  if (!list.length) {
    container.innerHTML = '<div class="col-12 text-muted">Nenhum serviço encontrado.</div>';
    return;
  }

  container.innerHTML = list
    .map(
      (svc) => `
      <div class="col-12 col-md-6">
        <div class="card h-100 shadow-sm">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title mb-1">${svc.titulo}</h5>
            <small class="text-muted mb-2">${svc.categoria || 'Sem categoria'}</small>
            <p class="card-text flex-grow-1">${svc.descricao || ''}</p>
            <div class="d-flex justify-content-between align-items-center">
              <span class="text-primary fw-semibold">${svc.preco ? `R$ ${svc.preco}` : 'À combinar'}</span>
              <button class="btn btn-sm btn-outline-primary" data-id="${svc.id}">Solicitar</button>
            </div>
          </div>
        </div>
      </div>
    `
    )
    .join('');

  container.querySelectorAll('button[data-id]').forEach((btn) => {
    btn.addEventListener('click', () => handleRequestService(btn.dataset.id));
  });
}

async function loadServices() {
  const container = document.getElementById('services-list');
  if (!container) return;
  try {
    const q = document.getElementById('search-q').value;
    const category = document.getElementById('search-category').value;
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (category) params.append('category', category);
    const data = await api(`/services?${params.toString()}`);
    state.services = data;
    renderServices(data);
  } catch (err) {
    showToast(err.message);
  }
}

function restoreSession() {
  const token = localStorage.getItem('sessionToken');
  const role = localStorage.getItem('role');
  if (token) {
    state.sessionToken = token;
    state.role = role;
    const logoutBtn = document.getElementById('btn-logout');
    const cardCreate = document.getElementById('card-create-service');
    if (logoutBtn) logoutBtn.classList.remove('d-none');
    if (cardCreate) cardCreate.style.display = role === 'PRESTADOR' ? 'block' : 'none';
  }
}

function bindIfExists(selector, event, handler) {
  const el = document.querySelector(selector);
  if (el) el.addEventListener(event, handler);
}

bindIfExists('#form-login', 'submit', handleLogin);
bindIfExists('#form-register', 'submit', handleRegister);
bindIfExists('#form-service', 'submit', handleCreateService);
bindIfExists('#btn-filter', 'click', loadServices);
bindIfExists('#btn-logout', 'click', () => {
  setSession(null, null);
  const info = document.getElementById('user-info');
  if (info) info.textContent = '';
});

restoreSession();
loadServices();
