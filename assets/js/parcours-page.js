/* === MARCO PATCH v0.5.6 PARCOURS DATA RENDERER === */
(() => {
  const DEFAULT_DATA = {
    studies: [
      {
        icon: "⌂",
        title: "Conservatoire",
        detail: "Violon classique · Formation musicale · Interprétation",
        period: "2008 – 2014"
      },
      {
        icon: "▣",
        title: "Training acting",
        detail: "Jeu caméra · Improvisation · Méthode Stanislavski",
        period: "2015 – 2016"
      },
      {
        icon: "◌",
        title: "Développement artistique",
        detail: "Composition · MAO · Direction artistique · Écriture",
        period: "2016 – 2018"
      }
    ],
    timeline: [
      {
        title: "Apprendre",
        subtitle: "Fonder les bases",
        period: "2008 – 2014",
        type: "formation"
      },
      {
        title: "Explorer",
        subtitle: "Expérimenter · se développer",
        period: "2015 – 2018",
        type: "formation"
      },
      {
        title: "Créer",
        subtitle: "Partager et transmettre",
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
      "Sens du détail",
      "Adaptabilité",
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
    return window.MARCO_PARCOURS_DATA || DEFAULT_DATA;
  }

  function renderStudies(data) {
    const target = document.querySelector("[data-parcours-studies]");
    if (!target) return;

    target.innerHTML = (data.studies || []).map((item) => `
      <article class="parcours-study-card" data-parcours-type="study">
        <span class="parcours-card-icon" aria-hidden="true">${escapeHtml(item.icon || "•")}</span>
        <div class="parcours-card-main">
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.detail)}</p>
          <small>${escapeHtml(item.period)}</small>
        </div>
      </article>
    `).join("");
  }

  function renderExperiences(data) {
    const target = document.querySelector("[data-parcours-experiences]");
    if (!target) return;

    target.innerHTML = (data.experiences || []).map((item) => `
      <article class="parcours-experience-card" data-parcours-type="experience">
        <span class="parcours-card-icon" aria-hidden="true">${escapeHtml(item.icon || "•")}</span>
        <div class="parcours-card-main">
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.detail)}</p>
        </div>
      </article>
    `).join("");
  }

  function renderTimeline(data) {
    const target = document.querySelector("[data-parcours-timeline]");
    const items = data.timeline || [];
    if (!target || !items.length) return;

    target.style.setProperty("--point-count", String(items.length));
    target.innerHTML = `
      <div class="parcours-timeline-list">
        ${items.map((item, index) => `
          <article class="parcours-timeline-point" data-index="${index}" data-type="${escapeHtml(item.type || "parcours")}">
            <strong>${escapeHtml(item.title)}</strong>
            <p>${escapeHtml(item.subtitle)}</p>
            <small>${escapeHtml(item.period)}</small>
          </article>
        `).join("")}
      </div>
    `;
  }

  function renderSkills(data) {
    const target = document.querySelector("[data-parcours-skills]");
    if (!target) return;

    target.innerHTML = (data.skills || []).map((skill) => `
      <span class="parcours-skill">${escapeHtml(skill)}</span>
    `).join("");
  }

  function syncMiniPlayerLabel() {
    const page = document.querySelector(".parcours-rebuild");
    const label = document.querySelector(".track-label");
    if (!page || !label) return;
    label.innerHTML = "<b>03</b><b>PARCOURS ARTISTIQUE</b><b>ÉTUDES · EXPÉRIENCES · COMPÉTENCES</b>";
  }

  function initParcoursPage() {
    const page = document.querySelector(".parcours-rebuild");
    if (!page || page.dataset.parcoursReady === "true") return;

    const data = getData();
    renderStudies(data);
    renderExperiences(data);
    renderTimeline(data);
    renderSkills(data);
    syncMiniPlayerLabel();
    page.dataset.parcoursReady = "true";
  }

  const observer = new MutationObserver(() => window.requestAnimationFrame(initParcoursPage));

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initParcoursPage();
      const app = document.querySelector("#app");
      if (app) observer.observe(app, { childList: true, subtree: true });
    });
  } else {
    initParcoursPage();
    const app = document.querySelector("#app");
    if (app) observer.observe(app, { childList: true, subtree: true });
  }
})();
