import { flames, stages } from "./data/flames.js";
import { Ascension } from "./ascension.js";

export function mount(root, signal) {
  const game = new Ascension();
  const arena = root.querySelector("[data-arena]");
  const list = root.querySelector("[data-flames]");
  const arenaMessage = root.querySelector("[data-arena-message]");
  const fuseButton = root.querySelector("[data-fuse]");
  const replayButton = root.querySelector("[data-replay]");
  const stageNumber = root.querySelector("[data-stage-number]");
  const stageTitle = root.querySelector("#stage-title");
  const energy = root.querySelector("#energy");
  const count = root.querySelector("[data-count]");
  const cultivation = root.querySelector("#cultivation");
  const progressText = root.querySelector("[data-progress-text]");
  const requirement = root.querySelector("[data-requirement]");
  const status = root.querySelector("[data-status]");
  const guide = root.querySelector("[data-guide]");
  const guideCount = guide.querySelector("[data-guide-count]");
  const guideList = guide.querySelector("[data-guide-list]");
  const victory = root.querySelector(".victory");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let fusionTimer;
  const lightTouch = CSS.supports("-webkit-touch-callout", "none") && matchMedia("(pointer: coarse)").matches;
  const observer = typeof IntersectionObserver === "function" ? new IntersectionObserver(([entry]) => arena.classList.toggle("is-offscreen", !entry.isIntersecting)) : null;
  observer?.observe(arena);
  const visibility = () => arena.classList.toggle("is-background", document.hidden);
  document.addEventListener("visibilitychange", visibility, { signal });
  visibility();
  const setText = (el, value) => { if (el.textContent !== value) el.textContent = value; };
  const setAttr = (el, name, value) => { if (el.getAttribute(name) !== value) el.setAttribute(name, value); };

  function createFlameButton(flame) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "flame-button";
    button.dataset.shape = flame.shape;
    button.style.setProperty("--flame", flame.color);
    button.style.setProperty("--flicker-time", `${flame.duration}s`);
    const orb = document.createElement("span");
    orb.className = "flame-orb";
    orb.setAttribute("aria-hidden", "true");
    const aura = document.createElement("span");
    aura.className = "flame-aura";
    orb.append(aura);
    const label = document.createElement("span");
    label.textContent = flame.name;
    button.append(orb, label);
    button.addEventListener("click", () => {
      if (game.collect(flame.id)) {
        render(game.canFuse ? `已收集${flame.name}。本阶段异火齐聚，可以融合。` : `已收集${flame.name}。`);
      }
    }, { signal });
    list.append(button);
    return button;
  }

  function createGuideEntry(flame) {
    const entry = document.createElement("li");
    entry.style.setProperty("--flame", flame.color);
    const name = document.createElement("span");
    name.textContent = flame.original ? `${flame.name}（原创）` : flame.name;
    const flag = document.createElement("small");
    entry.append(name, flag);
    guideList.append(entry);
    return { entry, flag };
  }

  function createSpark(flame, index) {
    const angle = (index / flames.length) * Math.PI * 2;
    const spark = document.createElement("span");
    spark.style.setProperty("--spark-color", flame.color);
    spark.style.setProperty("--x", Math.cos(angle).toFixed(3));
    spark.style.setProperty("--y", Math.sin(angle).toFixed(3));
    spark.style.setProperty("--angle", `${angle}rad`);
    spark.style.setProperty("--delay", `${(index % 5) * 55}ms`);
    return spark;
  }

  const controls = flames.map(flame => ({
    flame,
    button: createFlameButton(flame),
    ...createGuideEntry(flame)
  }));
  victory.querySelector("[data-sparks]").append(...flames.map(createSpark));
  cultivation.max = stages.length;
  energy.max = flames.length;
  guide.hidden = false;

  function render(message) {
    const { stage, step, complete, fusing } = game;
    stageNumber.textContent = complete ? "修炼完成" : `第 ${step + 1} / ${stages.length} 阶段`;
    stageTitle.textContent = stage?.name ?? "炎帝归位";
    count.textContent = `${game.count} / ${flames.length}`;
    energy.value = game.count;
    progressText.textContent = `${step} / ${stages.length}`;
    cultivation.value = step;
    guideCount.textContent = `${stage?.target ?? flames.length} / ${flames.length}`;

    for (const { flame, button, entry, flag } of controls) {
      const captured = game.has(flame.id);
      if (button.hidden !== (flame.step !== step)) button.hidden = flame.step !== step;
      button.classList.toggle("is-captured", captured);
      setAttr(button, "aria-label", `${flame.name}${captured ? "，已收集" : ""}`);
      setAttr(button, "aria-disabled", String(captured || fusing));
      if (entry.hidden !== (flame.step > step)) entry.hidden = flame.step > step;
      setText(flag, flame.step < step ? "已融合" : captured ? "已收集" : "待收集");
    }

    list.hidden = complete || stage?.final === true;
    arenaMessage.hidden = !list.hidden;
    if (!arenaMessage.hidden) {
      arenaMessage.textContent = complete ? "帝炎已觉醒" : "二十二道火种已就位";
    }
    fuseButton.hidden = complete;
    replayButton.hidden = !complete;
    fuseButton.disabled = !game.canFuse;
    fuseButton.textContent = stage?.final ? "融合帝炎" : "融合异火";
    arena.classList.toggle("is-fusing", fusing);
    arena.classList.toggle("is-complete", complete);

    if (complete) {
      requirement.textContent = "普通异火 22 / 22 · 特殊帝炎已解锁";
    } else if (stage.final) {
      requirement.textContent = "融合全部 22 种异火的力量，诞生第 23 种帝炎。";
    } else {
      const nextStage = stages[step + 1];
      const nextRequirement = nextStage.final ? "融合后可进入帝炎觉醒。"
        : `下一阶段需累计收集 ${nextStage.target} 种。`;
      requirement.textContent = `累计收集 ${stage.target} 种后即可融合。${nextRequirement}`;
    }
    status.textContent = message;
  }

  fuseButton.addEventListener("click", () => {
    const stage = game.beginFusion();
    if (!stage) return;
    if (stage.final) {
      game.finishFusion(stage);
      render(stage.result);
      victory.showModal();
      return;
    }
    render("异火正在融合……");
    fusionTimer = setTimeout(() => {
      if (!game.finishFusion(stage)) return;
      render(stage.result);
      if (document.activeElement === document.body) {
        (game.stage.final ? fuseButton : controls.find(({ flame }) => flame.step === game.step).button).focus();
      }
    }, motion.matches ? 0 : lightTouch ? 360 : 760);
  }, { signal });

  replayButton.addEventListener("click", () => victory.showModal(), { signal });
  victory.querySelector("[data-close-victory]").addEventListener("click", () => victory.close(), { signal });
  victory.addEventListener("close", () => {
    if (game.complete) replayButton.focus();
  }, { signal });

  for (const button of root.querySelectorAll("[data-restart]")) {
    button.addEventListener("click", () => {
      clearTimeout(fusionTimer);
      game.reset();
      guide.open = false;
      if (victory.open) victory.close();
      render("修炼已重置。选择一种异火，开启修炼。");
      controls[0].button.focus();
    }, { signal });
  }

  render("选择一种异火，开启修炼。");

  signal.addEventListener("abort", () => {
    observer?.disconnect();
    clearTimeout(fusionTimer);
    if (victory.open) victory.close();
  }, { once: true });
}
