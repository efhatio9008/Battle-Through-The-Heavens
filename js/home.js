import { slides } from "./data/media.js";
import { mediaImage } from "./media-image.js";

export function mount(root, signal) {
  const hero = root.querySelector(".hero");
  const media = hero.querySelector("[data-slides]");
  const controls = hero.querySelector(".hero-controls");
  const paging = hero.querySelector("[data-paging]");
  const toggle = hero.querySelector("[data-toggle]");
  const status = hero.querySelector("[data-slide-status]");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const interval = 4600;

  let current = 0;
  let paused = reducedMotion.matches;
  let hovering = false;
  let focused = false;
  let timer;
  let touchStart;

  const images = slides.map((item, index) => {
    if (index === 0) {
      const first = media.querySelector("img");
      first.style.objectPosition = item.position;
      return first;
    }
    const image = mediaImage(item, "hero-slide");
    image.setAttribute("aria-hidden", "true");
    image.fetchPriority = "low";
    media.append(image);
    return image;
  });

  const indicators = slides.map((slide, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "slide-dot";
    button.setAttribute("aria-label", `第 ${index + 1} 张：${slide.alt}`);
    button.addEventListener("click", () => show(index, true));
    paging.append(button);
    return button;
  });

  function schedule() {
    clearTimeout(timer);
    if (!signal.aborted && !paused && !hovering && !focused && !document.hidden) {
      timer = setTimeout(() => show(current + 1), interval);
    }
  }

  function show(index, announce = false) {
    current = (index + images.length) % images.length;
    images.forEach((image, position) => {
      const selected = position === current;
      image.classList.toggle("is-current", selected);
      if (selected) image.removeAttribute("aria-hidden");
      else image.setAttribute("aria-hidden", "true");
      if (selected) indicators[position].setAttribute("aria-current", "true");
      else indicators[position].removeAttribute("aria-current");
    });
    if (announce) status.textContent = `第 ${current + 1} 张，共 ${images.length} 张。 ${slides[current].alt}`;
    schedule();
  }

  function updateToggle() {
    toggle.classList.toggle("is-paused", paused);
    toggle.setAttribute("aria-label", paused ? "播放轮播" : "暂停轮播");
    schedule();
  }

  hero.querySelector("[data-prev]").addEventListener("click", () => show(current - 1, true));
  hero.querySelector("[data-next]").addEventListener("click", () => show(current + 1, true));
  toggle.addEventListener("click", () => {
    paused = !paused;
    if (!paused) {
      focused = false;
      hovering = false;
    }
    updateToggle();
  });
  hero.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") hovering = true;
    schedule();
  });
  hero.addEventListener("pointerleave", () => {
    hovering = false;
    schedule();
  });
  hero.addEventListener("focusin", () => {
    focused = hero.matches(":has(:focus-visible)");
    schedule();
  });
  hero.addEventListener("focusout", (event) => {
    if (!hero.contains(event.relatedTarget)) {
      focused = false;
      schedule();
    }
  });
  hero.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    show(current + (event.key === "ArrowLeft" ? -1 : 1), true);
  });

  hero.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch" && event.isPrimary && !event.target.closest("a, button")) {
      touchStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
    }
  });
  hero.addEventListener("pointerup", (event) => {
    if (touchStart?.id !== event.pointerId) return;
    const dx = event.clientX - touchStart.x;
    const dy = event.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      show(current + (dx < 0 ? 1 : -1), true);
    }
  });
  hero.addEventListener("pointercancel", () => { touchStart = null; });
  document.addEventListener("visibilitychange", schedule, { signal });
  reducedMotion.addEventListener("change", (event) => {
    paused = event.matches;
    updateToggle();
  }, { signal });

  controls.hidden = false;
  show(0);
  updateToggle();

  signal.addEventListener("abort", () => clearTimeout(timer), { once: true });
}
