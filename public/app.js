
# === FILE 5: public/js/app.js (Logica registrazione) ===
app_js = '''// === WEBCAM RECORDER - APP ===

const elements = {
  // Steps
  stepPermission: document.getElementById('step-permission'),
  stepPreview: document.getElementById('step-preview'),
  stepReview: document.getElementById('step-review'),
  stepUploading: document.getElementById('step-uploading'),
  stepSuccess: document.getElementById('step-success'),
  stepError: document.getElementById('step-error'),
  
  // Video
  previewVideo: document.getElementById('preview-video'),
  reviewVideo: document.getElementById('review-video'),
  
  // Buttons
  btnStartCamera: document.getElementById('btn-start-camera'),
  btnRecord: document.getElementById('btn-record'),
  btnStop: document.getElementById('btn-stop'),
  btnRetry: document.getElementById('btn-retry'),
  btnSend: document.getElementById('btn-send'),
  btnNewVideo: document.getElementById('btn-new-video'),
  btnRetryError: document.getElementById('btn-retry-error'),
  
  // UI
  recordingBadge: document.getElementById('recording-badge'),
  timer: document.getElementById('timer'),
  uploadProgress: document.getElementById('upload-progress'),
  progressFill: document.getElementById('progress-fill'),
  errorMessage: document.getElementById('error-message')
};

let mediaRecorder = null;
let stream = null;
let recordedChunks = [];
let recordingTimer = null;
let recordingSeconds = 0;
let recordedBlob = null;

// === UTILITIES ===

function showStep(stepId) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.getElementById(stepId).classList.add('active');
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function showError(msg) {
  elements.errorMessage.textContent = msg;
  showStep('step-error');
}

// === CAMERA ===

async function startCamera() {
  try {
    // Richiedi accesso alla fotocamera (preferisce quella posteriore su mobile)
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user', // 'environment' per fotocamera posteriore
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: true
    });
    
    elements.previewVideo.srcObject = stream;
    showStep('step-preview');
    
  } catch (err) {
    console.error('Errore camera:', err);
    let msg = 'Impossibile accedere alla fotocamera.';
    if (err.name === 'NotAllowedError') {
      msg = 'Hai negato il permesso. Ricarica la pagina e consenti l\\'accesso alla fotocamera.';
    } else if (err.name === 'NotFoundError') {
      msg = 'Nessuna fotocamera trovata sul dispositivo.';
    }
    showError(msg);
  }
}

// === RECORDING ===

function startRecording() {
  recordedChunks = [];
  recordingSeconds = 0;
  
  // Usa MediaRecorder con formato supportato
  const mimeTypes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4'
  ];
  
  let selectedMimeType = '';
  for (const type of mimeTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      selectedMimeType = type;
      break;
    }
  }
  
  if (!selectedMimeType) {
    showError('Il tuo browser non supporta la registrazione video.');
    return;
  }
  
  mediaRecorder = new MediaRecorder(stream, { mimeType: selectedMimeType });
  
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };
  
  mediaRecorder.onstop = () => {
    recordedBlob = new Blob(recordedChunks, { type: selectedMimeType });
    const url = URL.createObjectURL(recordedBlob);
    elements.reviewVideo.src = url;
    showStep('step-review');
  };
  
  mediaRecorder.onerror = (e) => {
    console.error('Errore MediaRecorder:', e);
    showError('Errore durante la registrazione.');
  };
  
  mediaRecorder.start(100); // Salva chunk ogni 100ms
  
  // UI
  elements.btnRecord.classList.add('hidden');
  elements.btnStop.classList.remove('hidden');
  elements.recordingBadge.classList.remove('hidden');
  
  // Timer
  elements.timer.textContent = '00:00';
  recordingTimer = setInterval(() => {
    recordingSeconds++;
    elements.timer.textContent = formatTime(recordingSeconds);
    
    // Limite massimo: 5 minuti
    if (recordingSeconds >= 300) {
      stopRecording();
    }
  }, 1000);
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  
  clearInterval(recordingTimer);
  
  // UI
  elements.btnRecord.classList.remove('hidden');
  elements.btnStop.classList.add('hidden');
  elements.recordingBadge.classList.add('hidden');
  elements.timer.textContent = '00:00';
}

// === UPLOAD ===

async function uploadVideo() {
  if (!recordedBlob) {
    showError('Nessun video da inviare.');
    return;
  }
  
  showStep('step-uploading');
  
  const formData = new FormData();
  formData.append('video', recordedBlob, 'recording.webm');
  
  // Simula progresso
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress > 90) progress = 90;
    elements.uploadProgress.textContent = Math.round(progress) + '%';
    elements.progressFill.style.width = progress + '%';
  }, 300);
  
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    clearInterval(progressInterval);
    elements.uploadProgress.textContent = '100%';
    elements.progressFill.style.width = '100%';
    
    const data = await response.json();
    
    if (data.success) {
      setTimeout(() => {
        showStep('step-success');
      }, 500);
    } else {
      showError(data.error || 'Errore durante l\\'upload.');
    }
    
  } catch (err) {
    clearInterval(progressInterval);
    console.error('Errore upload:', err);
    showError('Errore di connessione. Riprova.');
  }
}

// === RESET ===

function resetRecorder() {
  // Ferma lo stream precedente
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
  
  recordedBlob = null;
  recordedChunks = [];
  
  // Torna a chiedere la fotocamera
  showStep('step-permission');
}

// === EVENT LISTENERS ===

elements.btnStartCamera.addEventListener('click', startCamera);

elements.btnRecord.addEventListener('click', startRecording);

elements.btnStop.addEventListener('click', stopRecording);

elements.btnRetry.addEventListener('click', () => {
  // Torna alla preview senza richiedere di nuovo la camera
  if (stream && stream.active) {
    elements.previewVideo.srcObject = stream;
    showStep('step-preview');
  } else {
    resetRecorder();
  }
});

elements.btnSend.addEventListener('click', uploadVideo);

elements.btnNewVideo.addEventListener('click', resetRecorder);

elements.btnRetryError.addEventListener('click', resetRecorder);

// === INIZIALIZZAZIONE ===
console.log('🎥 Webcam Recorder pronto!');
'''

with open(f"{base_dir}/public/js/app.js", "w") as f:
    f.write(app_js)

print("✅ Creato: public/js/app.js")
