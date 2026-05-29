/* === MARCO PATCH v0.6.0 PARCOURS V2 DATA RENDERER === */
(() => {
  const DEFAULT_DATA = {
    studies: [
      {
        icon: "01",
        title: "Conservatoire",
        detail: "Violon classique · Formation musicale · Interprétation",
        period: "2008 – 2014"
      },
      {
        icon: "02",
        title: "Training Acting",
        detail: "Jeu caméra · Improvisation · Méthode Stanislavski",
        period: "2015 – 2016"
      },
      {
        icon: "03",
        title: "Développement Artistique",
        detail: "Composition · MAO · Direction artistique · Écriture",
        period: "2016 – 2018"
      }
    ],
    timeline: [
      {
        icon: "▯",
        title: "Apprendre",
        subtitle: "Fonder les bases",
        period: "2008 – 2014",
        type: "formation"
      },
      {
        icon: "◇",
        title: "Explorer",
        subtitle: "Expérimenter · se développer",
        period: "2015 – 2018",
        type: "formation"
      },
      {
        icon: "✦",
        title: "Créer",
        subtitle: "Partager · transmettre",
        period: "2019 – Aujourd’hui",
        type: "experience"
      }
    ],
    experiences: [
      {
        icon: "♪",
        title: "Musique",
        detail: "Interprète · Compositeur · Arrangements"
      },
      {
        icon: "▧",
        title: "Modèle",
        detail: "Campagnes · Éditorial · Image de marque"
      },
      {
        icon: "▤",
        title: "Jeu / Cinéma",
        detail: "Court-métrages · Rôles · Figuration · Casting"
      },
      {
        icon: "✦",
        title: "Scène / Projets",
        detail: "Concerts · Performances · Projets artistiques"
      }
    ],
    skills: [
      "Discipline",
      "Polyvalence",
      "Présence",
      "Création",
      "Rigueur",
      "Curiosité"
    ]
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getData() {
    return window.MARCO_PARCOURS_V2_DATA || DEFAULT_DATA;
  }

  function renderStudies(data) {
    const target = document.querySelector("[data-parcours-v2-studies]");
    if (!target) return;

    target.innerHTML = (data.studies || []).map((item) => `
      <article class="parcours-v2-study-card">
        <span class="parcours-v2-card-icon" aria-hidden="true">${escapeHtml(item.icon || "•")}</span>
        <div class="parcours-v2-card-main">
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.detail)}</p>
          <small>${escapeHtml(item.period)}</small>
        </div>
      </article>
    `).join("");
  }

  function renderExperiences(data) {
    const target = document.querySelector("[data-parcours-v2-experiences]");
    if (!target) return;

    target.innerHTML = (data.experiences || []).map((item) => `
      <article class="parcours-v2-experience-card">
        <span class="parcours-v2-card-icon" aria-hidden="true">${escapeHtml(item.icon || "•")}</span>
        <div class="parcours-v2-card-main">
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.detail)}</p>
        </div>
      </article>
    `).join("");
  }

  function renderTimeline(data) {
    const target = document.querySelector("[data-parcours-v2-timeline]");
    const items = data.timeline || [];
    if (!target || !items.length) return;

    target.style.setProperty("--point-count", String(items.length));
    target.innerHTML = `
      <div class="parcours-v2-timeline-list">
        ${items.map((item, index) => `
          <article class="parcours-v2-timeline-point" data-index="${index}" data-type="${escapeHtml(item.type || "parcours")}">
            <span class="parcours-v2-timeline-icon" aria-hidden="true">${escapeHtml(item.icon || "•")}</span>
            <small>${escapeHtml(item.period)}</small>
            <strong>${escapeHtml(item.title)}</strong>
            <p>${escapeHtml(item.subtitle)}</p>
          </article>
        `).join("")}
      </div>
    `;
  }

  function renderSkills(data) {
    const target = document.querySelector("[data-parcours-v2-skills]");
    if (!target) return;

    target.innerHTML = (data.skills || []).map((skill) => `
      <span class="parcours-v2-skill">${escapeHtml(skill)}</span>
    `).join("");
  }

  function syncMiniPlayerLabel() {
    const page = document.querySelector(".parcours-v2-page");
    const label = document.querySelector(".track-label");
    if (!page || !label) return;
    label.innerHTML = "<b>03</b><b>PARCOURS V2</b><b>CARNET ARTISTIQUE</b>";
  }

  function initParcoursV2Page() {
    const page = document.querySelector(".parcours-v2-page");
    if (!page || page.dataset.parcoursV2Ready === "true") return;

    const data = getData();
    renderStudies(data);
    renderExperiences(data);
    renderTimeline(data);
    renderSkills(data);
    syncMiniPlayerLabel();
    page.dataset.parcoursV2Ready = "true";
  }

  const observer = new MutationObserver(() => window.requestAnimationFrame(initParcoursV2Page));

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initParcoursV2Page();
      const app = document.querySelector("#app");
      if (app) observer.observe(app, { childList: true, subtree: true });
    });
  } else {
    initParcoursV2Page();
    const app = document.querySelector("#app");
    if (app) observer.observe(app, { childList: true, subtree: true });
  }
})();
