const form = document.querySelector("#ticket-form");
const message = document.querySelector("#message");
const table = document.querySelector("#ticket-table");
const tableBody = table.querySelector("tbody");
const emptyState = document.querySelector("#empty-state");
const refreshButton = document.querySelector("#refresh-button");
const imageInput = document.querySelector("#image-input");
const imageDropzone = document.querySelector("#image-dropzone");
const imagePreviews = document.querySelector("#image-previews");
const imageError = document.querySelector("#image-error");
const submitButton = document.querySelector("#submit-button");
const maxImageSize = 10 * 1024 * 1024;
const maxImageCount = 3;
let selectedImages = [];

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}

function addCell(row, value) {
  const cell = document.createElement("td");
  cell.textContent = value;
  row.appendChild(cell);
}

function createImageGallery(images) {
  const cell = document.createElement("td");
  const gallery = document.createElement("div");
  gallery.className = "image-gallery";
  gallery.dataset.imageGallery = "";

  for (const image of images) {
    const button = document.createElement("button");
    button.className = "image-thumb";
    button.type = "button";
    button.setAttribute("aria-label", `檢視圖片：${image.name}`);

    const thumbnail = document.createElement("img");
    thumbnail.src = image.url;
    thumbnail.alt = image.name;
    button.appendChild(thumbnail);
    gallery.appendChild(button);
  }

  if (images.length === 0) {
    cell.textContent = "無圖片";
  } else {
    cell.appendChild(gallery);
  }
  return cell;
}

function renderPreviews() {
  imagePreviews.replaceChildren();
  selectedImages.forEach((file, index) => {
    const preview = document.createElement("div");
    preview.className = "preview-item";

    const image = document.createElement("img");
    image.src = URL.createObjectURL(file);
    image.alt = file.name;
    image.onload = () => URL.revokeObjectURL(image.src);
    preview.appendChild(image);

    const name = document.createElement("span");
    name.textContent = file.name;
    preview.appendChild(name);

    const removeButton = document.createElement("button");
    removeButton.className = "remove-image";
    removeButton.type = "button";
    removeButton.textContent = "刪除";
    removeButton.setAttribute("aria-label", `刪除圖片：${file.name}`);
    removeButton.addEventListener("click", () => {
      selectedImages.splice(index, 1);
      imageError.textContent = "";
      renderPreviews();
    });
    preview.appendChild(removeButton);
    imagePreviews.appendChild(preview);
  });
}

function addSelectedImages(files) {
  const incoming = Array.from(files);
  if (selectedImages.length + incoming.length > maxImageCount) {
    imageError.textContent = `最多只能上傳 ${maxImageCount} 張圖片`;
    return;
  }

  const invalidFile = incoming.find((file) => {
    const extension = file.name.split(".").pop().toLowerCase();
    const extensionAllowed = ["jpg", "jpeg", "png"].includes(extension);
    const mimeAllowed = ["image/jpeg", "image/png"].includes(file.type);
    return !extensionAllowed || !mimeAllowed || file.size > maxImageSize;
  });
  if (invalidFile) {
    imageError.textContent =
      invalidFile.size > maxImageSize
        ? `${invalidFile.name} 超過 10MB`
        : `${invalidFile.name} 格式不符，僅接受 JPG 或 PNG`;
    return;
  }

  selectedImages.push(...incoming);
  imageError.textContent = "";
  renderPreviews();
}

function renderTickets(tickets) {
  tableBody.replaceChildren();
  emptyState.hidden = tickets.length > 0;
  table.hidden = tickets.length === 0;

  for (const ticket of tickets) {
    const row = document.createElement("tr");
    addCell(row, ticket.id);
    addCell(row, ticket.location);
    addCell(row, ticket.equipment);
    addCell(row, ticket.urgency);
    addCell(row, ticket.contact);
    addCell(row, ticket.status);
    addCell(row, ticket.description);
    addCell(row, ticket.created_at);
    row.appendChild(createImageGallery(ticket.images || []));
    tableBody.appendChild(row);
  }
}

async function loadTickets() {
  try {
    const response = await fetch("/api/tickets");
    if (!response.ok) throw new Error("無法讀取案件清單");
    renderTickets(await response.json());
  } catch (error) {
    showMessage(error.message, true);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showMessage("正在建立報修單…");
  submitButton.disabled = true;

  const formData = new FormData(form);
  for (const image of selectedImages) {
    formData.append("images", image);
  }

  try {
    const response = await fetch("/api/tickets", {
      method: "POST",
      body: formData,
    });
    const result = await response.json();

    if (!response.ok) throw new Error(result.message || "建立報修單失敗");

    showMessage(result.message);
    form.reset();
    selectedImages = [];
    imageError.textContent = "";
    renderPreviews();
    await loadTickets();
  } catch (error) {
    showMessage(error.message, true);
  } finally {
    submitButton.disabled = false;
  }
});

imageInput.addEventListener("change", () => {
  addSelectedImages(imageInput.files);
  imageInput.value = "";
});

for (const eventName of ["dragenter", "dragover"]) {
  imageDropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    imageDropzone.classList.add("dragging");
  });
}

for (const eventName of ["dragleave", "drop"]) {
  imageDropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    imageDropzone.classList.remove("dragging");
  });
}

imageDropzone.addEventListener("drop", (event) => {
  addSelectedImages(event.dataTransfer.files);
});

refreshButton.addEventListener("click", loadTickets);
loadTickets();
