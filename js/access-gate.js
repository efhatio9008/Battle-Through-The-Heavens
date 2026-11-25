// Client-side anniversary entrance gate. This is a visual/access prompt,
// not server-enforced access control: public static files remain accessible.
// Only a SHA-256 digest is stored here; the passphrase is never embedded.
const EXPECTED_SHA256 = "bb544e7bf39eada5b6205407d88e04ac36cf8be13f8943634a8b9fea165cbeb5";

function normalizeKey(value) {
  const characters = value.trim().toUpperCase().replace(/[\s-]/g, "");
  if (!/^[A-Z]{3}[0-9]{5}$/.test(characters)) return null;
  return `${characters.slice(0, 3)}-${characters.slice(3)}`;
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

export function requireAccess() {
  // No persistent login: a fresh browser load asks for the key again.
  return new Promise(resolve => {
    const gate = document.createElement("section");
    gate.id = "access-gate";
    gate.className = "access-gate";
    gate.setAttribute("role", "dialog");
    gate.setAttribute("aria-modal", "true");
    gate.setAttribute("aria-labelledby", "access-title");
    gate.setAttribute("aria-describedby", "access-description");
    gate.innerHTML = `
      <div class="access-gate__frame">
        <div class="access-gate__art" aria-hidden="true">
          <div class="access-gate__seal">炎</div>
          <p class="access-gate__art-eyebrow">NINE YEARS OF FLAMES</p>
          <p class="access-gate__art-title">九年之约<br>焰火不息</p>
          <p class="access-gate__art-years">2017 <span>—</span> 2026</p>
        </div>
        <div class="access-gate__panel">
          <div class="access-gate__edition"><span>✦</span> 09 / ANNIVERSARY <span>✦</span></div>
          <p class="access-gate__kicker">斗破苍穹 · 九年炎帝盛典</p>
          <h1 id="access-title">炎帝秘钥</h1>
          <p class="access-gate__description" id="access-description">以一枚秘钥，开启属于我们的九年之约。</p>
          <form class="access-gate__form" novalidate>
            <div class="access-gate__label-row">
              <label for="access-key">请输入通行秘钥</label>
              <span>3 个字母 · 5 个数字</span>
            </div>
            <div class="access-gate__input-wrap">
              <input id="access-key" type="password" placeholder="AAA-00000" maxlength="16" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-describedby="access-format access-error" required>
              <button class="access-gate__reveal" type="button" aria-label="显示秘钥" aria-pressed="false">显示</button>
            </div>
            <p class="access-gate__hint" id="access-format">格式：3 个英文字母 - 5 个数字</p>
            <p class="access-gate__error" id="access-error" role="alert" hidden></p>
            <button class="access-gate__submit" type="submit"><span>开启九年之约</span><span aria-hidden="true">✦</span></button>
          </form>
          <div class="access-gate__foot"><span></span> THE FLAME NEVER FADES <span></span></div>
        </div>
      </div>
    `;
    document.body.append(gate);

    const form = gate.querySelector("form");
    const input = gate.querySelector("#access-key");
    const error = gate.querySelector("#access-error");
    const button = gate.querySelector(".access-gate__submit");
    const reveal = gate.querySelector(".access-gate__reveal");

    function showError(message) {
      error.textContent = message;
      error.hidden = false;
      input.setAttribute("aria-invalid", "true");
      gate.classList.remove("access-gate--shake");
      void gate.offsetWidth;
      gate.classList.add("access-gate--shake");
    }

    reveal.addEventListener("click", () => {
      const visible = input.type === "password";
      input.type = visible ? "text" : "password";
      reveal.textContent = visible ? "隐藏" : "显示";
      reveal.setAttribute("aria-label", visible ? "隐藏秘钥" : "显示秘钥");
      reveal.setAttribute("aria-pressed", String(visible));
      input.focus();
    });

    input.addEventListener("input", () => {
      error.hidden = true;
      input.removeAttribute("aria-invalid");
      gate.classList.remove("access-gate--shake");
    });

    form.addEventListener("submit", async event => {
      event.preventDefault();
      if (button.disabled) return;
      const normalized = normalizeKey(input.value);
      if (!normalized) {
        showError("格式不正确：请输入 3 个字母和 5 个数字。");
        input.focus();
        return;
      }
      button.disabled = true;
      try {
        const actual = await sha256(normalized);
        if (actual !== EXPECTED_SHA256) {
          showError("秘钥不正确，请重新输入。");
          input.select();
          return;
        }
        document.documentElement.classList.add("access-granted");
        gate.remove();
        resolve();
      } catch {
        showError("无法验证秘钥，请使用 HTTPS 或更新浏览器后重试。");
      } finally {
        button.disabled = false;
      }
    });

    input.focus({ preventScroll: true });
  });
}
