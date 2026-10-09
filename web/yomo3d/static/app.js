'use strict';
const csrf = document.querySelector('meta[name="csrf-token"]')?.content || '';

async function request(url, { method = 'GET', body, json = false } = {}) {
  const headers = {};
  if (csrf && method !== 'GET') headers['X-CSRF-Token'] = csrf;
  if (json) headers['Content-Type'] = 'application/json';
  const response = await fetch(url, { method, headers, credentials: 'same-origin', body: json ? JSON.stringify(body) : body });
  let result = null;
  try { result = await response.json(); } catch { /* e.g. status 204 */ }
  if (!response.ok) {
    const detail = result?.detail;
    throw new Error(typeof detail === 'string' ? detail : `Erreur HTTP ${response.status}`);
  }
  return result;
}

function errorAt(element, message) {
  if (!element) return;
  element.textContent = message || '';
  element.hidden = !message;
}

for (const logout of document.querySelectorAll('[data-logout]')) {
  logout.addEventListener('click', async () => {
    try { await request('/api/logout', { method: 'POST' }); location.assign('/'); }
    catch (error) { alert(error.message); }
  });
}

const authForm = document.getElementById('auth-form');
if (authForm) authForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = authForm.querySelector('button[type="submit"]');
  const data = Object.fromEntries(new FormData(authForm));
  button.disabled = true;
  errorAt(document.getElementById('auth-error'), '');
  try { await request(`/api/${authForm.dataset.mode === 'signup' ? 'signup' : 'login'}`, { method: 'POST', body: data, json: true }); location.assign('/app'); }
  catch (error) { errorAt(document.getElementById('auth-error'), error.message); button.disabled = false; }
});

const createPanel = document.getElementById('create-dialog');
if (createPanel) {
  document.querySelectorAll('[data-show-create]').forEach((el) => el.addEventListener('click', () => { createPanel.hidden = false; createPanel.querySelector('input')?.focus(); createPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }));
  document.querySelector('[data-hide-create]')?.addEventListener('click', () => { createPanel.hidden = true; });
  document.getElementById('create-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      const project = await request('/api/projects', { method: 'POST', body: Object.fromEntries(new FormData(form)), json: true });
      location.assign(`/app/projects/${project.id}`);
    } catch (error) { errorAt(document.getElementById('create-error'), error.message); button.disabled = false; }
  });
}

const workspace = document.querySelector('[data-project-id]');
if (workspace) {
  const id = workspace.dataset.projectId;
  const fileInput = document.getElementById('file-input');
  const dropZone = document.getElementById('drop-zone');
  const queue = document.getElementById('upload-queue');
  const uploadMessage = document.getElementById('upload-message');
  let uploading = false;

  function uploadOne(file) {
    return new Promise((resolve, reject) => {
      const row = document.createElement('div');
      row.className = 'upload-progress';
      const name = document.createElement('span'); name.textContent = file.name;
      const progress = document.createElement('progress'); progress.max = 100; progress.value = 0;
      row.append(name, progress); queue.append(row);
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `/api/projects/${id}/assets`);
      xhr.withCredentials = true;
      xhr.setRequestHeader('X-CSRF-Token', csrf);
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) progress.value = Math.round(e.loaded / e.total * 100); };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) { progress.value = 100; resolve(); }
        else {
          try { reject(new Error(JSON.parse(xhr.responseText).detail)); }
          catch { reject(new Error(`Import refusé (${xhr.status})`)); }
        }
      };
      xhr.onerror = () => reject(new Error('Connexion interrompue pendant l’import'));
      const data = new FormData(); data.append('file', file);
      xhr.send(data);
    });
  }
  async function handleFiles(files) {
    if (uploading || !files.length) return;
    uploading = true;
    errorAt(uploadMessage, '');
    let good = 0;
    const errors = [];
    for (const file of files) {
      try { await uploadOne(file); good += 1; }
      catch (error) { errors.push(`${file.name} : ${error.message}`); }
    }
    uploading = false;
    if (errors.length) errorAt(uploadMessage, errors.join(' · '));
    if (good) location.reload();
  }
  fileInput.addEventListener('change', (event) => { handleFiles(Array.from(event.target.files)); fileInput.value = ''; });
  ['dragenter', 'dragover'].forEach((type) => dropZone.addEventListener(type, (event) => { event.preventDefault(); dropZone.classList.add('dragging'); }));
  ['dragleave', 'drop'].forEach((type) => dropZone.addEventListener(type, (event) => { event.preventDefault(); dropZone.classList.remove('dragging'); }));
  dropZone.addEventListener('drop', (event) => handleFiles(Array.from(event.dataTransfer.files)));

  document.querySelectorAll('[data-delete-asset]').forEach((btn) => btn.addEventListener('click', async () => {
    if (!confirm('Supprimer ce fichier ?')) return;
    try { await request(`/api/projects/${id}/assets/${btn.dataset.deleteAsset}`, { method: 'DELETE' }); location.reload(); }
    catch (error) { errorAt(uploadMessage, error.message); }
  }));

  const status = document.getElementById('job-status');
  function showStatus(job) {
    status.replaceChildren();
    const label = document.createElement('strong');
    const translated = { queued: 'En attente du worker', running: 'Traitement en cours', waiting_gpu: 'GPU requis — aucune reconstruction', needs_media: 'Captures insuffisantes', failed: 'Échec du traitement', completed: 'Artefact 3D généré (viewer non intégré)' };
    label.textContent = translated[job.status] || job.status;
    const details = document.createElement('p'); details.textContent = job.error || `Étape : ${job.stage} · ${job.frame_count} images préparées`;
    status.append(label, details);
  }
  async function poll() {
    try {
      const jobs = await request(`/api/projects/${id}/jobs`);
      if (!jobs.length) return;
      showStatus(jobs[0]);
      if (['queued', 'running'].includes(jobs[0].status)) setTimeout(poll, 4000);
    } catch { /* display existing state */ }
  }
  const start = document.getElementById('start-job');
  start.addEventListener('click', async () => {
    start.disabled = true;
    try { const job = await request(`/api/projects/${id}/jobs`, { method: 'POST' }); showStatus(job); poll(); }
    catch (error) { errorAt(uploadMessage, error.message); }
    finally { start.disabled = false; }
  });
  poll();

  document.getElementById('delete-project')?.addEventListener('click', async () => {
    if (!confirm('Supprimer définitivement ce projet, ses photos, vidéos et traitements ?')) return;
    try { await request(`/api/projects/${id}`, { method: 'DELETE' }); location.assign('/app'); }
    catch (error) { errorAt(uploadMessage, error.message); }
  });
}
