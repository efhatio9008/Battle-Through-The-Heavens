export function mediaImage({ src, width, height, alt, position }, className = "") {
  const img = document.createElement("img");
  img.className = className;
  img.width = width;
  img.height = height;
  img.alt = alt;
  img.style.objectPosition = position;
  img.decoding = "async";
  img.src = src;
  return img;
}
