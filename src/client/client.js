const API_ENDPOINT = "http://localhost:3000/api/frame";

const fileInput = document.querySelector("#file-input");
const frameNumber = document.querySelector("#file-frame-number");
const submitButton = document.querySelector("#submit");
const thumbnailPreview = document.querySelector("#thumbnail");
const errorDiv = document.querySelector("#error");

function showError(msg) {
  errorDiv.innerText = `ERROR: ${msg}`;
}

async function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.onabort = () => reject(new Error("Read aborted"));
    reader.readAsDataURL(blob);
  });
}

async function createThumbnail(video) {
  const payload = new FormData();
  payload.append("video", video);
  const fValue = frameNumber.value || 1;
  const res = await fetch(`${API_ENDPOINT}?frame=${fValue}`, {
    method: "POST",
    body: payload,
  });

  if (!res.ok) {
    throw new Error("Creating thumbnail failed");
  }

  const thumbnailBlob = await res.blob();
  const thumbnail = await blobToDataURL(thumbnailBlob);

  return thumbnail;
}

submitButton.addEventListener("click", async () => {
  const { files } = fileInput;

  if (files.length > 0) {
    const file = files[0];

    try {
      const thumbnail = await createThumbnail(file);
      thumbnailPreview.src = thumbnail;
    } catch (error) {
      showError(error);
    }
  } else {
    showError("Please select a file");
  }
});

fileInput.addEventListener("change", async () => {
  const { files } = fileInput;
  if (files.length > 0) {
    const file = files[0];
    const duration = await getDuration(file);
    console.log(duration);
  }
});

async function getDuration(file) {
  const video = document.createElement("video");
  
  video.preload = "metadata";
  video.addEventListener("loadedmetadata", () => {
    window.URL.revokeObjectURL(video.src);
    frameNumber.setAttribute('max', video.duration);
    console.log(video.duration);
    video.remove();
    setTimeout(()=> {
    })
  });
  video.src = URL.createObjectURL(file);
  document.body.append(video);
}

// get number of frames from video file