(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Mobile menu ---------- */

  const menuButton = document.querySelector(".dots");
  const menu = document.getElementById("mobile-menu");
  const overlay = document.querySelector(".menu-overlay");

  const setMenu = (open) => {
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.hidden = !open;
    overlay.hidden = !open;
    document.body.classList.toggle("menu-open", open);
  };

  menuButton.addEventListener("click", () => {
    setMenu(menuButton.getAttribute("aria-expanded") !== "true");
  });

  overlay.addEventListener("click", () => setMenu(false));

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("menu-open")) {
      setMenu(false);
      menuButton.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 960 && document.body.classList.contains("menu-open")) {
      setMenu(false);
    }
  });

  /* ---------- Showcase card scroll ---------- */

  // The card rises over the pinned hero during the first RISE_END of the
  // stage's scroll range, then holds until the stage ends and everything
  // scrolls away together.
  const RISE_END = 0.62;
  const stage = document.querySelector(".stage");

  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  if (stage && !reduceMotion) {
    let ticking = false;

    const update = () => {
      ticking = false;
      const range = stage.offsetHeight - window.innerHeight;
      const progress = range > 0 ? Math.min(Math.max(-stage.getBoundingClientRect().top / range, 0), 1) : 0;
      const rise = easeInOut(Math.min(progress / RISE_END, 1));
      stage.style.setProperty("--rise", rise.toFixed(4));
    };

    const requestUpdate = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    update();
  }
})();
