const API_BASE = window.API_BASE || window.localStorage.getItem('apiBase') || 'http://localhost:3001';

const toastEl = document.getElementById('toast');
const toastBody = document.getElementById('toast-body');
const toast = toastEl ? new bootstrap.Toast(toastEl) : null;

const state = {
  sessionToken: null,
  role: null,
  services: [],
  selectedServiceId: null
};

function showToast(message) {
  if (!toast || !toastBody) return;
  toastBody.textContent = message;
  toast.show();
}

function clearRegisterErrors(form) {
  form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
  const msg = document.getElementById('register-error');
  if (msg) msg.classList.add('d-none');
}

function showRegisterError(message) {
  const msg = document.getElementById('register-error');
  if (msg) {
    msg.textContent = message || 'Preencha todos os campos obrigatórios.';
    msg.classList.remove('d-none');
  }
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
    localStorage.removeItem('userName');
  }
  const logoutBtn = document.getElementById('btn-logout');
  const cardCreate = document.getElementById('card-create-service');
  if (logoutBtn) logoutBtn.classList.toggle('d-none', !token);
  if (cardCreate) cardCreate.style.display = role === 'PRESTADOR' ? 'block' : 'none';
}

function friendlyError(message) {
  const msg = message || '';
  const lower = msg.toLowerCase();
  if (lower.includes('account already exists') || lower.includes('username')) {
    return 'E-mail já cadastrado. Faça o login.';
  }
  if (lower.includes('email') && lower.includes('exists')) {
    return 'E-mail já cadastrado. Faça o login.';
  }
  return message;
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

function renderServiceCards(list) {
  const container = document.getElementById('services-list');
  if (!container) return;
  if (!list.length) {
    container.innerHTML = '<div class="col-12 text-muted">Nenhum serviÃ§o encontrado.</div>';
    return;
  }

  container.innerHTML = list
    .map(
      (svc) => `
      <div class="col-12 col-md-6 col-lg-4">
        <div class="card h-100 shadow-sm service-card">
          <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="badge bg-light text-dark border">${svc.categoria || 'ServiÃ§o'}</span>
              <span class="text-success fw-semibold">${svc.preco ? `R$ ${svc.preco}` : 'A combinar'}</span>
            </div>
            <h5 class="card-title">${svc.titulo}</h5>
            <p class="card-text text-secondary flex-grow-1">${svc.descricao || ''}</p>
            <div class="small text-muted mb-1">Prestador: ${svc.prestadorNome || 'Prestador'}</div>
            <div class="small text-muted mb-3">Local: ${svc.cidade || ''}${svc.uf ? '/' + svc.uf : ''}</div>
            <button class="btn btn-outline-success mt-auto" data-id="${svc.id}">Solicitar contra&ccedil;&atilde;o</button>
          </div>
        </div>
      </div>`
    )
    .join('');

  container.querySelectorAll('button[data-id]').forEach((btn) => {
    btn.addEventListener('click', () => handleRequestService(btn.dataset.id));
  });
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
    if (data.nome) {
      localStorage.setItem('userName', data.nome);
    }
    const info = document.getElementById('user-info');
    if (info) info.textContent = `${data.nome} (${data.role})`;
    showToast('Login realizado');
    window.location.href = 'services.html';
  } catch (err) {
    showToast(err.message);
  }
}

async function handleRegister(event) {
  event.preventDefault();
  event.stopPropagation();
  const form = event.target;
  const isPrestador = form.isPrestador?.checked;
  clearRegisterErrors(form);

  // validações básicas
  const required = ['nome', 'email', 'telefone', 'senha', 'confirmarSenha'];
  for (const field of required) {
    if (!form[field] || !form[field].value.trim()) {
      form[field]?.classList.add('is-invalid');
      showRegisterError('Preencha todos os campos obrigatórios.');
      return false;
    }
  }
  const phone = form.telefone.value.trim();
  const phoneDigits = phone.replace(/\D/g, '');
  if (phoneDigits.length < 10 || phoneDigits.length > 11) {
    form.telefone.classList.add('is-invalid');
    showRegisterError('Telefone inválido. Use DDD + número (10 ou 11 dígitos).');
    return false;
  }
  if (form.senha.value !== form.confirmarSenha.value) {
    form.senha.classList.add('is-invalid');
    form.confirmarSenha.classList.add('is-invalid');
    showRegisterError('As senhas não coincidem.');
    return false;
  }

  if (isPrestador) {
    // guarda prefill temporário para a próxima página
    const prefill = {
      nome: form.nome.value,
      email: form.email.value,
      telefone: form.telefone.value
    };
    localStorage.setItem('providerPrefill', JSON.stringify(prefill));
    const params = new URLSearchParams({
      nome: form.nome.value,
      email: form.email.value,
      telefone: form.telefone.value
    });
    window.location.href = `provider.html?${params.toString()}`;
    return false;
  }

  try {
    const data = await api('/auth/register', {
      method: 'POST',
      body: {
        nome: form.nome.value,
        email: form.email.value,
        telefone: form.telefone.value,
        senha: form.senha.value,
        role: 'CLIENTE'
      }
    });
    setSession(data.sessionToken, data.role || 'CLIENTE');
    if (form.nome.value) {
      localStorage.setItem('userName', form.nome.value);
    }
    showToast('Conta criada. Redirecionando...');
    window.location.href = 'services.html';
  } catch (err) {
    showToast(friendlyError(err.message));
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
    showToast('ServiÃ§o criado');
    await loadServices();
  } catch (err) {
    showToast(err.message);
  }
}

function openConfirmationModal() {
  const modalEl = document.getElementById('requestModal');
  if (modalEl) {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
    setTimeout(() => {
      modal.hide();
      window.location.href = 'requests.html';
    }, 5000);
  } else {
    showToast('SolicitaÃ§Ã£o enviada. Acompanhe em Minhas solicitaÃ§Ãµes.');
    setTimeout(() => (window.location.href = 'requests.html'), 5000);
  }
}

function handleRequestService(serviceId) {
  state.selectedServiceId = serviceId;
  const formModalEl = document.getElementById('requestFormModal');
  const inputId = document.getElementById('request-service-id');
  if (inputId) inputId.value = serviceId;
  if (formModalEl) {
    const formModal = new bootstrap.Modal(formModalEl);
    formModal.show();
  }
}

async function submitRequestForm(event) {
  event.preventDefault();
  const serviceId = state.selectedServiceId || document.getElementById('request-service-id')?.value;
  if (!serviceId) {
    showToast('ServiÃ§o nÃ£o encontrado. Tente novamente.');
    return;
  }

  // valida campos obrigatórios do endereço (exceto complemento)
  const reqFields = ['req-cep', 'req-logradouro', 'req-numero', 'req-bairro', 'req-cidade', 'req-uf'];
  let hasError = false;
  reqFields.forEach((id) => {
    const el = document.getElementById(id);
    if (!el || !el.value.trim()) {
      hasError = true;
      el?.classList.add('is-invalid');
    }
  });
  if (hasError) {
    showToast('Preencha CEP, logradouro, núímero, bairro, cidade e UF.');
    return;
  }

  const body = {
    servicoId: serviceId,
    detalhes: document.getElementById('req-detalhes')?.value || '',
    endereco: {
      cep: document.getElementById('req-cep')?.value || '',
      logradouro: document.getElementById('req-logradouro')?.value || '',
      numero: document.getElementById('req-numero')?.value || '',
      bairro: document.getElementById('req-bairro')?.value || '',
      cidade: document.getElementById('req-cidade')?.value || '',
      uf: document.getElementById('req-uf')?.value || '',
      complemento: document.getElementById('req-complemento')?.value || ''
    }
  };

  try {
    await api('/requests', { method: 'POST', body });
    const formModalEl = document.getElementById('requestFormModal');
    if (formModalEl) bootstrap.Modal.getInstance(formModalEl)?.hide();
    openConfirmationModal();
  } catch (err) {
    showToast(err.message);
  }
}

function renderServices(list) {
  const container = document.getElementById('services-list');
  if (!container) return;
  renderServiceCards(list);
}

async function loadServices() {
  const container = document.getElementById('services-list');
  if (!container) return;
  await loadCategoriesSelect();
  try {
    const q = document.getElementById('search-q')?.value || '';
    const category = document.getElementById('search-category')?.value || '';
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (category) params.append('category', category);
    const data = await api(`/services?${params.toString()}`);
    state.services = data;
    const select = document.getElementById('search-category');
    if (select && select.options.length <= 1) {
      const cats = [...new Set(data.map((s) => s.categoria).filter(Boolean))];
      cats.forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        select.appendChild(opt);
      });
    }
    renderServices(data);
  } catch (err) {
    showToast(err.message);
  }
}

async function loadCategoriesSelect() {
  const select = document.getElementById('search-category');
  if (!select || select.options.length > 1) return;
  try {
    const resp = await api('/categories');
    const cats = resp.categories || [];
    cats.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      select.appendChild(opt);
    });
  } catch (err) {
    // ignore
  }
}

function toggleProviderBanner() {
  const banner = document.getElementById('provider-banner');
  if (!banner) return;
  const role = localStorage.getItem('role');
  banner.style.display = role === 'PRESTADOR' ? 'none' : 'block';
}

function showWelcomeBar() {
  const bar = document.getElementById('welcome-bar');
  if (!bar) return;
  const name = localStorage.getItem('userName') || '';
  const firstName = name.split(' ')[0] || 'Bem-vindo';
  bar.textContent = `Ol\u00e1, ${firstName}! Que servi\u00e7o voc\u00ea quer encontrar hoje?`;
  const navAvatar = document.getElementById('nav-avatar');
  if (navAvatar) {
    navAvatar.textContent = firstName ? firstName[0].toUpperCase() : '?';
  }
}

async function ensureUserContext() {
  const token = localStorage.getItem('sessionToken');
  const cachedName = localStorage.getItem('userName');
  if (cachedName && token) {
    showWelcomeBar();
    return;
  }
  if (!token) return;
  try {
    const me = await api('/auth/me');
    if (me?.nome) {
      localStorage.setItem('userName', me.nome);
      if (me.role) localStorage.setItem('role', me.role);
    }
    showWelcomeBar();
  } catch (err) {
    // fallback silently
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
document.querySelectorAll('#form-register input').forEach((el) => {
  el.addEventListener('input', () => el.classList.remove('is-invalid'));
});
// CEP autofill no modal de contratação
const cepInputReq = document.getElementById('req-cep');
if (cepInputReq) {
  cepInputReq.addEventListener('blur', async () => {
    const raw = cepInputReq.value || '';
    const cep = raw.replace(/\D/g, '');
    if (cep.length !== 8) return;
    try {
      const data = await api(`/external/viacep/${cep}`);
      const map = {
        logradouro: 'logradouro',
        bairro: 'bairro',
        cidade: 'localidade',
        uf: 'uf'
      };
      Object.entries(map).forEach(([field, src]) => {
        const el = document.getElementById(`req-${field}`);
        if (el && data[src] && !el.value) el.value = data[src];
      });
    } catch (err) {
      showToast(err.message);
    }
  });
}
bindIfExists('#form-service', 'submit', handleCreateService);
bindIfExists('#request-form', 'submit', submitRequestForm);
bindIfExists('#btn-filter', 'click', loadServices);
bindIfExists('#btn-logout', 'click', () => {
  setSession(null, null);
  const info = document.getElementById('user-info');
  if (info) info.textContent = '';
  window.location.href = 'index.html';
});

restoreSession();
toggleProviderBanner();
ensureUserContext();
loadServices();

['req-cep', 'req-logradouro', 'req-numero', 'req-bairro', 'req-cidade', 'req-uf'].forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', () => el.classList.remove('is-invalid'));
});
