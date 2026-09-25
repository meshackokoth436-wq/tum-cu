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
  backdropSlides: BackdropSlide[];
  galleryPhotos: GalleryPhoto[];
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
}
