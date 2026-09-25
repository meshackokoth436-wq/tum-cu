import fs from 'fs';
import path from 'path';
import {
  LandingMediaConfig,
  HeroSlide,
  GalleryPhoto,
  BackdropSlide,
  LandingBackgroundConfig,
} from './landing-media.interface';
import { logger } from '../../utils/logger';
import { pool, query } from '../../config/database';

const DEFAULT_BACKDROPS: BackdropSlide[] = [
  { id: 'backdrop-1', src: '/tum-gate-monument.jpg', title: 'TUM Main Entrance Monument & Heritage', active: true, order: 1 },
  { id: 'backdrop-2', src: '/community/community-1.jpg', title: 'Student Intercession & Prayer Gathering', active: true, order: 2 },
  { id: 'backdrop-3', src: '/community/community-2.jpg', title: 'Joyful Praise & Worship in Unity', active: true, order: 3 },
  { id: 'backdrop-4', src: '/community/community-3.jpg', title: 'Christian Fellowship & Discipleship', active: true, order: 4 },
  { id: 'backdrop-5', src: '/community/community-5.jpg', title: 'Campus Evangelism & Servant Leadership', active: true, order: 5 },
];

export const DEFAULT_LANDING_MEDIA: LandingMediaConfig = {
  heroCarousel: [
    { id: 'slide-1', src: '/community/community-1.jpg', caption: 'Prayer & Reflection', eyebrow: 'A people who seek God', active: true, order: 1 },
    { id: 'slide-2', src: '/community/community-2.jpg', caption: 'Worship in Unity', eyebrow: 'One family. One faith.', active: true, order: 2 },
    { id: 'slide-3', src: '/community/community-3.jpg', caption: 'Fellowship & Community', eyebrow: 'Growing together', active: true, order: 3 },
    { id: 'slide-4', src: '/community/community-4.jpg', caption: 'Worship through Music', eyebrow: 'Gifts offered to God', active: true, order: 4 },
    { id: 'slide-5', src: '/community/community-5.jpg', caption: 'A Community that Serves', eyebrow: 'Faith becoming action', active: true, order: 5 },
  ],
  rotateIntervalMs: 4000,
  backgroundImage: {
    src: '/tum-gate-monument.jpg',
    opacity: 0.8,
    blurPx: 1,
    title: 'TUM Main Entrance Gate Monument',
  },
  backdropSlides: DEFAULT_BACKDROPS,
  galleryPhotos: [
    { id: 'gal-1', src: '/community/community-3.jpg', alt: 'TUMCU students sharing fellowship', caption: 'Fellowship & belonging', span: 'featured', order: 1 },
    { id: 'gal-2', src: '/community/community-2.jpg', alt: 'TUMCU worship team', order: 2 },
    { id: 'gal-3', src: '/community/community-5.jpg', alt: 'TUMCU students in fellowship', order: 3 },
    { id: 'gal-4', src: '/community/community-1.jpg', alt: 'TUMCU prayer moment', order: 4 },
    { id: 'gal-5', src: '/community/community-4.jpg', alt: 'TUMCU music ministry', order: 5 },
  ],
  lastUpdatedBy: 'System Default',
  lastUpdatedAt: new Date().toISOString(),
};

function cloneDefaults(): LandingMediaConfig {
  return JSON.parse(JSON.stringify(DEFAULT_LANDING_MEDIA)) as LandingMediaConfig;
}

export class LandingMediaService {
  private dataFilePath: string;
  private currentConfig: LandingMediaConfig;

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (err) {
        logger.warn({ err }, 'Failed to create data directory');
      }
    }
    this.dataFilePath = path.join(dataDir, 'landing-media.json');
    this.currentConfig = this.loadFromFileFallback();
    this.initFromDatabase().catch((err) => {
      logger.warn({ err }, 'Could not initialize landing media from MySQL at startup; serving safe local fallback until database is available');
    });
  }

  private loadFromFileFallback(): LandingMediaConfig {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const parsed = JSON.parse(fs.readFileSync(this.dataFilePath, 'utf-8'));
        if (parsed && Array.isArray(parsed.heroCarousel)) {
          return {
            ...cloneDefaults(),
            ...parsed,
            heroCarousel: parsed.heroCarousel.length ? parsed.heroCarousel : cloneDefaults().heroCarousel,
            backdropSlides: Array.isArray(parsed.backdropSlides) && parsed.backdropSlides.length
              ? parsed.backdropSlides
              : cloneDefaults().backdropSlides,
            galleryPhotos: Array.isArray(parsed.galleryPhotos) && parsed.galleryPhotos.length
              ? parsed.galleryPhotos
              : cloneDefaults().galleryPhotos,
          };
        }
      }
    } catch (err) {
      logger.warn({ err }, 'Error loading landing media config from file, using defaults');
    }
    return cloneDefaults();
  }

  public async initFromDatabase(): Promise<void> {
    const configRows = await query<any[]>('SELECT * FROM landing_media_config WHERE id = :id LIMIT 1', { id: 'main' });
    const slidesRows = await query<any[]>('SELECT * FROM landing_media_slides ORDER BY display_order ASC', {});
    const backdropRows = await query<any[]>('SELECT * FROM landing_media_backdrops ORDER BY display_order ASC', {});
    const galleryRows = await query<any[]>('SELECT * FROM landing_media_gallery ORDER BY display_order ASC', {});

    if (!configRows.length) {
      await this.persistToDatabase(cloneDefaults());
      this.currentConfig = cloneDefaults();
      this.saveToFileFallback();
      return;
    }

    const conf = configRows[0];
    const defaults = cloneDefaults();
    const heroCarousel: HeroSlide[] = slidesRows.length
      ? slidesRows.map((s) => ({
          id: s.id,
          src: s.src,
          caption: s.caption,
          eyebrow: s.eyebrow,
          active: Boolean(s.is_active),
          order: Number(s.display_order),
        }))
      : defaults.heroCarousel;
    const backdropSlides: BackdropSlide[] = backdropRows.length
      ? backdropRows.map((b) => ({
          id: b.id,
          src: b.src,
          title: b.title,
          active: Boolean(b.is_active),
          order: Number(b.display_order),
        }))
      : defaults.backdropSlides;
    const galleryPhotos: GalleryPhoto[] = galleryRows.length
      ? galleryRows.map((g) => ({
          id: g.id,
          src: g.src,
          alt: g.alt,
          caption: g.caption,
          span: (g.span as 'standard' | 'featured') || 'standard',
          order: Number(g.display_order),
        }))
      : defaults.galleryPhotos;

    this.currentConfig = {
      heroCarousel,
      rotateIntervalMs: Math.max(1500, Number(conf.rotate_interval_ms) || 4000),
      backgroundImage: {
        src: conf.background_src || defaults.backgroundImage.src,
        opacity: Number(conf.background_opacity ?? defaults.backgroundImage.opacity),
        blurPx: Number(conf.background_blur_px ?? defaults.backgroundImage.blurPx),
        title: conf.background_title || defaults.backgroundImage.title,
      },
      backdropSlides,
      galleryPhotos,
      lastUpdatedBy: conf.last_updated_by || 'Administrator',
      lastUpdatedAt: conf.updated_at ? new Date(conf.updated_at).toISOString() : new Date().toISOString(),
    };
    this.saveToFileFallback();
  }

  private async persistToDatabase(config: LandingMediaConfig): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        `INSERT INTO landing_media_config
          (id, rotate_interval_ms, background_src, background_opacity, background_blur_px, background_title, last_updated_by, updated_at)
         VALUES (:id, :rotate_interval_ms, :background_src, :background_opacity, :background_blur_px, :background_title, :last_updated_by, :updated_at)
         ON DUPLICATE KEY UPDATE
           rotate_interval_ms = VALUES(rotate_interval_ms),
           background_src = VALUES(background_src),
           background_opacity = VALUES(background_opacity),
           background_blur_px = VALUES(background_blur_px),
           background_title = VALUES(background_title),
           last_updated_by = VALUES(last_updated_by),
           updated_at = VALUES(updated_at)`,
        {
          id: 'main',
          rotate_interval_ms: config.rotateIntervalMs,
          background_src: config.backgroundImage.src,
          background_opacity: config.backgroundImage.opacity,
          background_blur_px: config.backgroundImage.blurPx,
          background_title: config.backgroundImage.title || 'TUM Main Entrance Gate Monument',
          last_updated_by: config.lastUpdatedBy || 'Administrator',
          updated_at: new Date(),
        }
      );

      await connection.query('DELETE FROM landing_media_slides');
      for (const slide of config.heroCarousel) {
        await connection.query(
          `INSERT INTO landing_media_slides (id, src, caption, eyebrow, is_active, display_order)
           VALUES (:id, :src, :caption, :eyebrow, :is_active, :display_order)`,
          {
            id: slide.id,
            src: slide.src,
            caption: slide.caption,
            eyebrow: slide.eyebrow,
            is_active: slide.active ? 1 : 0,
            display_order: slide.order,
          }
        );
      }

      await connection.query('DELETE FROM landing_media_backdrops');
      for (const backdrop of config.backdropSlides) {
        await connection.query(
          `INSERT INTO landing_media_backdrops (id, src, title, is_active, display_order)
           VALUES (:id, :src, :title, :is_active, :display_order)`,
          {
            id: backdrop.id,
            src: backdrop.src,
            title: backdrop.title,
            is_active: backdrop.active ? 1 : 0,
            display_order: backdrop.order,
          }
        );
      }

      await connection.query('DELETE FROM landing_media_gallery');
      for (const photo of config.galleryPhotos) {
        await connection.query(
          `INSERT INTO landing_media_gallery (id, src, alt, caption, span, display_order)
           VALUES (:id, :src, :alt, :caption, :span, :display_order)`,
          {
            id: photo.id,
            src: photo.src,
            alt: photo.alt || 'TUMCU Community',
            caption: photo.caption || null,
            span: photo.span || 'standard',
            display_order: photo.order,
          }
        );
      }

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      logger.error({ err }, 'Landing media database transaction rolled back');
      throw err;
    } finally {
      connection.release();
    }
  }

  private saveToFileFallback(): void {
    try {
      fs.writeFileSync(this.dataFilePath, JSON.stringify(this.currentConfig, null, 2), 'utf-8');
    } catch (err) {
      logger.warn({ err }, 'Failed to save landing media local fallback');
    }
  }

  public getMedia(): LandingMediaConfig {
    return this.currentConfig;
  }

  public async updateMedia(updates: Partial<LandingMediaConfig>, actorName?: string): Promise<LandingMediaConfig> {
    const defaults = cloneDefaults();
    const heroCarousel = Array.isArray(updates.heroCarousel)
      ? updates.heroCarousel.map((slide, idx) => ({
          id: slide.id || `slide-${idx + 1}`,
          src: slide.src || '',
          caption: slide.caption || 'Community Moment',
          eyebrow: slide.eyebrow || 'TUMCU Ministry',
          active: slide.active !== false,
          order: idx + 1,
        }))
      : this.currentConfig.heroCarousel;
    const backdropSlides = Array.isArray(updates.backdropSlides)
      ? updates.backdropSlides.map((slide, idx) => ({
          id: slide.id || `backdrop-${idx + 1}`,
          src: slide.src || '',
          title: slide.title || `Backdrop Photo ${idx + 1}`,
          active: slide.active !== false,
          order: idx + 1,
        }))
      : this.currentConfig.backdropSlides;
    const galleryPhotos = Array.isArray(updates.galleryPhotos)
      ? updates.galleryPhotos.map((photo, idx) => ({
          id: photo.id || `gal-${idx + 1}`,
          src: photo.src || '',
          alt: photo.alt || 'TUMCU Community',
          caption: photo.caption,
          span: photo.span || (idx === 0 ? 'featured' : 'standard'),
          order: idx + 1,
        }))
      : this.currentConfig.galleryPhotos;

    if (!backdropSlides.length) throw new Error('At least one landing backdrop image is required.');

    const backgroundImage: LandingBackgroundConfig = {
      ...this.currentConfig.backgroundImage,
      ...(updates.backgroundImage || {}),
    };
    const rotateIntervalMs = typeof updates.rotateIntervalMs === 'number' && updates.rotateIntervalMs >= 1500
      ? Math.round(updates.rotateIntervalMs)
      : this.currentConfig.rotateIntervalMs || defaults.rotateIntervalMs;

    const candidate: LandingMediaConfig = {
      heroCarousel,
      rotateIntervalMs,
      backgroundImage,
      backdropSlides,
      galleryPhotos,
      lastUpdatedBy: actorName || this.currentConfig.lastUpdatedBy || 'Administrator',
      lastUpdatedAt: new Date().toISOString(),
    };

    await this.persistToDatabase(candidate);
    this.currentConfig = candidate;
    this.saveToFileFallback();
    return this.currentConfig;
  }

  public uploadImage(rawInput: string, originalFilename = 'media-photo.jpg'): { url: string; filename: string } {
    if (!rawInput || typeof rawInput !== 'string') throw new Error('Image data is required.');

    let base64String = rawInput;
    let extension = '.jpg';
    let mime = 'image/jpeg';
    const match = rawInput.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/i);
    if (match) {
      mime = match[1].toLowerCase();
      base64String = match[2];
      extension = mime.includes('png') ? '.png' : mime.includes('webp') ? '.webp' : '.jpg';
    } else {
      const ext = path.extname(originalFilename).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        throw new Error('Only JPG, PNG and WEBP images are allowed.');
      }
      extension = ext === '.jpeg' ? '.jpg' : ext;
    }

    const buffer = Buffer.from(base64String, 'base64');
    if (!buffer.length) throw new Error('Invalid image data.');
    if (buffer.length > 8 * 1024 * 1024) throw new Error('Image is too large. Maximum size is 8 MB.');

    const sanitizedBase = path.basename(originalFilename, path.extname(originalFilename))
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32);
    const safeFilename = `tumcu-${Date.now()}-${sanitizedBase || 'image'}${extension}`;
    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
    fs.mkdirSync(uploadsDir, { recursive: true });
    fs.writeFileSync(path.join(uploadsDir, safeFilename), buffer);

    return { url: `/uploads/${safeFilename}`, filename: safeFilename };
  }

  public async resetToDefault(actorName?: string): Promise<LandingMediaConfig> {
    const candidate = {
      ...cloneDefaults(),
      lastUpdatedBy: actorName || 'Administrator',
      lastUpdatedAt: new Date().toISOString(),
    };
    await this.persistToDatabase(candidate);
    this.currentConfig = candidate;
    this.saveToFileFallback();
    return this.currentConfig;
  }
}

export const landingMediaService = new LandingMediaService();
