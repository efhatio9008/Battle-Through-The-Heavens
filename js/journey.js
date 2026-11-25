import { journey } from "./data/media.js";
import { mediaImage } from "./media-image.js";

export function mount(root) {
  const list = root.querySelector("[data-journey]");
  for (const { title, stage, art, text } of journey) {
    const card = document.createElement("li");
    card.className = "journey-card";
    const artwork = document.createElement("div");
    artwork.className = "journey-art";
    const image = mediaImage(art);
    image.loading = "lazy";
    artwork.append(image);
    const copy = document.createElement("div");
    copy.className = "journey-copy";
    const milestone = document.createElement("p");
    milestone.className = "mini-label";
    milestone.textContent = stage;
    const heading = document.createElement("h2");
    heading.textContent = title;
    const summary = document.createElement("p");
    summary.className = "journey-summary";
    summary.textContent = text;
    copy.append(milestone, heading, summary);
    card.append(artwork, copy);
    list.append(card);
  }
}
