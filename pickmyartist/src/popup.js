// January promo popup. Remove this file and its import after January.
const POPUP_STORAGE_KEY = "pma_jan_bonus_seen";
const SESSION_KEY = "pma_session_id";
const SIGNUP_PATH = "/signup";

const getSessionId = () => {
  const existing = sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const created = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  sessionStorage.setItem(SESSION_KEY, created);
  return created;
};

const shouldShowPopup = () => {
  if (typeof window === "undefined") return false;
  if (window.location.pathname.startsWith(SIGNUP_PATH)) return false;
  const sessionId = getSessionId();
  const lastSeen = localStorage.getItem(POPUP_STORAGE_KEY);
  return lastSeen !== sessionId;
};

const markPopupSeen = () => {
  const sessionId = getSessionId();
  localStorage.setItem(POPUP_STORAGE_KEY, sessionId);
};

const createPopup = () => {
  const overlay = document.createElement("div");
  overlay.className = "pma-popup-overlay";
  overlay.setAttribute("role", "presentation");

  const modal = document.createElement("div");
  modal.className = "pma-popup-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "pma-popup-title");
  modal.tabIndex = -1;

  modal.innerHTML = `
    <h2 class="pma-popup-title" id="pma-popup-title">🎤 Singers & duos — January bonus</h2>
    <p class="pma-popup-body">Create a free profile on PickMyArtist and get discovered by planners and venues.

🎁 January only:
Create a profile + tag us on Instagram and we’ll build you a FREE one-page website.

No cost. No catch. Built for artists.</p>
    <a class="pma-popup-cta" href="/signup">Create free profile</a>
    <button type="button" class="pma-popup-secondary">Maybe later</button>
  `;

  overlay.appendChild(modal);
  return { overlay, modal };
};

const attachPopup = () => {
  if (!shouldShowPopup()) return;
  if (document.querySelector(".pma-popup-overlay")) return;

  const { overlay, modal } = createPopup();

  const closePopup = () => {
    document.body.classList.remove("pma-popup-open");
    overlay.remove();
    document.removeEventListener("keydown", onKeyDown);
    markPopupSeen();
  };

  const onKeyDown = (event) => {
    if (event.key === "Escape") {
      closePopup();
    }
  };

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closePopup();
    }
  });

  modal.querySelector(".pma-popup-secondary")?.addEventListener("click", () => {
    closePopup();
  });

  document.addEventListener("keydown", onKeyDown);
  document.body.classList.add("pma-popup-open");
  document.body.appendChild(overlay);
  modal.focus();
  markPopupSeen();
};

if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    setTimeout(attachPopup, 3000);
  });
}
