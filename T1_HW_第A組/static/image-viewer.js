const imageDialog = document.querySelector("#image-dialog");
const dialogImage = document.querySelector("#dialog-image");
const rotateImageButton = document.querySelector("#rotate-image");
const closeImageDialogButton = document.querySelector("#close-image-dialog");
let imageRotation = 0;

document.addEventListener("click", (event) => {
  const thumbnailButton = event.target.closest(
    "[data-image-gallery] .image-thumb",
  );
  if (!thumbnailButton) return;

  const thumbnail = thumbnailButton.querySelector("img");
  dialogImage.src = thumbnail.src;
  dialogImage.alt = thumbnail.alt;
  imageRotation = 0;
  dialogImage.style.transform = "rotate(0deg)";
  imageDialog.showModal();
});

rotateImageButton.addEventListener("click", () => {
  imageRotation = (imageRotation + 90) % 360;
  dialogImage.style.transform = `rotate(${imageRotation}deg)`;
});

closeImageDialogButton.addEventListener("click", () => imageDialog.close());
