/* === MARCO PATCH v0.6.3 PARCOURS V1 DATA RENDERER === */
(() => {
  const ICONS = {
    study: `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M4 11.5 16 6l12 5.5L16 17 4 11.5Z" />
        <path d="M9 14.5v5.2c2.8 2.3 11.2 2.3 14 0v-5.2" />
        <path d="M27 12v7" />
      </svg>
    `,
    waveform: `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M5 18v-4M9 21V11M13 24V8M17 22V10M21 25V7M25 20v-8M29 17v-2" />
      </svg>
    `,
    mic: `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect x="12" y="5" width="8" height="15" rx="4" />
        <path d="M7.5 16.5c0 5 3.4 8 8.5 8s8.5-3 8.5-8" />
        <path d="M16 24.5V29M11.5 29h9" />
      </svg>
    `,
    violin: `
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M22.5 4.5 27.5 9.5M11 21l10-10M19.5 7.5l5 5" />
        <path d="M12.5 16.5c-2.8-2.2-5.8-1.3-7.1.8-1.6 2.5.6 5.5 3.7 4.7-1.1 2.9 2.4 5.4 5 3.5 2.2-1.6 2.5-4.7.2-7.2" />
        <path d="M16 11.5c2.2-1.9 4.9-1.6 6.1.3 1.3 2-.2 4.5-2.6 4.3" />
      </svg>
    `,
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
    mobileChips: [
      { label: "Formation", target: "formation", icon: "study" },
      { label: "Acting", target: "acting", icon: "clapper" },
      { label: "Composition", target: "composition", icon: "waveform" },
      { label: "Interpr\u00e8te", target: "interprete", icon: "mic" },
      { label: "Mod\u00e8le", target: "modele", icon: "camera" }
    ],
    mobileTimeline: [
      {
        id: "formation",
        icon: "violin",
        title: "Conservatoire",
        subtitle: "Violon classique \u00b7 Formation musicale \u00b7 Interpr\u00e9tation",
        period: "2008 - 2014",
        tone: "blue"
      },
      {
        id: "acting",
        icon: "clapper",
        title: "Training Acting",
        subtitle: "Jeu cam\u00e9ra \u00b7 Improvisation \u00b7 M\u00e9thode Stanislavski",
        period: "2015 - 2016",
        tone: "blue"
      },
      {
        id: "composition",
        icon: "waveform",
        title: "D\u00e9veloppement artistique",
        subtitle: "Composition \u00b7 MAO \u00b7 Direction artistique \u00b7 \u00c9criture",
        period: "2016 - 2018",
        tone: "blue"
      },
      {
        id: "interprete",
        icon: "mic",
        title: "Interpr\u00e8te",
        subtitle: "Concerts \u00b7 Sessions \u00b7 Sc\u00e8ne",
        period: "2019 - 2021",
        tone: "green"
      },
      {
        id: "modele",
        icon: "camera",
        title: "Mod\u00e8le",
        subtitle: "Campagnes \u00b7 Editorial \u00b7 Image de marque",
        period: "2021 - 2023",
        tone: "green"
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

  function renderMobileChips(data) {
    const target = document.querySelector("[data-parcours-mobile-chips]");
    const chips = data.mobileChips || [];
    if (!target || !chips.length) return;

    target.innerHTML = chips.map((chip, index) => `
      <button class="parcours-mobile-chip${index === 0 ? " is-active" : ""}" type="button" data-mobile-target="${escapeHtml(chip.target)}">
        <span aria-hidden="true">${iconMarkup(chip.icon)}</span>
        ${escapeHtml(chip.label)}
      </button>
    `).join("");
  }

  function renderMobileTimeline(data) {
    const target = document.querySelector("[data-parcours-mobile-timeline]");
    const items = data.mobileTimeline || [];
    if (!target || !items.length) return;

    target.innerHTML = items.map((item) => `
      <article class="parcours-mobile-timeline-card" data-mobile-id="${escapeHtml(item.id)}" data-tone="${escapeHtml(item.tone || "blue")}">
        <small>${escapeHtml(item.period)}</small>
        <div class="parcours-mobile-card-body">
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.subtitle)}</p>
          <span class="parcours-mobile-card-icon" aria-hidden="true">${iconMarkup(item.icon)}</span>
        </div>
      </article>
    `).join("");
  }

  function renderMobileExperiences(data) {
    const target = document.querySelector("[data-parcours-mobile-experiences]");
    if (!target) return;

    target.innerHTML = (data.experiences || []).map((item) => `
      <article class="parcours-mobile-experience-card">
          <span class="parcours-mobile-experience-icon" aria-hidden="true">${iconMarkup(item.icon)}</span>
        <div>
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(String(item.detail ?? "").replace(/ - /g, " \u00b7 "))}</p>
        </div>
      </article>
    `).join("");
  }

  function renderMobileSkills(data) {
    const target = document.querySelector("[data-parcours-mobile-skills]");
    if (!target) return;

    target.innerHTML = (data.skills || []).map((skill, index) => `
      <span class="parcours-mobile-skill" data-tone="${index % 5 === 2 ? "pink" : index % 4 === 3 ? "green" : "blue"}">${escapeHtml(skill)}</span>
    `).join("");
  }

  function enableMobileChips() {
    const page = document.querySelector(".parcours-rebuild");
    const flow = document.querySelector("[data-parcours-mobile]");
    const chips = document.querySelectorAll("[data-mobile-target]");
    if (!page || !flow || !chips.length || flow.dataset.chipsReady === "true") return;

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const target = page.querySelector(`[data-mobile-id="${chip.dataset.mobileTarget}"]`);
        if (!target) return;

        chips.forEach((item) => item.classList.toggle("is-active", item === chip));
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });

    flow.dataset.chipsReady = "true";
  }

  function enableMobilePlayer() {
    const player = document.querySelector("[data-parcours-mobile-player]");
    if (!player || player.dataset.playerReady === "true") return;

    player.querySelector("[data-parcours-mobile-play]")?.addEventListener("click", () => {
      document.querySelector(".shell > .mini-player #playBtn, #playBtn")?.click();
    });

    player.querySelector("[data-parcours-mobile-music]")?.addEventListener("click", () => {
      document.querySelector(".shell > .mini-player .music-drawer-toggle, .music-drawer-toggle")?.click();
    });

    player.dataset.playerReady = "true";
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
    label.innerHTML = window.matchMedia("(max-width: 768px)").matches
      ? "<b>01</b><b>CINEMATIC STRINGS</b><b>MUSIQUES &uarr;</b>"
      : "<b>03</b><b>PARCOURS ARTISTIQUE</b><b>&Eacute;TUDES - EXP&Eacute;RIENCES - COMP&Eacute;TENCES</b>";
  }

  function initParcoursPage() {
    const page = document.querySelector(".parcours-rebuild");
    if (!page || page.dataset.parcoursReady === "true") return;

    const data = getData();
    renderStudies(data);
    renderExperiences(data);
    renderTimeline(data);
    renderSkills(data);
    renderMobileChips(data);
    renderMobileTimeline(data);
    renderMobileExperiences(data);
    renderMobileSkills(data);
    enableTimelineScroll();
    enableMobileChips();
    enableMobilePlayer();
    syncMiniPlayerLabel();
    page.dataset.parcoursReady = "true";
  }

  const observer = new MutationObserver(() => window.requestAnimationFrame(initParcoursPage));

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initParcoursPage();
      window.addEventListener("resize", syncMiniPlayerLabel);
      const app = document.querySelector("#app");
      if (app) observer.observe(app, { childList: true, subtree: true });
    });
  } else {
    initParcoursPage();
    window.addEventListener("resize", syncMiniPlayerLabel);
    const app = document.querySelector("#app");
    if (app) observer.observe(app, { childList: true, subtree: true });
  }
})();
