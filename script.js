const camera = document.getElementById("camera");
const frame = document.getElementById("frame");
const preview = document.getElementById("preview");
const canvas = document.getElementById("photoCanvas");
const captureButton = document.getElementById("capture");
const switchButton = document.getElementById("switchCamera");
const saveButton = document.getElementById("savePhoto");
const retakeButton = document.getElementById("retakePhoto");
const status = document.getElementById("status");

let stream = null;
let facingMode = "user";
let photoBlob = null;
let previewUrl = null;

function showStatus(message) {
  status.textContent = message;
}

async function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showStatus("Browser tidak mendukung kamera. Buka melalui HTTPS di browser terbaru.");
    return;
  }

  stopCamera();
  showStatus("Mengaktifkan kamera...");
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    });
    camera.srcObject = stream;
    camera.classList.toggle("camera-mirror", facingMode === "user");
    await camera.play();
    showStatus("Kamera siap. Tekan tombol tengah untuk mengambil foto.");
  } catch (error) {
    console.error(error);
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      showStatus("Izin kamera ditolak. Izinkan akses kamera melalui pengaturan browser.");
    } else {
      showStatus("Kamera tidak dapat diaktifkan. Periksa izin atau perangkat kamera.");
    }
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  camera.srcObject = null;
}

async function switchCamera() {
  facingMode = facingMode === "user" ? "environment" : "user";
  await startCamera();
}

function drawCover(ctx, video, width, height) {
  const sourceRatio = video.videoWidth / video.videoHeight;
  const targetRatio = width / height;
  let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;

  if (sourceRatio > targetRatio) {
    sw = video.videoHeight * targetRatio;
    sx = (video.videoWidth - sw) / 2;
  } else {
    sh = video.videoWidth / targetRatio;
    sy = (video.videoHeight - sh) / 2;
  }
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, width, height);
}

function capturePhoto() {
  if (!stream || !camera.videoWidth) {
    showStatus("Kamera belum siap. Tunggu sebentar atau izinkan akses kamera.");
    return;
  }

  const width = 1080;
  const height = 1920;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  drawCover(ctx, camera, width, height);

  if (frame.complete && frame.naturalWidth > 0) {
    ctx.drawImage(frame, 0, 0, width, height);
  }

  canvas.toBlob(blob => {
    if (!blob) {
      showStatus("Foto gagal dibuat. Silakan coba lagi.");
      return;
    }
    photoBlob = blob;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(blob);
    preview.src = previewUrl;
    preview.hidden = false;
    camera.style.visibility = "hidden";
    saveButton.disabled = false;
    switchButton.hidden = true;
retakeButton.hidden = false;
    showStatus("Preview foto siap. Tekan Foto Ulang untuk mengambil kembali atau Simpan untuk mengunduh.");
  }, "image/png");
}

function savePhoto() {
  if (!photoBlob) {
    showStatus("Ambil foto terlebih dahulu.");
    return;
  }
  const url = URL.createObjectURL(photoBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "Kahfi-Ririn-Our-Story.png";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  showStatus("Foto siap disimpan.");
}
function resetPreview() {
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  }

  preview.removeAttribute("src");
  preview.hidden = true;

  camera.style.visibility = "visible";

  photoBlob = null;
  saveButton.disabled = true;

  switchButton.hidden = false;
  retakeButton.hidden = true;

  showStatus("Kamera siap. Ambil foto kembali.");
}

captureButton.addEventListener("click", () => {
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  }
  preview.hidden = true;
  preview.removeAttribute("src");
  camera.style.visibility = "visible";
  photoBlob = null;
  saveButton.disabled = true;
  capturePhoto();
});

switchButton.addEventListener("click", switchCamera);
saveButton.addEventListener("click", savePhoto);
window.addEventListener("pagehide", stopCamera);
retakeButton.addEventListener("click", resetPreview);

// Kamera diminta aktif otomatis saat halaman dibuka.
startCamera();
