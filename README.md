# === FILE 9: README.md ===
readme = '''# 🎥 Webcam Recorder

Sito che permette agli utenti di registrare video tramite webcam e inviarli a un pannello admin.

## 📁 Struttura del Progetto

```
webcam-recorder/
├── server.js              # Backend Express
├── package.json           # Dipendenze
├── .gitignore
├── uploads/               # Video salvati (creato automaticamente)
├── videos.json            # Database video (creato automaticamente)
└── public/
    ├── index.html         # Pagina registrazione
    ├── css/
    │   └── style.css      # Stili
    ├── js/
    │   └── app.js         # Logica registrazione
    └── admin/
        ├── index.html     # Pannello admin
        └── admin.js       # Logica admin
```

## 🚀 Installazione Locale

```bash
# 1. Clona o scarica la cartella
cd webcam-recorder

# 2. Installa dipendenze
npm install

# 3. Avvia il server
npm start

# Oppure in modalità sviluppo (auto-reload)
npm run dev
```

Il sito sarà disponibile su `http://localhost:3000`

## 🔐 Accesso Admin
- URL: `http://localhost:3000/admin`
- Password di default: `admin123`
- Puoi cambiarla impostando la variabile d'ambiente `ADMIN_PASSWORD`

## ⚙️ Variabili d'Ambiente

| Variabile | Descrizione | Default |
|-----------|-------------|---------|
| `PORT` | Porta del server | `3000` |
| `ADMIN_PASSWORD` | Password pannello admin | `admin123` |

## 📱 Funzionalità

- ✅ Registrazione video da webcam (mobile + desktop)
- ✅ Formato WebM (compatibile con tutti i browser)
- ✅ Timer di registrazione
- ✅ Limite massimo 5 minuti
- ✅ Anteprima prima dell'invio
- ✅ Upload con barra di progresso
- ✅ Pannello admin con lista video
- ✅ Riproduzione video nel browser
- ✅ Eliminazione video
- ✅ Statistiche (totali, oggi, spazio usato)
- ✅ Auto-refresh admin ogni 30 secondi
'''

with open(f"{base_dir}/README.md", "w") as f:
    f.write(readme)


print("✅ Creato: README.md")