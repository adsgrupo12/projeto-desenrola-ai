const API_BASE = window.localStorage.getItem('apiBase') || 'http://localhost:3001';

const toastEl = document.getElementById('toast');
const toastBody = document.getElementById('toast-body');
const toast = toastEl ? new bootstrap.Toast(toastEl) : null;

function showToast(message) {
  if (!toast || !toastBody) return;
  toastBody.textContent = message;
  toast.show();
}

function getSession() {
  const token = localStorage.getItem('sessionToken');
  if (!token) {
    window.location.href = 'auth.html#login';
    return null;
  }
  return token;
}

async function api(path, options = {}) {
  const headers = options.headers || {};
  headers['Content-Type'] = 'application/json';
  const token = localStorage.getItem('sessionToken');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const resp = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Erro ${resp.status}: ${text}`);
  }
  return resp.json();
}

function fillProfile(data) {
  const fields = ['nome', 'email', 'telefone', 'logradouro', 'numero', 'bairro', 'cidade', 'uf', 'cep'];
  document.getElementById('profile-name').textContent = data.nome || 'Usuário';
  fields.forEach((f) => {
    const el = document.getElementById(f);
    if (el) el.value = data[f] || '';
  });
  const navAvatar = document.getElementById('nav-avatar');
  const profileAvatar = document.getElementById('profile-avatar');
  if (navAvatar) navAvatar.textContent = (data.nome || '?')[0] || '?';
  if (profileAvatar) profileAvatar.textContent = (data.nome || '?')[0] || '?';
}

async function loadProfile() {
  try {
    const data = await api('/auth/me');
    fillProfile(data);
  } catch (err) {
    showToast(err.message);
    if (String(err).includes('401')) {
      window.location.href = 'auth.html#login';
    }
  }
}

function bindLogout() {
  const btn = document.getElementById('btn-logout');
  if (!btn) return;
  btn.addEventListener('click', () => {
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('role');
    window.location.href = 'index.html';
  });
}

function setEditable(enabled) {
  const fields = ['nome', 'telefone', 'logradouro', 'numero', 'bairro', 'cidade', 'uf', 'cep'];
  fields.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = !enabled;
  });
  const btnSave = document.getElementById('btn-save');
  const btnCancel = document.getElementById('btn-cancel-edit');
  const btnEdit = document.getElementById('btn-edit');
  if (btnSave) btnSave.classList.toggle('d-none', !enabled);
  if (btnCancel) btnCancel.classList.toggle('d-none', !enabled);
  if (btnEdit) btnEdit.classList.toggle('d-none', enabled);
}

function bindEdit() {
  const btnEdit = document.getElementById('btn-edit');
  const btnCancel = document.getElementById('btn-cancel-edit');
  if (btnEdit) {
    btnEdit.addEventListener('click', () => setEditable(true));
  }
  if (btnCancel) {
    btnCancel.addEventListener('click', () => {
      setEditable(false);
      loadProfile();
    });
  }
}

async function submitProfile(event) {
  event.preventDefault();
  const body = {
    nome: document.getElementById('nome')?.value || '',
    telefone: document.getElementById('telefone')?.value || '',
    logradouro: document.getElementById('logradouro')?.value || '',
    numero: document.getElementById('numero')?.value || '',
    bairro: document.getElementById('bairro')?.value || '',
    cidade: document.getElementById('cidade')?.value || '',
    uf: document.getElementById('uf')?.value || '',
    cep: document.getElementById('cep')?.value || ''
  };
  try {
    const updated = await api('/auth/me', { method: 'PATCH', body });
    fillProfile(updated);
    setEditable(false);
    showToast('Perfil atualizado');
  } catch (err) {
    showToast(err.message);
  }
}

function bindForm() {
  const form = document.getElementById('profile-form');
  if (form) form.addEventListener('submit', submitProfile);
}

(function init() {
  getSession();
  bindLogout();
  bindEdit();
  bindForm();
  setEditable(false);
  loadProfile();
})();
