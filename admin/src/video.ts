// Detection auto du fournisseur video + generation de l'embed et de la vignette.
import type { MediaAsset } from './types';

type ParsedVideo = Pick<MediaAsset, 'provider' | 'embedUrl' | 'thumbnail' | 'name'>;

export function parseVideoUrl(raw: string): ParsedVideo | null {
  const url = raw.trim();
  if (!url) return null;

  // YouTube : watch?v=, youtu.be/, /embed/, /shorts/
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  if (yt) {
    const id = yt[1];
    return {
      provider: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${id}`,
      thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      name: `YouTube · ${id}`,
    };
  }

  // Vimeo : vimeo.com/ID
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) {
    const id = vm[1];
    return {
      provider: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${id}`,
      thumbnail: `https://vumbnail.com/${id}.jpg`,
      name: `Vimeo · ${id}`,
    };
  }

  // Fichier video direct (mp4/webm/mov/ogg)
  if (/\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(url)) {
    return {
      provider: 'file',
      embedUrl: url,
      thumbnail: '',
      name: url.split('/').pop()?.split('?')[0] || 'Vidéo',
    };
  }

  return null;
}
