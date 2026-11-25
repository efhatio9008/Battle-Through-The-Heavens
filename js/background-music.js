const audio = new Audio();
audio.preload = "metadata"; // Prepare metadata early; iOS may still require a tap.
audio.loop = true;
audio.src = new URL("../music/1.mp3", import.meta.url).href;

// Keep the same background-music player alive across the site's page transitions.
// Video playback only pauses it; resuming never resets the song's position.
let pausedForVideo = false;
let interactionListeners = null;

const navigationKeys = new Set([
  "Enter", "Tab", "Backspace", "Delete", "Home", "End", "PageUp", "PageDown",
  "ArrowUp", "ArrowDown", "Left", "Right", "ArrowLeft", "ArrowRight"
]);

function waitForFirstInteraction() {
  if (interactionListeners) return;
  const listeners = new AbortController();
  interactionListeners = listeners;

  function playFromInteraction(event) {
    if (!event.isTrusted || pausedForVideo) return;
    if (event.type === "keydown") {
      if (event.repeat || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key.length !== 1 && !navigationKeys.has(event.key)) return;
      if (navigator.userActivation?.isActive === false) return;
    }

    // A single gesture may emit both touchend and click.
    listeners.abort();
    interactionListeners = null;
    startBackgroundMusic();
  }

  const options = { capture: true, passive: true, signal: listeners.signal };
  for (const type of ["click", "touchend", "keydown"]) {
    document.addEventListener(type, playFromInteraction, options);
  }
}

function startBackgroundMusic() {
  if (pausedForVideo || !audio.paused) return;
  audio.play().catch(error => {
    if (error.name === "NotAllowedError" && !pausedForVideo) waitForFirstInteraction();
  });
}

export function pauseBackgroundMusicForVideo() {
  pausedForVideo = true;
  audio.pause();
}

export function resumeBackgroundMusicAfterVideo() {
  if (!pausedForVideo) return;
  pausedForVideo = false;
  startBackgroundMusic();
}

startBackgroundMusic();
