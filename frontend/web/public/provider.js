const API_BASE =
  window.API_BASE ||
  window.localStorage.getItem('apiBase') ||
  (location.hostname.includes('vercel.app') ? 'https://desenrola-ai-teste.onrender.com' : 'http://localhost:3001');

const toastEl = document.getElementById('toast');
const toastBody = document.getElementById('toast-body');
const toast = toastEl ? new bootstrap.Toast(toastEl) : null;

function showToast(message) {
  if (!toast || !toastBody) return;
  toastBody.textContent = message;
  toast.show();
}

function getPrefill() {
  const params = new URLSearchParams(window.location.search);
  const fields = ['nome', 'email', 'telefone'];
  let loaded = false;
  fields.forEach((f) => {
    const el = document.querySelector(`[name="${f}"]`);
    const val = params.get(f);
    if (el && val) {
      el.value = val;
      loaded = true;
    }
  });
  if (!loaded) {
    try {
      const cached = localStorage.getItem('providerPrefill');
      if (cached) {
        const data = JSON.parse(cached);
        fields.forEach((f) => {
          const el = document.querySelector(`[name="${f}"]`);
          if (el && data[f]) el.value = data[f];
        });
      }
    } catch (_) {
      /* ignore parse errors */
    } finally {
      localStorage.removeItem('providerPrefill');
    }
  } else {
    localStorage.removeItem('providerPrefill');
  }
}

async function api(path, options = {}) {
  const headers = options.headers || {};
  headers['Content-Type'] = 'application/json';

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

function friendlyError(message) {
  const msg = message || '';
  const lower = msg.toLowerCase();
  if (lower.includes('account already exists') || lower.includes('username')) {
    return 'E-mail já cadastrado. Faça o login.';
  }
  return message;
}

async function fetchCep(cep) {
  const sanitized = (cep || '').replace(/\D/g, '');
  if (sanitized.length !== 8) throw new Error('CEP inválido');
  return api(`/external/viacep/${sanitized}`);
}

function clearErrors(form) {
  form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
  const msg = document.getElementById('form-error');
  if (msg) msg.classList.add('d-none');
}

function showError(message) {
  const msg = document.getElementById('form-error');
  if (msg) {
    msg.textContent = message || 'Preencha todos os campos obrigatórios.';
    msg.classList.remove('d-none');
  }
}

async function handleProviderRegister(event) {
  event.preventDefault();
  const form = event.target;
  clearErrors(form);

  const requiredFields = [
    'nome',
    'email',
    'telefone',
    'senha',
    'confirmarSenha',
    'cep',
    'logradouro',
    'numero',
    'bairro',
    'cidade',
    'uf',
    'categorias',
    'descricao'
  ];

  let hasError = false;
  requiredFields.forEach((field) => {
    const el = form[field];
    if (!el || !el.value.trim()) {
      hasError = true;
      el?.classList.add('is-invalid');
    }
  });

  const phoneDigits = (form.telefone.value || '').replace(/\D/g, '');
  if (phoneDigits.length < 10 || phoneDigits.length > 11) {
    hasError = true;
    form.telefone.classList.add('is-invalid');
  }

  if (form.senha.value !== form.confirmarSenha.value) {
    hasError = true;
    form.senha.classList.add('is-invalid');
    form.confirmarSenha.classList.add('is-invalid');
    showError('As senhas não coincidem.');
    return;
  }

  if (hasError) {
    showError('Preencha todos os campos obrigatórios.');
    return;
  }

  if (form.senha.value !== form.confirmarSenha.value) {
    showToast('Senhas não coincidem.');
    return;
  }

  try {
    const body = {
      nome: form.nome.value,
      email: form.email.value,
      telefone: form.telefone.value,
      senha: form.senha.value,
      role: 'PRESTADOR',
      logradouro: form.logradouro.value,
      numero: form.numero.value,
      bairro: form.bairro.value,
      cidade: form.cidade.value,
      uf: form.uf.value,
      cep: form.cep.value,
      descricao: form.descricao.value,
      categorias: form.categorias.value
    };

    const data = await api('/auth/register', { method: 'POST', body });
    localStorage.setItem('sessionToken', data.sessionToken);
    localStorage.setItem('role', data.role);
    if (body.nome) {
      localStorage.setItem('userName', body.nome);
    }
    showToast('Cadastro de prestador concluído!');
    setTimeout(() => {
      window.location.href = 'profile.html';
    }, 800);
  } catch (err) {
    showToast(friendlyError(err.message));
  }
}

document.getElementById('form-provider').addEventListener('submit', handleProviderRegister);
getPrefill();

const cepInput = document.querySelector('[name="cep"]');
if (cepInput) {
  cepInput.addEventListener('blur', async () => {
    const cep = cepInput.value || '';
    if ((cep || '').replace(/\D/g, '').length !== 8) return;
    try {
      const data = await fetchCep(cep);
      const fields = {
        logradouro: 'logradouro',
        bairro: 'bairro',
        cidade: 'localidade',
        uf: 'uf'
      };
      Object.entries(fields).forEach(([field, src]) => {
        const el = document.querySelector(`[name="${field}"]`);
        if (el && data[src] && !el.value) el.value = data[src];
      });
    } catch (err) {
      showToast(err.message);
    }
  });
}

// remove erro visual ao digitar
document.querySelectorAll('#form-provider input, #form-provider textarea').forEach((el) => {
  el.addEventListener('input', () => el.classList.remove('is-invalid'));
});
