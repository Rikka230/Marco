/* === MARCO PATCH v0.1.0 FILMOGRAPHIE DATA RENDERER === */
(() => {
  const DATA = [
    {
      id: "heures-troubles",
      year: "2024",
      title: "Les Heures Troubles",
      role: "Second role",
      director: "Jeanne Morel",
      format: "Court-metrage",
      category: "Court-metrage",
      diffusion: "Festival prive",
      duration: "01:16"
    },
    {
      id: "dernier-signal",
      year: "2023",
      title: "Dernier Signal",
      role: "Role principal",
      director: "N. Bernard",
      format: "Serie",
      category: "Serie",
      diffusion: "Plateforme privee",
      duration: "01:24"
    },
    {
      id: "nuit-marseille",
      year: "2023",
      title: "Nuit sur Marseille",
      role: "Jeune violoniste",
      director: "A. Valette",
      format: "Clip narratif",
      category: "Clip",
      diffusion: "Production independante",
      duration: "00:58"
    },
    {
      id: "passage-nord",
      year: "2022",
      title: "Passage Nord",
      role: "Figuration parlante",
      director: "Clara Sorel",
      format: "Long-metrage",
      category: "Long-metrage",
      diffusion: "Projection privee",
      duration: "01:08"
    },
    {
      id: "terrain-vague",
      year: "2021",
      title: "Terrain Vague",
      role: "Silhouette",
      director: "M. Caron",
      format: "Court-metrage",
      category: "Court-metrage",
      diffusion: "Ecole cinema",
      duration: "00:42"
    },
    {
      id: "ligne-fuite",
      year: "2020",
      title: "Ligne de Fuite",
      role: "Casting pub",
      director: "Studio Atlas",
      format: "Publicite",
      category: "Publicite",
      diffusion: "Web",
      duration: "00:30"
    },
    {
      id: "prelude-hiver",
      year: "2019",
      title: "Prelude d'Hiver",
      role: "Figuration",
      director: "L. Dubois",
      format: "Court-metrage",
      category: "Court-metrage",
      diffusion: "Projection atelier",
      duration: "00:52"
    }
  ];

  const FILTERS = ["Tous", "Court-metrage", "Long-metrage", "Serie", "Clip", "Publicite"];
  const IMAGE_PLACEHOLDER = "/assets/img/filmographie/filmographie-extrait-placeholder.jpg";
  let activeFilter = "Tous";
  let activeId = "dernier-signal";

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function strip(value) {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function renderFilters() {
    const target = document.querySelector("[data-filmography-filters]");
    if (!target || target.dataset.ready === "true") return;

    target.innerHTML = FILTERS.map((filter) => `
      <button class="filmographie-filter${filter === activeFilter ? " is-active" : ""}" type="button" data-filmography-filter="${escapeHtml(filter)}">${escapeHtml(filter)}</button>
    `).join("");

    target.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filmography-filter]");
      if (!button) return;
      activeFilter = button.dataset.filmographyFilter || "Tous";
      target.querySelectorAll("[data-filmography-filter]").forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });
      renderList();
    });

    target.dataset.ready = "true";
  }

  function getFilteredItems() {
    const input = document.querySelector("[data-filmography-search]");
    const query = strip(input?.value || "");

    return DATA.filter((item) => {
      const matchesFilter = activeFilter === "Tous" || item.category === activeFilter;
      if (!matchesFilter) return false;
      if (!query) return true;

      return strip(`${item.year} ${item.title} ${item.role} ${item.director} ${item.format}`).includes(query);
    });
  }

  function renderList() {
    const target = document.querySelector("[data-filmography-list]");
    if (!target) return;

    const items = getFilteredItems();
    if (!items.length) {
      target.innerHTML = `
        <article class="filmographie-row is-empty">
          <strong class="filmographie-title-cell">Aucun resultat</strong>
        </article>
      `;
      return;
    }

    target.innerHTML = items.map((item) => `
      <article class="filmographie-row${item.id === activeId ? " is-active" : ""}" data-filmography-id="${escapeHtml(item.id)}">
        <strong class="filmographie-year">${escapeHtml(item.year)}</strong>
        <strong class="filmographie-title-cell">${escapeHtml(item.title)}</strong>
        <span class="filmographie-meta"><span>Role</span><b>${escapeHtml(item.role)}</b></span>
        <span class="filmographie-meta"><span>Real.</span><b>${escapeHtml(item.director)}</b></span>
        <span class="filmographie-meta"><span>Format</span><b>${escapeHtml(item.format)}</b></span>
        <span class="filmographie-row-play" role="button" tabindex="0"><i></i> Voir l'extrait</span>
      </article>
    `).join("");
  }

  function isMobileLayout() {
    return window.matchMedia("(max-width: 820px)").matches;
  }

  function scrollSelectedIntoView() {
    if (!isMobileLayout()) return;

    const selected = document.querySelector(".filmographie-selected");
    if (!selected) return;

    window.requestAnimationFrame(() => {
      selected.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function setSelected(item) {
    if (!item) return;
    activeId = item.id;

    const setText = (selector, value) => {
      const target = document.querySelector(selector);
      if (target) target.textContent = value;
    };

    setText("[data-filmography-selected-title]", item.title);
    setText("[data-filmography-selected-year]", item.year);
    setText("[data-filmography-selected-year-meta]", item.year);
    setText("[data-filmography-selected-format]", item.format);
    setText("[data-filmography-selected-format-meta]", item.format);
    setText("[data-filmography-selected-role]", item.role);
    setText("[data-filmography-selected-director]", item.director);
    setText("[data-filmography-selected-diffusion]", item.diffusion);
    setText("[data-filmography-selected-duration]", item.duration);

    const image = document.querySelector("[data-filmography-selected-image]");
    if (image) {
      image.src = item.image || IMAGE_PLACEHOLDER;
      image.alt = `Image d'extrait - ${item.title}`;
    }

    document.querySelectorAll("[data-filmography-id]").forEach((row) => {
      row.classList.toggle("is-active", row.dataset.filmographyId === item.id);
    });
  }

  function enableListSelection() {
    const target = document.querySelector("[data-filmography-list]");
    if (!target || target.dataset.ready === "true") return;

    target.addEventListener("click", (event) => {
      const row = event.target.closest("[data-filmography-id]");
      if (!row) return;
      const item = DATA.find((entry) => entry.id === row.dataset.filmographyId);
      setSelected(item);
      if (event.target.closest(".filmographie-row-play")) {
        scrollSelectedIntoView();
      }
    });

    target.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;

      const play = event.target.closest(".filmographie-row-play");
      if (!play) return;

      event.preventDefault();
      const row = play.closest("[data-filmography-id]");
      const item = DATA.find((entry) => entry.id === row?.dataset.filmographyId);
      setSelected(item);
      scrollSelectedIntoView();
    });

    target.dataset.ready = "true";
  }

  function enableListScrollLock() {
    const target = document.querySelector("[data-filmography-list]");
    if (!target || target.dataset.scrollLockReady === "true") return;

    target.addEventListener("wheel", (event) => {
      event.stopPropagation();
    }, { passive: true });

    target.addEventListener("touchmove", (event) => {
      event.stopPropagation();
    }, { passive: true });

    target.dataset.scrollLockReady = "true";
  }

  function enableSearch() {
    const input = document.querySelector("[data-filmography-search]");
    if (!input || input.dataset.ready === "true") return;

    input.addEventListener("input", renderList);
    input.dataset.ready = "true";
  }

  function enablePlayButton() {
    const button = document.querySelector("[data-filmography-play]");
    if (!button || button.dataset.ready === "true") return;

    button.addEventListener("click", () => {
      const row = document.querySelector(`[data-filmography-id="${activeId}"]`);
      if (row) row.animate([
        { transform: "translateX(0)" },
        { transform: "translateX(0.5rem)" },
        { transform: "translateX(0)" }
      ], { duration: 420, easing: "ease-out" });
    });

    button.dataset.ready = "true";
  }

  function initFilmographie() {
    const page = document.querySelector(".filmographie-rebuild");
    if (!page || page.dataset.ready === "true") return;

    renderFilters();
    renderList();
    enableListSelection();
    enableListScrollLock();
    enableSearch();
    enablePlayButton();
    setSelected(DATA.find((item) => item.id === activeId) || DATA[0]);
    page.dataset.ready = "true";
  }

  // Cycle de vie PageTransition : enter au lieu du MutationObserver auto.
  // Les listeners sont attachés aux éléments internes de la page (retirés avec le DOM),
  // un cleanup explicite n'est donc pas nécessaire ici.
  if (window.Marco && typeof window.Marco.registerPage === "function") {
    window.Marco.registerPage("filmographie", {
      enter() { initFilmographie(); },
      cleanup() {}
    });
  } else {
    // Filet de sécurité si le seam n'est pas chargé.
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initFilmographie);
    } else {
      initFilmographie();
    }
  }
})();
