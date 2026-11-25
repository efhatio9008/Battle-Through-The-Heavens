import { requireAccess } from "./access-gate.js";

// Do not mount the site or start background music until the key is verified.
await requireAccess();
await import("./background-music.js");
const [
  { mount: mountHome },
  { mount: mountGame },
  { mount: mountJourney },
  { mount: mountVideo },
  { mount: mountDialogue }
] = await Promise.all([
  import("./home.js"),
  import("./game.js"),
  import("./journey.js"),
  import("./video.js"),
  import("./dialogue.js")
]);

const site = new URL("../", import.meta.url);
const routes = new Map();
const styles = new Map();

for (const [name, path, mount, sheets] of [
  ["home", "index.html", mountHome, ["home"]],
  ["game", "pages/game.html", mountGame, ["game", "victory"]],
  ["journey", "pages/journey.html", mountJourney, ["journey"]],
  ["video", "pages/video.html", mountVideo, ["video"]],
  ["dialogue", "pages/dialogue.html", mountDialogue, ["dialogue"]],
  ["character", "pages/character.html", (root, signal) => {
    import("./character.js").then(({ mount }) => { if (!signal.aborted) mount(root, signal); }).catch(() => { if (!signal.aborted) root.querySelector("[data-load-message]").textContent = "无法启动 3D 展示，请刷新重试。"; });
  }, ["character"]]
]) {
  const url = new URL(path, site);
  routes.set(url.pathname, {
    name, url, mount,
    styles: sheets.map(sheet => new URL(`css/${sheet}.css`, site).href)
  });
}
routes.set(site.pathname, routes.get(new URL("index.html", site).pathname));

function routeFor(url) {
  return url.origin === site.origin ? routes.get(url.pathname) : undefined;
}

for (const link of document.querySelectorAll('link[rel="stylesheet"]')) {
  // The shell outlives its initial URL, including when it starts on a subpage.
  const href = link.href;
  link.setAttribute("href", href);
  if (link.hasAttribute("data-page-style")) styles.set(href, Promise.resolve(link));
}

function loadStyle(href) {
  if (!styles.has(href)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    // Keep the previous view styled until the new view is ready to display.
    link.media = "not all";
    const ready = new Promise((resolve, reject) => {
      link.onload = () => resolve(link);
      link.onerror = () => {
        styles.delete(href);
        link.remove();
        reject(new Error(`Style unavailable: ${href}`));
      };
    });
    styles.set(href, ready);
    document.head.append(link);
  }
  return styles.get(href);
}

function resolveAssets(root, url) {
  for (const element of root.querySelectorAll("[href], [src], [poster]")) {
    for (const attribute of ["href", "src", "poster"]) {
      const value = element.getAttribute(attribute);
      if (value && !value.startsWith("#")) {
        element.setAttribute(attribute, new URL(value, url).href);
      }
    }
  }
}

async function loadPage(route, signal) {
  const response = await fetch(route.url, { signal });
  if (!response.ok) throw new Error(`Page unavailable: ${response.status}`);
  const html = await response.text();
  // Parse only our own static pages. The base also covers resource loads during parsing.
  const markup = html.replace("<head>", `<head><base href="${route.url.href}">`);
  const page = new DOMParser().parseFromString(markup, "text/html");
  const view = page.querySelector("main#main");
  if (!view || !page.title) throw new Error("Invalid page markup");
  resolveAssets(view, route.url);
  return { view, title: page.title };
}

let view = document.querySelector("main#main");
let active = routeFor(new URL(location.href));
let lifecycle = new AbortController();
let pending;
let activeStyles = [...document.querySelectorAll("link[data-page-style]")];

const header = document.querySelector(".site-header");
const navLinks = [...header.querySelectorAll(".main-nav a")];
resolveAssets(header, new URL(location.href));

const notice = document.createElement("p");
notice.className = "shell";
notice.setAttribute("role", "status");
notice.hidden = true;
header.after(notice);

function focusView(url) {
  const target = document.getElementById(url.hash.slice(1)) ?? view;
  if (!target.hasAttribute("tabindex")) target.tabIndex = -1;
  target.focus({ preventScroll: true });
  if (url.hash) target.scrollIntoView();
  else window.scrollTo(0, 0);
}

async function navigate(url, push) {
  const route = routeFor(url);
  pending?.abort();
  pending = undefined;
  notice.hidden = true;

  if (route === active) {
    if (push && url.href !== location.href) history.pushState(null, "", url);
    if (!push) focusView(url);
    return;
  }

  const request = new AbortController();
  pending = request;
  try {
    const [next, nextStyles] = await Promise.all([
      loadPage(route, request.signal),
      Promise.all(route.styles.map(loadStyle))
    ]);
    if (request.signal.aborted) return;

    if (push) history.pushState(null, "", url);
    lifecycle.abort();
    lifecycle = new AbortController();
    activeStyles.forEach(link => { link.media = "not all"; });
    nextStyles.forEach(link => { link.media = "all"; });
    activeStyles = nextStyles;
    document.body.classList.replace(`page-${active.name}`, `page-${route.name}`);
    document.title = next.title;
    for (const link of navLinks) {
      if (routeFor(new URL(link.href)) === route) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
    view.replaceWith(next.view);
    view = next.view;
    active = route;
    route.mount(view, lifecycle.signal);
    focusView(url);
  } catch {
    if (request.signal.aborted) return;
    notice.hidden = false;
    notice.textContent = "暂时无法载入目标页面。请通过导航重试。";
  } finally {
    if (pending === request) pending = undefined;
  }
}

active.mount(view, lifecycle.signal);
history.scrollRestoration = "manual";

document.addEventListener("click", event => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest?.("a[href]");
  if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
  if (link.getAttribute("href").startsWith("#")) return;
  const url = new URL(link.href);
  if (!routeFor(url)) return;
  event.preventDefault();
  void navigate(url, true);
});

window.addEventListener("popstate", () => {
  const url = new URL(location.href);
  if (routeFor(url)) void navigate(url, false);
});
