(() => {
  "use strict";

  /* Paste the Google Apps Script web app URL here (see waitlist/apps-script.gs). */
  const WAITLIST_URL = "";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wide = window.matchMedia("(min-width: 900px)");

  /* ---------- The film: 16:9 on wide screens, 9:16 on phones ---------- */

  const film = document.getElementById("film");
  const tasks = [...document.querySelectorAll(".task")];
  const SCENE_LENGTH = 3.5;

  const pickSource = () => {
    const format = wide.matches ? "16x9" : "9x16";
    if (film.dataset.format === format) return;
    film.dataset.format = format;
    film.poster = `media/myynd-${format}.jpg`;
    film.src = `media/myynd-${format}.mp4`;
    if (!reduceMotion) film.play().catch(() => {});
  };

  if (reduceMotion) film.controls = true;
  pickSource();
  wide.addEventListener("change", pickSource);

  // Each example underlines while its scene plays, and jumps there when chosen.
  film.addEventListener("timeupdate", () => {
    const t = film.currentTime;
    tasks.forEach((task) => {
      const at = Number(task.dataset.at);
      task.classList.toggle("is-active", t >= at && t < at + SCENE_LENGTH);
    });
  });

  tasks.forEach((task) =>
    task.addEventListener("click", (e) => {
      e.preventDefault();
      film.currentTime = Number(task.dataset.at);
      film.play().catch(() => {});
      if (!wide.matches) film.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    })
  );

  // Save the battery when the film is scrolled away.
  if (!reduceMotion) {
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) film.play().catch(() => {});
      else film.pause();
    }).observe(film);
  }

  /* ---------- Waitlist ---------- */

  const dialog = document.querySelector(".wl");
  const form = dialog.querySelector(".wl-form");
  const input = dialog.querySelector("#wl-email");
  const go = dialog.querySelector(".wl-go");
  const msg = dialog.querySelector(".wl-msg");
  const formView = dialog.querySelector(".wl-form-view");
  const doneView = dialog.querySelector(".wl-done-view");
  const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  document.querySelectorAll("[data-open-waitlist]").forEach((button) =>
    button.addEventListener("click", () => {
      dialog.showModal();
      if (!dialog.classList.contains("is-joined")) input.focus();
    })
  );

  const close = () => dialog.close();
  dialog.querySelector(".wl-close").addEventListener("click", close);
  dialog.querySelector(".wl-ok").addEventListener("click", close);

  // A click on the dimmed page around the card closes it.
  dialog.addEventListener("click", (e) => {
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) close();
  });

  // While someone types, he holds the giggle in.
  let typingTimer;
  input.addEventListener("input", () => {
    msg.textContent = "";
    dialog.classList.add("is-typing");
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => dialog.classList.remove("is-typing"), 900);
  });

  const send = async (email) => {
    if (!WAITLIST_URL) {
      console.warn("Myynd waitlist: WAITLIST_URL is not set, so this sign-up was not saved.");
      return;
    }
    // Apps Script answers without CORS headers, so the reply is opaque; a network failure still throws.
    await fetch(WAITLIST_URL, {
      method: "POST",
      mode: "no-cors",
      body: new URLSearchParams({ email, source: location.href }),
    });
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = input.value.trim();
    if (!EMAIL.test(email)) {
      msg.textContent = "That email doesn’t look right.";
      input.focus();
      return;
    }

    go.disabled = true;
    go.textContent = "Joining…";
    try {
      await send(email);
      dialog.classList.remove("is-typing");
      dialog.classList.add("is-joined");
      dialog.querySelector(".wl-who").textContent = email;
      formView.hidden = true;
      doneView.hidden = false;
      dialog.querySelector(".wl-ok").focus();
    } catch {
      msg.textContent = "Couldn’t reach the list. Try again in a moment.";
    } finally {
      go.disabled = false;
      go.textContent = "Join";
    }
  });
})();
