import { api } from '@/services/api';

export interface HeroSlide {
  id: string;
  src: string;
  caption: string;
  eyebrow: string;
  active: boolean;
  order: number;
}

export interface GalleryPhoto {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  span?: 'featured' | 'standard';
  order: number;
}

export interface BackdropSlide {
  id: string;
  src: string;
  title: string;
  active: boolean;
  order: number;
}

export interface LandingBackgroundConfig {
  src: string;
  opacity: number;
  blurPx: number;
  title?: string;
}

export interface LandingMediaConfig {
  heroCarousel: HeroSlide[];
  rotateIntervalMs: number;
  backgroundImage: LandingBackgroundConfig;
  backdropSlides?: BackdropSlide[];
  galleryPhotos: GalleryPhoto[];
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
}

export async function fetchLandingMedia(): Promise<LandingMediaConfig> {
  const { data } = await api.get('/landing-media');
  return data.data;
}

export async function updateLandingMedia(
  config: Partial<LandingMediaConfig>
): Promise<LandingMediaConfig> {
  const { data } = await api.put('/landing-media', config);
  return data.data;
}

export async function uploadLandingImage(
  image: string,
  filename: string
): Promise<{ url: string; filename: string }> {
  const { data } = await api.post('/landing-media/upload', { image, filename });
  return data.data;
}

export async function resetLandingMedia(): Promise<LandingMediaConfig> {
  const { data } = await api.post('/landing-media/reset');
  return data.data;
}
