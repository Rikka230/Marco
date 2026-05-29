/* === MARCO PATCH v0.6.2 PARCOURS V1 DATA RENDERER === */
(() => {
  const ICONS = {
    music: `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M12 22.5V7.5l12-2v14" />
        <path d="M12 11.5l12-2" />
        <ellipse cx="8.5" cy="23.5" rx="4.5" ry="3.5" />
        <ellipse cx="20.5" cy="20.5" rx="4.5" ry="3.5" />
      </svg>
    `,
    camera: `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M7 11.5h5l2-3h5l2 3h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-10a2 2 0 0 1 2-2Z" />
        <circle cx="16" cy="18.5" r="4.6" />
        <path d="M23.5 14.5h.1" />
      </svg>
    `,
    clapper: `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M5.5 13.5h21v12h-21z" />
        <path d="M7 13.5l3.5-6 4.6 6m-2-6h13l-3.5 6m-2.2-6l-3.6 6" />
        <path d="M9 18.5h9M9 22h14" />
      </svg>
    `,
    stage: `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M4.5 21.5c3-3.2 6.2-3.2 9.5 0s6.5 3.2 9.8 0" />
        <path d="M6 12.5h20v11H6z" />
        <path d="M9 12.5V9h14v3.5M11 17h10M11 20h5" />
      </svg>
    `
  };

  const STROKE_COLORS = ["blue", "green", "pink"];
  const STROKE_COLOR_VARS = {
    blue: "var(--parcours-blue)",
    green: "var(--parcours-green)",
    pink: "var(--parcours-pink)"
  };
  const STROKE_VARIANTS = {
    blue: [
      "/assets/img/timeline-strokes/timeline-stroke-01-blue.png",
      "/assets/img/timeline-strokes/timeline-stroke-02-blue.png",
      "/assets/img/timeline-strokes/timeline-stroke-03-blue.png",
      "/assets/img/timeline-strokes/timeline-stroke-04-blue.png",
      "/assets/img/timeline-strokes/timeline-stroke-05-blue.png",
      "/assets/img/timeline-strokes/timeline-stroke-06-blue.png",
      "/assets/img/timeline-strokes/timeline-stroke-07-blue.png",
      "/assets/img/timeline-strokes/timeline-stroke-08-blue.png",
      "/assets/img/timeline-strokes/timeline-stroke-09-blue.png",
      "/assets/img/timeline-strokes/timeline-stroke-10-blue.png"
    ],
    green: [
      "/assets/img/timeline-strokes/timeline-stroke-01-green.png",
      "/assets/img/timeline-strokes/timeline-stroke-02-green.png",
      "/assets/img/timeline-strokes/timeline-stroke-03-green.png",
      "/assets/img/timeline-strokes/timeline-stroke-04-green.png",
      "/assets/img/timeline-strokes/timeline-stroke-05-green.png",
      "/assets/img/timeline-strokes/timeline-stroke-06-green.png",
      "/assets/img/timeline-strokes/timeline-stroke-07-green.png",
      "/assets/img/timeline-strokes/timeline-stroke-08-green.png",
      "/assets/img/timeline-strokes/timeline-stroke-09-green.png",
      "/assets/img/timeline-strokes/timeline-stroke-10-green.png"
    ],
    pink: [
      "/assets/img/timeline-strokes/timeline-stroke-01-pink.png",
      "/assets/img/timeline-strokes/timeline-stroke-02-pink.png",
      "/assets/img/timeline-strokes/timeline-stroke-03-pink.png",
      "/assets/img/timeline-strokes/timeline-stroke-04-pink.png",
      "/assets/img/timeline-strokes/timeline-stroke-05-pink.png",
      "/assets/img/timeline-strokes/timeline-stroke-06-pink.png",
      "/assets/img/timeline-strokes/timeline-stroke-07-pink.png",
      "/assets/img/timeline-strokes/timeline-stroke-08-pink.png",
      "/assets/img/timeline-strokes/timeline-stroke-09-pink.png",
      "/assets/img/timeline-strokes/timeline-stroke-10-pink.png"
    ]
  };

  const DEFAULT_DATA = {
    studies: [
      {
        title: "Conservatoire",
        detail: "Violon classique - Formation musicale - Interpr\u00e9tation",
        period: "2008 -> 2014"
      },
      {
        title: "Training Acting",
        detail: "Jeu cam\u00e9ra - Improvisation - M\u00e9thode Stanislavski",
        period: "2015 -> 2016"
      },
      {
        title: "D\u00e9veloppement Artistique",
        detail: "Composition - MAO - Direction artistique - \u00c9criture",
        period: "2016 -> 2018"
      }
    ],
    timeline: [
      {
        title: "Conservatoire",
        subtitle: "Violon classique - Formation musicale",
        period: "2008 - 2014",
        type: "formation",
        strokeColor: "blue"
      },
      {
        title: "Training Acting",
        subtitle: "Jeu cam\u00e9ra - Improvisation",
        period: "2015 - 2018",
        type: "formation",
        strokeColor: "green"
      },
      {
        title: "Composition",
        subtitle: "MAO - \u00c9criture - Direction artistique",
        period: "2016 - 2018",
        type: "formation",
        strokeColor: "pink"
      },
      {
        title: "Interpr\u00e8te",
        subtitle: "Concerts - Sessions - Sc\u00e8ne",
        period: "2019 - 2021",
        type: "job",
        strokeColor: "green"
      },
      {
        title: "Mod\u00e8le",
        subtitle: "Campagnes - \u00c9ditorial - Image de marque",
        period: "2021 - 2023",
        type: "job",
        strokeColor: "blue"
      },
      {
        title: "Cin\u00e9ma",
        subtitle: "Courts-m\u00e9trages - R\u00f4les - Casting",
        period: "2023 - 2025",
        type: "job",
        strokeColor: "pink"
      },
      {
        title: "Projets",
        subtitle: "Cr\u00e9ation - Transmission - Performances",
        period: "2025 - Aujourd'hui",
        type: "job",
        strokeColor: "green"
      }
    ],
    experiences: [
      {
        icon: "music",
        title: "Musique",
        detail: "Interpr\u00e8te - Compositeur - Arrangements"
      },
      {
        icon: "camera",
        title: "Mod\u00e8le",
        detail: "Campagnes - \u00c9ditorial - Image de marque"
      },
      {
        icon: "clapper",
        title: "Jeu / Cin\u00e9ma",
        detail: "Court-m\u00e9trages - R\u00f4les - Figuration - Casting"
      },
      {
        icon: "stage",
        title: "Sc\u00e8ne / Projets",
        detail: "Concerts - Performances - Projets artistiques"
      }
    ],
    skills: [
      "Discipline",
      "Presence",
      "Cr\u00e9ation",
      "Rigueur",
      "Sens du detail",
      "Curiosit\u00e9"
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

  function hashString(value) {
    let hash = 2166136261;
    const text = String(value ?? "");

    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
  }

  function decorateTimelineItems(items) {
    let previousColor = "";

    return items.map((item, index) => {
      const seed = hashString(`${item.period}|${item.title}|${item.subtitle}|${index}`);
      const colorChoices = STROKE_COLORS.filter((color) => color !== previousColor);
      const preferredColor = STROKE_COLORS.includes(item.strokeColor) ? item.strokeColor : "";
      const color = preferredColor && preferredColor !== previousColor
        ? preferredColor
        : colorChoices[seed % colorChoices.length];
      const variants = STROKE_VARIANTS[color] || STROKE_VARIANTS.blue;
      const variantIndex = Math.floor(seed / colorChoices.length) % variants.length;
      const strokeAsset = item.strokeAsset || variants[variantIndex];

      previousColor = color;

      return {
        ...item,
        strokeAsset,
        strokeColor: color,
        strokeColorValue: STROKE_COLOR_VARS[color] || STROKE_COLOR_VARS.blue
      };
    });
  }

  function iconMarkup(name) {
    return ICONS[name] || "";
  }

  function getData() {
    return window.MARCO_PARCOURS_DATA || DEFAULT_DATA;
  }

  function renderStudies(data) {
    const target = document.querySelector("[data-parcours-studies]");
    if (!target) return;

    target.innerHTML = (data.studies || []).map((item) => `
      <article class="parcours-study-card" data-parcours-type="study">
        <span class="parcours-card-icon" aria-hidden="true"></span>
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
        <span class="parcours-card-icon" aria-hidden="true">${iconMarkup(item.icon)}</span>
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

    const decoratedItems = decorateTimelineItems(items);
    target.style.setProperty("--point-count", String(items.length));
    target.innerHTML = `
      <div class="parcours-timeline-list">
        ${decoratedItems.map((item, index) => `
          <article class="parcours-timeline-point" data-index="${index}" data-type="${escapeHtml(item.type || "parcours")}" style="--timeline-color: ${item.strokeColorValue}; --timeline-stroke-image: url('${escapeHtml(item.strokeAsset)}');">
            <span class="parcours-timeline-icon" aria-hidden="true"></span>
            <small>${escapeHtml(item.period)}</small>
            <strong>${escapeHtml(item.title)}</strong>
            <p>${escapeHtml(item.subtitle)}</p>
          </article>
        `).join("")}
      </div>
    `;
  }

  function updateTimelineScrollState(target) {
    const maxScroll = Math.max(0, target.scrollWidth - target.clientWidth);
    const scrollLeft = Math.max(0, target.scrollLeft);
    const state = scrollLeft <= 2
      ? "start"
      : scrollLeft >= maxScroll - 2
        ? "end"
        : "middle";

    target.dataset.scrollState = state;
  }

  function enableTimelineScroll() {
    const target = document.querySelector("[data-parcours-timeline]");
    if (!target || target.dataset.scrollReady === "true") return;
    let ticking = false;

    target.addEventListener("wheel", (event) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX) && event.deltaX === 0) return;
      event.preventDefault();
      event.stopPropagation();
      target.scrollLeft += event.deltaX || event.deltaY;
    }, { passive: false });

    target.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        updateTimelineScrollState(target);
        ticking = false;
      });
    });

    window.addEventListener("resize", () => updateTimelineScrollState(target));
    updateTimelineScrollState(target);
    target.dataset.scrollReady = "true";
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
    label.innerHTML = "<b>03</b><b>PARCOURS ARTISTIQUE</b><b>&Eacute;TUDES - EXP&Eacute;RIENCES - COMP&Eacute;TENCES</b>";
  }

  function initParcoursPage() {
    const page = document.querySelector(".parcours-rebuild");
    if (!page || page.dataset.parcoursReady === "true") return;

    const data = getData();
    renderStudies(data);
    renderExperiences(data);
    renderTimeline(data);
    renderSkills(data);
    enableTimelineScroll();
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
