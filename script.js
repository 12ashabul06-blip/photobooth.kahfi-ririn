
/* =====================================
   KAHFI & RIRIN — PHOTOBOOTH
   SCRIPT.JS
   ===================================== */

const camera = document.getElementById("camera");
const startButton = document.getElementById("startCamera");
const captureButton = document.getElementById("capture");
const frame = document.getElementById("frame");
const canvas = document.getElementById("photoCanvas");

let cameraStream = null;
let facingMode = "user";


// SISTEM FOTO DUA TAHAP
let currentStep = 1;
let photoTop = null;
let photoBottom = null;
let finalPhotoURL = null;

// AREA FOTO
const photoArea = document.querySelector(".camera-area");

// TEMPAT FOTO ATAS
const topPhoto = document.createElement("img");
topPhoto.style.cssText = `
  position:absolute;
  left:7%;
  top:10.4%;
  width:86%;
  height:29.8%;
  object-fit:cover;
  display:none;
  z-index:3;
`;

// TEMPAT FOTO BAWAH
const bottomPhoto = document.createElement("img");
bottomPhoto.style.cssText = `
  position:absolute;
  left:7%;
  top:41%;
  width:86%;
  height:32.5%;
  object-fit:cover;
  display:none;
  z-index:3;
`;

// HASIL AKHIR
const finalPreview = document.createElement("img");
finalPreview.style.cssText = `
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
  object-fit:fill;
  display:none;
  z-index:5;
`;

photoArea.append(topPhoto, bottomPhoto, finalPreview);

// TOMBOL ULANGI
const retakeButton = document.createElement("button");
retakeButton.textContent = "ULANGI FOTO";
retakeButton.style.display = "none";

// TOMBOL DOWNLOAD
const downloadButton = document.createElement("button");
downloadButton.textContent = "DOWNLOAD FOTO";
downloadButton.style.display = "none";

document.querySelector(".controls").append(
  retakeButton,
  downloadButton
);

// STATUS
const status = document.createElement("p");
status.style.cssText =
  "text-align:center;font-size:12px;color:#e8d5a5;margin-top:14px;";
document.querySelector(".controls").after(status);

function showStatus(message) {
  status.textContent = message;
}

// SWITCH CAMERA BUTTON
const switchButton = document.createElement("button");
switchButton.textContent = "GANTI KAMERA";
document.querySelector(".controls").prepend(switchButton);

// STOP CAMERA
function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }

  camera.srcObject = null;
}

// START CAMERA
async function startCamera() {
  try {
    stopCamera();

    showStatus("Menghubungkan kamera...");

    cameraStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 1080 },
        height: { ideal: 1920 }
      }
    });

    camera.srcObject = cameraStream;
    await camera.play();

    showStatus("Kamera berhasil diaktifkan.");

    startButton.textContent = "KAMERA AKTIF";

  } catch (error) {
    console.error(error);
    showStatus("Kamera tidak dapat diakses. Periksa izin kamera.");
  }
}

// SWITCH FRONT / BACK CAMERA
async function switchCamera() {
  facingMode = facingMode === "user" ? "environment" : "user";

  if (cameraStream) {
    await startCamera();
  } else {
    showStatus(
      facingMode === "user"
        ? "Kamera depan dipilih."
        : "Kamera belakang dipilih."
    );
  }
}

// CROP VIDEO TO 9:16
function drawCamera(ctx) {
  const targetRatio = 9 / 16;
  const videoRatio = camera.videoWidth / camera.videoHeight;

  let sx = 0;
  let sy = 0;
  let sw = camera.videoWidth;
  let sh = camera.videoHeight;

  if (videoRatio > targetRatio) {
    sw = camera.videoHeight * targetRatio;
    sx = (camera.videoWidth - sw) / 2;
  } else {
    sh = camera.videoWidth / targetRatio;
    sy = (camera.videoHeight - sh) / 2;
  }

  ctx.drawImage(
    camera,
    sx, sy, sw, sh,
    0, 0, canvas.width, canvas.height
  );
}

// TAKE PHOTO
async function capturePhoto() {
  if (!cameraStream || !camera.videoWidth) {
    showStatus("Aktifkan kamera terlebih dahulu.");
    return;
  }

  try {
    canvas.width = 1080;
    canvas.height = 1920;

    const ctx = canvas.getContext("2d");

    drawCamera(ctx);

    // ADD WEDDING FRAME
    if (frame.complete && frame.naturalWidth > 0) {
      ctx.drawImage(frame, 0, 0, 1080, 1920);
    }

    canvas.toBlob(blob => {
      if (!blob) {
        showStatus("Gagal membuat foto.");
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "Kahfi-Ririn-Our-Story.png";
      link.click();

      setTimeout(() => URL.revokeObjectURL(url), 3000);

      showStatus("Foto berhasil disimpan!");
    }, "image/png");

  } catch (error) {
    console.error(error);
    showStatus("Terjadi kesalahan saat mengambil foto.");
  }
}

// BUTTON EVENTS
startButton.addEventListener("click", startCamera);
switchButton.addEventListener("click", switchCamera);
captureButton.addEventListener("click", capturePhoto);

// CLEAN UP
window.addEventListener("pagehide", stopCamera);
