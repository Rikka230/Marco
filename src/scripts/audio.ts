// AudioManager — port fidele de l'IIFE "MARCO AUDIO MANAGER" de script.js.
// Sous Astro : l'element <audio> + le mini-player sont persistes (transition:persist),
// donc la lecture continue entre les pages. initAudio() attache les listeners delegues
// UNE fois (sur document) ; restoreTrack() se rejoue a chaque astro:page-load.

const STORAGE_KEY = 'marco.activeTrack.v6';
const LEGACY_KEY = 'marco.activeTrack.v010';
const BODY_CLASS = 'music-drawer-open';

interface Track {
  id: string;
  title: string;
  meta: string;
  duration: string;
  audio: string;
}

const TRACKS: Track[] = [
  { id: '01', title: 'Cinematic Strings', meta: 'Score · Featured', duration: '02:48', audio: '/assets/audio/marco-placeholder-01.wav' },
  { id: '02', title: 'Night Motif', meta: 'Demo · Piano / Strings', duration: '01:36', audio: '/assets/audio/marco-placeholder-02.wav' },
  { id: '03', title: 'Excursion Theme', meta: 'Campaign · Visual', duration: '02:12', audio: '/assets/audio/marco-placeholder-03.wav' },
  { id: '04', title: 'Bow Texture', meta: 'Violin + Score · Atmosphere', duration: '03:10', audio: '/assets/audio/marco-placeholder-04.wav' },
  { id: '05', title: 'Red Cut', meta: 'Original · Pulse', duration: '02:04', audio: '/assets/audio/marco-placeholder-05.wav' },
  { id: '06', title: 'Stage Lines', meta: 'Stage · Scene', duration: '02:52', audio: '/assets/audio/marco-placeholder-06.wav' },
  { id: '07', title: 'Glass Motif', meta: 'Placeholder · Texture', duration: '01:44', audio: '/assets/audio/marco-placeholder-07.wav' },
  { id: '08', title: 'Low Room', meta: 'Placeholder · Ambient', duration: '02:26', audio: '/assets/audio/marco-placeholder-08.wav' },
  { id: '09', title: 'First Cut', meta: 'Placeholder · Draft', duration: '01:58', audio: '/assets/audio/marco-placeholder-09.wav' },
  { id: '10', title: 'End Theme', meta: 'Placeholder · Finale', duration: '03:04', audio: '/assets/audio/marco-placeholder-10.wav' },
];

const getAudio = () => document.querySelector<HTMLAudioElement>('#audioLoop');
const getPlayButton = () => document.querySelector<HTMLButtonElement>('#playBtn');

function getTrackById(id: string): Track {
  return TRACKS.find((track) => track.id === String(id).padStart(2, '0')) || TRACKS[0];
}

function getTrackFromCompositionCard(card: Element | null): Track {
  const index = card?.querySelector('.track-index')?.textContent?.trim();
  if (index) return getTrackById(index);
  const title = (card as HTMLElement | null)?.dataset?.trackTitle || card?.querySelector('.track-title')?.textContent?.trim();
  return TRACKS.find((track) => track.title.toLowerCase() === String(title || '').toLowerCase()) || TRACKS[0];
}

function getCurrentTrack(): Track {
  const stored = localStorage.getItem(STORAGE_KEY);
  const audio = getAudio();
  const audioId = audio?.dataset?.trackId;
  return getTrackById(audioId || stored || '01');
}

function syncPlayButton() {
  const audio = getAudio();
  const button = getPlayButton();
  if (!audio || !button) return;
  const isPlaying = !audio.paused;
  button.textContent = isPlaying ? 'PAUSE' : 'PLAY';
  button.classList.toggle('is-playing', isPlaying);
  button.setAttribute('aria-label', isPlaying ? 'Mettre la musique en pause' : 'Lancer la musique');
}

function updateMiniLabel(track: Track) {
  const label = document.querySelector('.track-label');
  if (!label || !track) return;
  label.innerHTML = `<b>${track.id}</b><b>${track.title}</b><b>${track.meta}</b>`;
}

function updateDrawerNow(track: Track) {
  const audio = getAudio();
  const title = document.querySelector('[data-drawer-now-title]');
  const meta = document.querySelector('[data-drawer-now-meta]');
  const action = document.querySelector('[data-drawer-main-action]');
  if (title) title.textContent = track.title;
  if (meta) meta.textContent = `${track.meta} · ${track.duration}`;
  if (action) action.textContent = audio && !audio.paused ? 'Pause' : 'Play';
}

function updateActiveStates(track: Track) {
  document.querySelectorAll<HTMLElement>('[data-music-track-id]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.musicTrackId === track.id);
  });
  document.querySelectorAll('.composition-track').forEach((card) => {
    const cardTrack = getTrackFromCompositionCard(card);
    card.classList.toggle('is-active', cardTrack.id === track.id);
  });
  updateDrawerNow(track);
}

async function setGlobalTrack(track: Track, shouldPlay = true) {
  const audio = getAudio();
  if (!audio || !track) return;
  const absolute = new URL(track.audio, window.location.origin).href;
  if (audio.src !== absolute) {
    audio.src = track.audio;
    audio.load();
  }
  audio.dataset.trackId = track.id;
  localStorage.setItem(STORAGE_KEY, track.id);
  updateMiniLabel(track);
  updateActiveStates(track);
  if (shouldPlay) {
    try { await audio.play(); } catch (error) { console.warn('Audio bloque par le navigateur', error); }
  }
  syncPlayButton();
  updateDrawerNow(track);
}

function closeDrawer() {
  document.body.classList.remove(BODY_CLASS);
  const toggle = document.querySelector('.music-drawer-toggle');
  toggle?.classList.remove('is-open');
  toggle?.setAttribute('aria-expanded', 'false');
}

function toggleDrawer(force?: boolean) {
  const shouldOpen = typeof force === 'boolean' ? force : !document.body.classList.contains(BODY_CLASS);
  document.body.classList.toggle(BODY_CLASS, shouldOpen);
  const toggle = document.querySelector('.music-drawer-toggle');
  toggle?.classList.toggle('is-open', shouldOpen);
  toggle?.setAttribute('aria-expanded', String(shouldOpen));
}

function buildDrawer(): HTMLElement {
  const drawer = document.createElement('div');
  drawer.className = 'music-drawer-sheet';
  drawer.setAttribute('data-music-drawer', '');
  drawer.innerHTML = `
    <section class="music-drawer-now" aria-label="Morceau actif">
      <span class="music-drawer-eyebrow">Now playing</span>
      <strong data-drawer-now-title>Cinematic Strings</strong>
      <span data-drawer-now-meta>Score · Featured · 02:48</span>
      <button class="music-drawer-main-action" type="button" data-drawer-main-action>Play</button>
    </section>
    <section class="music-drawer-library" aria-label="Bibliothèque musicale globale">
      <div class="music-drawer-header">
        <strong>Music Library</strong>
        <span>Disponible sur toutes les pages</span>
      </div>
      <div class="music-drawer-list">
        ${TRACKS.map((track) => `
          <button class="music-drawer-track" type="button" data-music-track-id="${track.id}">
            <span class="music-drawer-index">${track.id}</span>
            <span class="music-drawer-name"><strong>${track.title}</strong><span>${track.meta}</span></span>
            <span class="music-drawer-duration">${track.duration}</span>
            <span class="music-drawer-action">Play</span>
          </button>
        `).join('')}
      </div>
    </section>
  `;

  drawer.addEventListener('click', (event) => {
    const target = event.target as Element;
    const mainAction = target.closest('[data-drawer-main-action]');
    if (mainAction) {
      event.preventDefault();
      event.stopPropagation();
      const audio = getAudio();
      if (!audio) return;
      if (audio.paused) audio.play().catch((error) => console.warn('Audio bloque par le navigateur', error));
      else audio.pause();
      window.setTimeout(() => { syncPlayButton(); updateDrawerNow(getCurrentTrack()); }, 40);
      return;
    }
    const trackButton = target.closest<HTMLElement>('[data-music-track-id]');
    if (!trackButton) return;
    event.preventDefault();
    event.stopPropagation();
    setGlobalTrack(getTrackById(trackButton.dataset.musicTrackId || '01'), true);
  });

  return drawer;
}

function ensureDrawer() {
  const miniPlayer = document.querySelector('.mini-player');
  if (!miniPlayer) return;

  let toggle = miniPlayer.querySelector('.music-drawer-toggle');
  if (!toggle) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'music-drawer-toggle';
    btn.setAttribute('aria-label', 'Ouvrir la bibliothèque musicale');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span>Musiques</span><i class="music-drawer-arrow" aria-hidden="true">↑</i>';
    miniPlayer.appendChild(btn);
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleDrawer();
    });
    toggle = btn;
  }

  if (!document.querySelector('[data-music-drawer]')) {
    document.body.appendChild(buildDrawer());
  }
}

/** Resynchronise le mini-player avec le morceau courant. A appeler sur chaque astro:page-load. */
export function restoreTrack() {
  ensureDrawer();
  const track = getCurrentTrack();
  const audio = getAudio();
  if (audio && audio.dataset.trackId !== track.id) {
    audio.src = track.audio;
    audio.dataset.trackId = track.id;
  }
  updateMiniLabel(track);
  updateActiveStates(track);
  syncPlayButton();
}

let bound = false;

/** Attache les listeners delegues une seule fois (document persiste entre les navigations Astro). */
export function initAudio() {
  if (bound) return;
  bound = true;

  // Migration douce depuis l'ancienne cle v0.1.0.
  try {
    if (!localStorage.getItem(STORAGE_KEY) && localStorage.getItem(LEGACY_KEY)) {
      localStorage.setItem(STORAGE_KEY, localStorage.getItem(LEGACY_KEY)!);
    }
  } catch { /* storage indisponible */ }

  // Capture : bouton play global + cartes composition.
  document.addEventListener('click', async (event) => {
    const target = event.target as Element;
    const playButton = target.closest('#playBtn');
    if (playButton) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const audio = getAudio();
      if (!audio) return;
      try { if (audio.paused) await audio.play(); else audio.pause(); }
      catch (error) { console.warn('Audio bloque par le navigateur', error); }
      syncPlayButton();
      updateDrawerNow(getCurrentTrack());
      return;
    }
    const trackPlay = target.closest('.composition-track .track-play');
    if (trackPlay) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      await setGlobalTrack(getTrackFromCompositionCard(trackPlay.closest('.composition-track')), true);
    }
  }, true);

  // Fermeture du tiroir au clic exterieur + Escape.
  document.addEventListener('click', (event) => {
    const target = event.target as Element;
    if (!target.closest('[data-music-drawer]') && !target.closest('.music-drawer-toggle')) closeDrawer();
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeDrawer(); });

  // Sync bouton/tiroir sur play/pause de l'audio.
  document.addEventListener('play', (event) => {
    if ((event.target as HTMLElement)?.id === 'audioLoop') { syncPlayButton(); updateDrawerNow(getCurrentTrack()); }
  }, true);
  document.addEventListener('pause', (event) => {
    if ((event.target as HTMLElement)?.id === 'audioLoop') { syncPlayButton(); updateDrawerNow(getCurrentTrack()); }
  }, true);
}
