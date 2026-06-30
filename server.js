
# === FILE 2: server.js (Backend Express) ===
server_js = '''const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// === CONFIGURAZIONE ===
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const VIDEOS_FILE = path.join(__dirname, 'videos.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Crea cartella uploads se non esiste
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Crea file videos.json se non esiste
if (!fs.existsSync(VIDEOS_FILE)) {
  fs.writeFileSync(VIDEOS_FILE, '[]');
}

// === MIDDLEWARE ===
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static(UPLOAD_DIR));

// === MULTER (gestione upload video) ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${uuidv4()}.webm`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // max 500MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo file video sono permessi'));
    }
  }
});

// === ROUTES ===

// 📹 Pagina principale (registrazione)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🔐 Pagina admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// 📤 Upload video
app.post('/api/upload', upload.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nessun video ricevuto' });
    }

    const videoData = {
      id: uuidv4(),
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`,
      createdAt: new Date().toISOString(),
      userAgent: req.headers['user-agent'] || 'unknown',
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
    };

    // Salva nel database JSON
    const videos = JSON.parse(fs.readFileSync(VIDEOS_FILE, 'utf8'));
    videos.unshift(videoData); // Aggiunge in cima (più recente prima)
    fs.writeFileSync(VIDEOS_FILE, JSON.stringify(videos, null, 2));

    res.json({ 
      success: true, 
      message: 'Video salvato!',
      video: videoData
    });

  } catch (error) {
    console.error('Errore upload:', error);
    res.status(500).json({ error: 'Errore durante il salvataggio' });
  }
});

// 📋 Lista video (protetta da password semplice via query param)
app.get('/api/videos', (req, res) => {
  const password = req.headers['x-admin-password'] || req.query.password;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Password admin non valida' });
  }

  try {
    const videos = JSON.parse(fs.readFileSync(VIDEOS_FILE, 'utf8'));
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: 'Errore nel caricamento dei video' });
  }
});

// 🗑️ Elimina video
app.delete('/api/videos/:id', (req, res) => {
  const password = req.headers['x-admin-password'] || req.query.password;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Password admin non valida' });
  }

  try {
    let videos = JSON.parse(fs.readFileSync(VIDEOS_FILE, 'utf8'));
    const video = videos.find(v => v.id === req.params.id);
    
    if (!video) {
      return res.status(404).json({ error: 'Video non trovato' });
    }

    // Elimina file dal disco
    const filePath = path.join(UPLOAD_DIR, video.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Rimuovi dal database
    videos = videos.filter(v => v.id !== req.params.id);
    fs.writeFileSync(VIDEOS_FILE, JSON.stringify(videos, null, 2));

    res.json({ success: true, message: 'Video eliminato' });
  } catch (error) {
    res.status(500).json({ error: 'Errore durante l\\'eliminazione' });
  }
});

// ❌ Gestione errori
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Errore server' });
});

// 🚀 Avvio server
app.listen(PORT, () => {
  console.log(`\\n🎥 Webcam Recorder avviato!`);
  console.log(`📱 Pagina registrazione: http://localhost:${PORT}`);
  console.log(`🔐 Pannello admin: http://localhost:${PORT}/admin`);
  console.log(`\\n⚙️  Password admin: ${ADMIN_PASSWORD}`);
  console.log(`   (Puoi cambiarla impostando la variabile ADMIN_PASSWORD)\\n`);
});
'''

with open(f"{base_dir}/server.js", "w") as f:
    f.write(server_js)

print("✅ Creato: server.js")
