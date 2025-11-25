const API_BASE = window.API_BASE || window.localStorage.getItem('apiBase') || 'http://localhost:3001';

let currentUser = null;
let requestsCache = [];
let detailsModal;
let editModal;
let mapInstance;
let mapMarker;
let currentMapRequestId = null;
let currentMarkerCoords = null;

function showToast(message) {
  const toastEl = document.getElementById('toast');
  const toastBody = document.getElementById('toast-body');
  if (!toastEl || !toastBody) return;
  const toast = new bootstrap.Toast(toastEl);
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
  if (resp.status === 204) return null;
  return resp.json();
}

function ensureAvatar(name) {
  const first = (name || '').trim().split(' ')[0];
  const letter = first ? first[0].toUpperCase() : '?';
  const navAvatar = document.getElementById('nav-avatar');
  if (navAvatar) navAvatar.textContent = letter;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '-' : d.toLocaleString();
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function statusBadge(status) {
  const norm = (status || '').toUpperCase();
  const map = {
    CANCELADO: 'bg-danger',
    RECUSADO: 'bg-danger',
    PENDENTE: 'bg-warning text-dark',
    NEGOCIACAO: 'bg-warning text-dark',
    CONFIRMADO: 'bg-success',
    EM_NEGOCIACAO: 'bg-warning text-dark'
  };
  return map[norm] || 'bg-secondary';
}

async function loadMe() {
  const token = localStorage.getItem('sessionToken');
  if (!token) {
    window.location.href = 'auth.html#login';
    return null;
  }
  const me = await api('/auth/me');
  currentUser = me;
  if (me?.nome) {
    localStorage.setItem('userName', me.nome);
    ensureAvatar(me.nome);
  }
  return me;
}

function locationText(r) {
  const parts = [r.cidade, r.uf].filter(Boolean);
  return parts.length ? parts.join('/') : 'Não informado';
}

function buildAddressString(r) {
  const parts = [r.logradouro, r.numero, r.bairro, r.cidade, r.uf, r.cep].filter(Boolean);
  return parts.join(', ');
}

function updateCoordText(lat, lon) {
  const el = document.getElementById('coord-text');
  if (el) {
    el.textContent = lat && lon ? `Lat: ${lat.toFixed(5)} | Lon: ${lon.toFixed(5)}` : 'Localização não disponível.';
  }
}

async function ensureMap(lat, lon) {
  const mapEl = document.getElementById('request-map');
  if (!mapEl || lat === undefined || lon === undefined) return;
  const target = [lat, lon];
  if (!mapInstance) {
    mapInstance = L.map(mapEl).setView(target, 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(mapInstance);
  } else {
    mapInstance.setView(target, 15);
  }

  if (mapMarker) {
    mapMarker.setLatLng(target);
  } else {
    mapMarker = L.marker(target, { draggable: true }).addTo(mapInstance);
    mapMarker.on('dragend', () => {
      const pos = mapMarker.getLatLng();
      currentMarkerCoords = { lat: pos.lat, lon: pos.lng };
      updateCoordText(pos.lat, pos.lng);
    });
  }
  currentMarkerCoords = { lat, lon };
  updateCoordText(lat, lon);
}

async function geocodeAddress(r) {
  const address = buildAddressString(r);
  if (!address) throw new Error('Endereço não informado');
  const data = await api(`/external/geocode?endereco=${encodeURIComponent(address)}`);
  return { lat: data.latitude, lon: data.longitude, precision: data.geocode_precision };
}

function buildCard(r, isReceived) {
  const serviceLine = r.servicoTitulo || 'Serviço';
  const nameLine = isReceived ? `Cliente: ${r.clienteNome || ''}` : `Prestador: ${r.servicoPrestadorNome || r.prestadorNome || ''}`;
  const priceLine = r.servicoPreco ? `<div class="small text-muted mb-1">Valor/condição: ${formatCurrency(r.servicoPreco)}</div>` : '';
  const badge = `<span class="badge ${statusBadge(r.status)}">${r.status}</span>`;
  const actions =
    isReceived && ['PENDENTE', 'NEGOCIACAO'].includes(r.status)
      ? `<div class="mt-2 d-flex gap-2">
          <button class="btn btn-outline-success btn-sm flex-fill" data-approve="${r.id}">Aprovar</button>
          <button class="btn btn-outline-danger btn-sm flex-fill" data-reject="${r.id}">Recusar</button>
        </div>`
      : '';

  const editActions = !isReceived
    ? `<div class="mt-2 d-flex gap-2">
         <button class="btn btn-outline-success btn-sm flex-fill" data-edit="${r.id}">Editar</button>
         <button class="btn btn-outline-danger btn-sm flex-fill" data-cancel="${r.id}">Cancelar</button>
       </div>`
    : `<div class="mt-2 d-flex gap-2">
         <button class="btn btn-outline-danger btn-sm flex-fill" data-cancel="${r.id}">Cancelar</button>
       </div>`;

  return `
    <div class="col-12 col-lg-6">
      <div class="card shadow-sm h-100">
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between">
            <h6 class="fw-semibold mb-1">${serviceLine}</h6>
            <span class="badge bg-light text-secondary border">${r.servicoCategoria || ''}</span>
          </div>
          ${priceLine}
          <div class="small text-muted mb-1">${nameLine}</div>
          <div class="small text-muted mb-1">Status: ${badge}</div>
          <div class="small text-muted mb-1">Atualizado: ${formatDate(r.updatedAt || r.createdAt)}</div>
          <div class="small text-muted mb-2">Local: ${locationText(r)}</div>
          <div class="d-flex gap-2 mt-auto">
            <button class="btn btn-outline-success btn-sm flex-fill" data-details="${r.id}">Mais detalhes</button>
            ${actions}
          </div>
          ${editActions}
        </div>
      </div>
    </div>
  `;
}

function renderRequests(data) {
  requestsCache = data;
  const myContainer = document.getElementById('requests-client');
  const recvContainer = document.getElementById('requests-prestador');
  if (!currentUser) return;

  const mine = data.filter((r) => r.clienteId === currentUser.id);
  const received = data.filter((r) => r.prestadorId === currentUser.id);

  myContainer.innerHTML = mine.length
    ? mine.map((r) => buildCard(r, false)).join('')
    : '<div class="col-12 text-muted">Nenhuma solicitação feita.</div>';

  recvContainer.innerHTML = received.length
    ? received.map((r) => buildCard(r, true)).join('')
    : '<div class="col-12 text-muted">Nenhuma solicitação recebida.</div>';

  recvContainer.querySelectorAll('[data-approve]').forEach((btn) => {
    btn.addEventListener('click', () => updateStatus(btn.dataset.approve, 'CONFIRMADO'));
  });
  recvContainer.querySelectorAll('[data-reject]').forEach((btn) => {
    btn.addEventListener('click', () => updateStatus(btn.dataset.reject, 'RECUSADO'));
  });

  document.querySelectorAll('[data-details]').forEach((btn) => {
    btn.addEventListener('click', () => openDetails(btn.dataset.details));
  });
  document.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => openEdit(btn.dataset.edit));
  });
  document.querySelectorAll('[data-cancel]').forEach((btn) => {
    btn.addEventListener('click', () => updateStatus(btn.dataset.cancel, 'CANCELADO'));
  });
}

async function loadRequests() {
  try {
    const data = await api('/requests/mine');
    renderRequests(data);
  } catch (err) {
    showToast(err.message);
  }
}

async function updateStatus(id, status) {
  try {
    await api(`/requests/${id}/status`, { method: 'PATCH', body: { status } });
    showToast('Status atualizado');
    loadRequests();
  } catch (err) {
    showToast(err.message);
  }
}

function openDetails(id) {
  const r = requestsCache.find((item) => item.id === id);
  if (!r) return;
  const modalBody = document.getElementById('modal-request-body');
  if (!modalBody) return;

  const loc = locationText(r);
  modalBody.innerHTML = `
    <div>
      <div class="fw-semibold">Serviço</div>
      <div>${r.servicoTitulo || 'Serviço'}</div>
      <div class="text-muted small">Categoria: ${r.servicoCategoria || '-'}</div>
      <div class="text-muted small">Valor/condição: ${formatCurrency(r.servicoPreco) || '-'}</div>
      <div class="text-muted small">Status: ${r.status}</div>
      <div class="text-muted small">Atualizado: ${formatDate(r.updatedAt || r.createdAt)}</div>
    </div>
    <hr>
    <div class="row">
      <div class="col-md-6">
        <div class="fw-semibold mb-1">Cliente</div>
        <div>${r.clienteNome || '-'}</div>
        <div class="text-muted small">${r.clienteEmail || ''}</div>
        <div class="text-muted small">${r.clienteTelefone || ''}</div>
      </div>
      <div class="col-md-6">
        <div class="fw-semibold mb-1">Prestador</div>
        <div>${r.servicoPrestadorNome || r.prestadorNome || '-'}</div>
        <div class="text-muted small">${r.prestadorEmail || ''}</div>
        <div class="text-muted small">${r.prestadorTelefone || ''}</div>
      </div>
    </div>
    <hr>
    <div>
      <div class="fw-semibold">Local / Endereço</div>
      <div class="text-muted small">${loc}</div>
      <div class="text-muted small">
        ${[
          r.logradouro,
          r.numero,
          r.bairro,
          r.cep ? `CEP: ${r.cep}` : '',
          r.complemento
        ]
          .filter(Boolean)
          .join(' | ') || '-'}
      </div>
    </div>
    <hr>
    <div>
      <div class="fw-semibold">Observações do cliente</div>
      <div class="text-muted">${r.detalhes || 'Sem observações.'}</div>
    </div>
  `;

  currentMapRequestId = id;
  currentMarkerCoords = null;

  const loadMap = async () => {
    try {
      let lat = r.latitude;
      let lon = r.longitude;
      if (lat === null || lat === undefined || lon === null || lon === undefined) {
        const geo = await geocodeAddress(r);
        lat = geo.lat;
        lon = geo.lon;
      }
      await ensureMap(lat, lon);
    } catch (err) {
      updateCoordText(null, null);
      showToast(err.message);
    }
  };

  if (!detailsModal) {
    detailsModal = new bootstrap.Modal(document.getElementById('requestDetailsModal'));
  }
  detailsModal.show();
  setTimeout(loadMap, 200);
}

function populateEditForm(r) {
  document.getElementById('edit-request-id').value = r.id;
  document.getElementById('edit-detalhes').value = r.detalhes || '';
  document.getElementById('edit-cep').value = r.cep || '';
  document.getElementById('edit-logradouro').value = r.logradouro || '';
  document.getElementById('edit-numero').value = r.numero || '';
  document.getElementById('edit-bairro').value = r.bairro || '';
  document.getElementById('edit-cidade').value = r.cidade || '';
  document.getElementById('edit-uf').value = r.uf || '';
  document.getElementById('edit-complemento').value = r.complemento || '';
}

function openEdit(id) {
  const r = requestsCache.find((item) => item.id === id);
  if (!r) return;
  populateEditForm(r);
  if (!editModal) editModal = new bootstrap.Modal(document.getElementById('editRequestModal'));
  editModal.show();
}

async function submitEditForm(event) {
  event.preventDefault();
  const id = document.getElementById('edit-request-id').value;
  if (!id) return;
  const body = {
    detalhes: document.getElementById('edit-detalhes').value,
    endereco: {
      cep: document.getElementById('edit-cep').value,
      logradouro: document.getElementById('edit-logradouro').value,
      numero: document.getElementById('edit-numero').value,
      bairro: document.getElementById('edit-bairro').value,
      cidade: document.getElementById('edit-cidade').value,
      uf: document.getElementById('edit-uf').value,
      complemento: document.getElementById('edit-complemento').value
    }
  };
  try {
    await api(`/requests/${id}`, { method: 'PATCH', body });
    if (editModal) editModal.hide();
    showToast('Solicitação atualizada');
    loadRequests();
  } catch (err) {
    showToast(err.message);
  }
}

async function saveLocation() {
  if (!currentMapRequestId || !currentMarkerCoords) {
    showToast('Nenhuma localização para salvar.');
    return;
  }
  try {
    await api(`/requests/${currentMapRequestId}`, {
      method: 'PATCH',
      body: {
        endereco: {
          latitude: currentMarkerCoords.lat,
          longitude: currentMarkerCoords.lon,
          geocode_precision: 'manual'
        }
      }
    });
    showToast('Localização atualizada');
    loadRequests();
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
  const editForm = document.getElementById('edit-request-form');
  if (editForm) editForm.addEventListener('submit', submitEditForm);
  const btnSaveLocation = document.getElementById('btn-save-location');
  if (btnSaveLocation) btnSaveLocation.addEventListener('click', saveLocation);
  await loadMe();
  await loadRequests();
})();
