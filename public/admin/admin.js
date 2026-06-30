
# === FILE 7: public/admin/admin.js (Logica Admin) ===
admin_js = '''// === ADMIN PANEL ===

const API_BASE = '';
let adminPassword = localStorage.getItem('adminPassword') || '';

const elements = {
  loginScreen: document.getElementById('login-screen'),
  adminDashboard: document.getElementById('admin-dashboard'),
  passwordInput: document.getElementById('admin-password'),
  btnLogin: document.getElementById('btn-login'),
  btnLogout: document.getElementById('btn-logout'),
  loginError: document.getElementById('login-error'),
  videoGrid: document.getElementById('video-grid'),
  emptyState: document.getElementById('empty-state'),
  statTotal: document.getElementById('stat-total'),
  statToday: document.getElementById('stat-today'),
  statSize: document.getElementById('stat-size'),
  videoModal: document.getElementById('video-modal'),
  modalVideo: document.getElementById('modal-video'),
  btnCloseModal: document.getElementById('btn-close-modal')
};

// === LOGIN ===

function showLogin() {
  elements.loginScreen.classList.add('active');
  elements.adminDashboard.classList.remove('active');
}

function showDashboard() {
  elements.loginScreen.classList.remove('active');
  elements.adminDashboard.classList.add('active');
}

async function login() {
  const password = elements.passwordInput.value.trim();
  if (!password) return;
  
  // Verifica password facendo una richiesta di test
  try {
    const response = await fetch(`${API_BASE}/api/videos?password=${encodeURIComponent(password)}`);
    
    if (response.ok) {
      adminPassword = password;
      localStorage.setItem('adminPassword', password);
      elements.loginError.style.display = 'none';
      showDashboard();
      loadVideos();
    } else {
      elements.loginError.style.display = 'block';
      elements.passwordInput.value = '';
    }
  } catch (err) {
    elements.loginError.textContent = 'Errore di connessione';
    elements.loginError.style.display = 'block';
  }
}

function logout() {
  adminPassword = '';
  localStorage.removeItem('adminPassword');
  elements.passwordInput.value = '';
  showLogin();
}

// === LOAD VIDEOS ===

async function loadVideos() {
  try {
    const response = await fetch(`${API_BASE}/api/videos?password=${encodeURIComponent(adminPassword)}`);
    
    if (!response.ok) {
      if (response.status === 401) {
        logout();
        return;
      }
      throw new Error('Errore nel caricamento');
    }
    
    const videos = await response.json();
    renderVideos(videos);
    updateStats(videos);
    
  } catch (err) {
    console.error('Errore:', err);
    elements.videoGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <div class="icon">⚠️</div>
        <h3>Errore di connessione</h3>
        <p>Riprova più tardi</p>
      </div>
    `;
  }
}

// === RENDER ===

function renderVideos(videos) {
  if (videos.length === 0) {
    elements.videoGrid.style.display = 'none';
    elements.emptyState.style.display = 'block';
    return;
  }
  
  elements.videoGrid.style.display = 'grid';
  elements.emptyState.style.display = 'none';
  
  elements.videoGrid.innerHTML = videos.map(video => {
    const date = new Date(video.createdAt);
    const dateStr = date.toLocaleDateString('it-IT', { 
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    const sizeMB = (video.size / (1024 * 1024)).toFixed(1);
    
    return `
      <div class="video-card" data-id="${video.id}">
        <video 
          src="${video.url}" 
          preload="metadata"
          onclick="openModal('${video.url}')"
        ></video>
        <div class="info">
          <div class="date">📅 ${dateStr}</div>
          <div style="color: var(--text-muted); font-size: 0.85rem;">
            📦 ${sizeMB} MB
          </div>
          <div class="actions">
            <button class="btn btn-primary btn-small" onclick="openModal('${video.url}')">
              ▶️ Riproduci
            </button>
            <button class="btn btn-danger btn-small" onclick="deleteVideo('${video.id}', this)">
              🗑️ Elimina
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function updateStats(videos) {
  elements.statTotal.textContent = videos.length;
  
  const today = new Date().toDateString();
  const todayCount = videos.filter(v => new Date(v.createdAt).toDateString() === today).length;
  elements.statToday.textContent = todayCount;
  
  const totalSize = videos.reduce((sum, v) => sum + (v.size || 0), 0);
  elements.statSize.textContent = (totalSize / (1024 * 1024)).toFixed(1) + ' MB';
}

// === MODAL ===

window.openModal = function(url) {
  elements.modalVideo.src = url;
  elements.videoModal.style.display = 'flex';
  elements.modalVideo.play();
};

function closeModal() {
  elements.modalVideo.pause();
  elements.modalVideo.src = '';
  elements.videoModal.style.display = 'none';
}

// === DELETE ===

window.deleteVideo = async function(id, btn) {
  if (!confirm('Sei sicuro di voler eliminare questo video?')) return;
  
  btn.disabled = true;
  btn.textContent = '⏳...';
  
  try {
    const response = await fetch(`${API_BASE}/api/videos/${id}?password=${encodeURIComponent(adminPassword)}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      // Rimuovi card dall'UI
      const card = btn.closest('.video-card');
      card.style.opacity = '0';
      card.style.transform = 'scale(0.9)';
      setTimeout(() => {
        card.remove();
        // Ricarica per aggiornare stats
        loadVideos();
      }, 300);
    } else {
      alert('Errore durante l\\'eliminazione');
      btn.disabled = false;
      btn.textContent = '🗑️ Elimina';
    }
  } catch (err) {
    alert('Errore di connessione');
    btn.disabled = false;
    btn.textContent = '🗑️ Elimina';
  }
};

// === EVENT LISTENERS ===

elements.btnLogin.addEventListener('click', login);

elements.passwordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') login();
});

elements.btnLogout.addEventListener('click', logout);

elements.btnCloseModal.addEventListener('click', closeModal);

elements.videoModal.addEventListener('click', (e) => {
  if (e.target === elements.videoModal) closeModal();
});

// === INIZIALIZZAZIONE ===

if (adminPassword) {
  // Verifica che la password salvata sia ancora valida
  fetch(`${API_BASE}/api/videos?password=${encodeURIComponent(adminPassword)}`)
    .then(r => {
      if (r.ok) {
        showDashboard();
        loadVideos();
      } else {
        showLogin();
      }
    })
    .catch(() => showLogin());
} else {
  showLogin();
}

// Auto-refresh ogni 30 secondi
setInterval(() => {
  if (adminPassword && elements.adminDashboard.classList.contains('active')) {
    loadVideos();
  }
}, 30000);

console.log('🔐 Admin Panel pronto!');
'''

with open(f"{base_dir}/public/admin/admin.js", "w") as f:
    f.write(admin_js)

print("✅ Creato: public/admin/admin.js")
