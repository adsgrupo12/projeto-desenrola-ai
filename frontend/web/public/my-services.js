const API_BASE = window.API_BASE || window.localStorage.getItem('apiBase') || 'https://desenrola-ai-teste.onrender.com';

const toastEl = document.getElementById('toast');
const toastBody = document.getElementById('toast-body');
const toast = toastEl ? new bootstrap.Toast(toastEl) : null;

let currentUser = null;
let editingId = null;
let categories = [];

function showToast(message) {
  if (!toast || !toastBody) return;
  toastBody.textContent = message;
  toast.show();
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

function ensureAvatar(name) {
  const first = (name || '').trim().split(' ')[0];
  const letter = first ? first[0].toUpperCase() : '?';
  const navAvatar = document.getElementById('nav-avatar');
  if (navAvatar) navAvatar.textContent = letter;
}

async function loadMe() {
  const token = localStorage.getItem('sessionToken');
  if (!token) {
    window.location.href = 'auth.html#login';
    return null;
  }
  const data = await api('/auth/me');
  currentUser = data;
  if (data?.nome) {
    localStorage.setItem('userName', data.nome);
    ensureAvatar(data.nome);
  }
  return data;
}

function renderMyServices(list) {
  const container = document.getElementById('my-services-list');
  if (!container) return;
  if (!list.length) {
    container.innerHTML = '<div class="col-12 text-muted">Nenhum serviço cadastrado.</div>';
    return;
  }
  container.innerHTML = list
    .map(
      (svc) => `
      <div class="col-12">
        <div class="card shadow-sm h-100">
          <div class="card-body d-flex flex-column flex-md-row justify-content-between gap-3">
            <div>
              <span class="badge bg-light text-dark border">${svc.categoria || 'Serviço'}</span>
              <h6 class="fw-semibold mb-1 mt-2">${svc.titulo}</h6>
              <p class="mb-1 text-secondary">${svc.descricao || ''}</p>
              <div class="small text-muted">Preço: ${svc.preco ? `R$ ${svc.preco}` : 'A combinar'}</div>
            </div>
            <div class="d-flex align-items-center gap-2">
              <button class="btn btn-outline-success btn-sm" data-edit="${svc.id}">Editar</button>
              <button class="btn btn-outline-danger btn-sm" data-del="${svc.id}">Excluir</button>
            </div>
          </div>
        </div>
      </div>`
    )
    .join('');

  container.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => startEdit(btn.dataset.edit, list));
  });
  container.querySelectorAll('[data-del]').forEach((btn) => {
    btn.addEventListener('click', () => deleteService(btn.dataset.del));
  });
}

async function loadMyServices() {
  const data = await api('/services');
  if (!currentUser) return;
  const mine = data.filter((svc) => svc.prestadorId === currentUser.id);
  renderMyServices(mine);
}

(async function loadCategories() {
  try {
    const resp = await api('/categories');
    categories = resp.categories || [];
    const select = document.getElementById('form-category');
    if (select) {
      categories.forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        select.appendChild(opt);
      });
      select.addEventListener('change', (e) => {
        const otherInput = document.getElementById('form-category-other');
        if (e.target.value === 'Outros') {
          otherInput.classList.remove('d-none');
          otherInput.required = true;
        } else {
          otherInput.classList.add('d-none');
          otherInput.required = false;
          otherInput.value = '';
        }
      });
    }
  } catch (err) {
    // ignore
  }
})();

async function saveService(event) {
  event.preventDefault();
  const form = event.target;
  let categoria = form.categoria.value;
  if (categoria === 'Outros') {
    categoria = form.categoriaOutro.value || 'Outros';
  }
  const payload = {
    titulo: form.titulo.value,
    descricao: form.descricao.value,
    categoria,
    preco: form.preco.value ? Number(form.preco.value) : null
  };
  try {
    if (editingId) {
      await api(`/services/${editingId}`, { method: 'PUT', body: payload });
      showToast('Serviço atualizado');
    } else {
      await api('/services', { method: 'POST', body: payload });
      showToast('Serviço criado');
    }
    form.reset();
    editingId = null;
    document.getElementById('btn-cancel-edit').classList.add('d-none');
    document.getElementById('form-title').textContent = 'Novo serviço';
    await loadMyServices();
  } catch (err) {
    showToast(err.message);
  }
}

function startEdit(id, list) {
  const svc = list.find((s) => s.id === id);
  if (!svc) return;
  const form = document.getElementById('form-service');
  form.titulo.value = svc.titulo || '';
  form.descricao.value = svc.descricao || '';
  form.categoria.value = svc.categoria || '';
  form.preco.value = svc.preco || '';
  editingId = id;
  document.getElementById('btn-cancel-edit').classList.remove('d-none');
  document.getElementById('form-title').textContent = 'Editar serviço';
}

async function deleteService(id) {
  if (!confirm('Deseja excluir este serviço?')) return;
  try {
    await api(`/services/${id}`, { method: 'DELETE' });
    showToast('Serviço excluído');
    await loadMyServices();
  } catch (err) {
    showToast(err.message);
  }
}

function bindLogout() {
  const btn = document.getElementById('btn-logout');
  if (!btn) return;
  btn.addEventListener('click', () => {
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
    window.location.href = 'index.html';
  });
}

(async function init() {
  bindLogout();
  const me = await loadMe();
  if (!me) return;
  if (me.role !== 'PRESTADOR') {
    document.getElementById('not-prestador').classList.remove('d-none');
    return;
  }
  document.getElementById('prestador-area').classList.remove('d-none');
  document.getElementById('form-service').addEventListener('submit', saveService);
  document.getElementById('btn-cancel-edit').addEventListener('click', () => {
    document.getElementById('form-service').reset();
    editingId = null;
    document.getElementById('btn-cancel-edit').classList.add('d-none');
    document.getElementById('form-title').textContent = 'Novo serviço';
  });
  await loadMyServices();
})();
