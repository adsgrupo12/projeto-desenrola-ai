const API_BASE = window.localStorage.getItem('apiBase') || 'http://localhost:3001';

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
  fields.forEach((f) => {
    const el = document.querySelector(`[name="${f}"]`);
    if (el && params.get(f)) el.value = params.get(f);
  });
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

async function handleProviderRegister(event) {
  event.preventDefault();
  const form = event.target;

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
    showToast(err.message);
  }
}

document.getElementById('form-provider').addEventListener('submit', handleProviderRegister);
getPrefill();
