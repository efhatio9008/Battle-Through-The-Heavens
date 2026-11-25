import { questions } from "./data/dialogue.js";
import { createDialogue } from "./dialogue-rules.js";

export function mount(root, signal) {
  const engine = createDialogue();
  const profileForm = root.querySelector("[data-profile]");
  const profileSubmit = profileForm.querySelector("button[type=submit]");
  const summary = root.querySelector("[data-summary]");
  const editButton = root.querySelector("[data-edit]");
  const clearButton = root.querySelector("[data-clear]");
  const topics = root.querySelector("[data-topics]");
  const log = root.querySelector("[data-chat-log]");
  const empty = root.querySelector("[data-chat-empty]");

  const fields = ["name", "age", "career", "education", "goal"].map(key => ({
    key,
    input: root.querySelector(`#profile-${key}`),
    error: root.querySelector(`#error-${key}`),
    output: summary.querySelector(`[data-profile-value="${key}"]`)
  }));

  function showError(input, error, message = "") {
    if (message) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
    error.textContent = message;
    error.hidden = !message;
  }

  function validate({ key, input }, value) {
    if (!value) return "请填写此项。";
    if (key === "age" && (!/^\d{1,3}$/.test(value) || Number(value) < 1 || Number(value) > 120)) {
      return "请输入 1–120 之间的整数。";
    }
    if (key === "goal" && value.length < 2) return "请至少输入 2 个字符。";
    if (value.length > input.maxLength) return `请勿超过 ${input.maxLength} 个字符。`;
    return "";
  }

  function resetChat(message) {
    empty.textContent = message;
    log.replaceChildren(empty);
    clearButton.disabled = true;
  }

  function appendMessage(speaker, text) {
    const line = document.createElement("div");
    line.className = speaker === "你" ? "chat-message is-visitor" : "chat-message";
    const label = document.createElement("span");
    label.className = "chat-speaker";
    label.textContent = speaker;
    const bubble = document.createElement("p");
    bubble.className = "chat-bubble";
    bubble.textContent = text;
    line.append(label, bubble);
    log.append(line);
  }

  const topicButtons = questions.map(({ id, label }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "button button-quiet chat-topic";
    button.textContent = label;
    button.addEventListener("click", () => {
      if (topics.hidden) return;
      const reply = engine.reply(id);
      if (!reply) return;
      empty.remove();
      appendMessage("你", label);
      appendMessage("萧炎", reply);
      log.scrollTop = log.scrollHeight;
      clearButton.disabled = false;
    }, { signal });
    topics.append(button);
    return button;
  });

  for (const { input, error } of fields) {
    input.addEventListener("input", () => showError(input, error), { signal });
  }

  profileForm.addEventListener("submit", event => {
    event.preventDefault();
    const profile = {};
    let invalid;
    for (const field of fields) {
      const { key, input, error } = field;
      const trimmed = input.value.trim();
      const value = key === "age" ? trimmed.normalize("NFKC") : trimmed;
      const message = validate(field, value);
      showError(input, error, message);
      if (message) invalid ??= input;
      profile[key] = value;
    }
    if (invalid) {
      invalid.focus();
      return;
    }
    for (const { key, output } of fields) output.textContent = profile[key];
    profileForm.hidden = true;
    summary.hidden = false;
    topics.hidden = false;
    resetChat("选择一个问题，查看萧炎的回复。");
    topicButtons[0].focus();
  }, { signal });

  editButton.addEventListener("click", () => {
    engine.reset();
    topics.hidden = true;
    resetChat("填写个人资料后，即可开始对白。");
    for (const { output } of fields) output.textContent = "";
    summary.hidden = true;
    profileForm.hidden = false;
    fields[0].input.focus();
  }, { signal });

  clearButton.addEventListener("click", () => {
    topicButtons[0].focus();
    resetChat("对话已清除。可以继续选择问题。");
  }, { signal });

  profileSubmit.disabled = false;
}
