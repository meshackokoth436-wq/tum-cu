import { useEffect, useState } from 'react';
import { ArrowRight, Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { HeroSlide } from '@/features/landing-media/landing-media.api';
import photo1 from '@/assets/community/community-1.jpg';
import photo2 from '@/assets/community/community-2.jpg';
import photo3 from '@/assets/community/community-3.jpg';
import photo4 from '@/assets/community/community-4.jpg';
import photo5 from '@/assets/community/community-5.jpg';

const DEFAULT_SLIDES: HeroSlide[] = [
  { id: 'slide-1', src: photo1, caption: 'Prayer & Reflection', eyebrow: 'A people who seek God', active: true, order: 1 },
  { id: 'slide-2', src: photo2, caption: 'Worship in Unity', eyebrow: 'One family. One faith.', active: true, order: 2 },
  { id: 'slide-3', src: photo3, caption: 'Fellowship & Community', eyebrow: 'Growing together', active: true, order: 3 },
  { id: 'slide-4', src: photo4, caption: 'Worship through Music', eyebrow: 'Gifts offered to God', active: true, order: 4 },
  { id: 'slide-5', src: photo5, caption: 'A Community that Serves', eyebrow: 'Faith becoming action', active: true, order: 5 },
];

interface HeroCarouselProps {
  slides?: HeroSlide[];
  rotateIntervalMs?: number;
}

export function HeroCarousel({ slides, rotateIntervalMs = 4000 }: HeroCarouselProps) {
  const activeSlides = (slides && slides.length > 0)
    ? slides.filter((s) => s.active !== false)
    : DEFAULT_SLIDES;

  const displaySlides = activeSlides.length > 0 ? activeSlides : DEFAULT_SLIDES;

  const [index, setIndex] = useState(0);

  // Keep index within bounds if slide count changes
  useEffect(() => {
    if (index >= displaySlides.length) {
      setIndex(0);
    }
  }, [displaySlides.length, index]);

  useEffect(() => {
    if (displaySlides.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % displaySlides.length);
    }, Math.max(2000, rotateIntervalMs));

    return () => window.clearInterval(timer);
  }, [displaySlides.length, rotateIntervalMs]);

  const active = displaySlides[index] || displaySlides[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((curr) => (curr - 1 + displaySlides.length) % displaySlides.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((curr) => (curr + 1) % displaySlides.length);
  };

  return (
    <div className="group relative mx-auto aspect-[4/3] w-full overflow-hidden rounded-[28px] bg-primary-950 shadow-2xl select-none">
      {displaySlides.map((slide, i) => (
        <img
          key={slide.id || slide.src}
          src={slide.src}
          alt={slide.caption}
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ease-out ${
            i === index ? 'scale-100 opacity-100' : 'scale-[1.04] opacity-0 pointer-events-none'
          }`}
          loading={i === 0 ? 'eager' : 'lazy'}
        />
      ))}

      {/* Ambient gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary-950/90 via-primary-950/20 to-transparent pointer-events-none" />

      {/* Manual Prev / Next arrow buttons (visible on hover) */}
      {displaySlides.length > 1 && (
        <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous slide"
            className="pointer-events-auto p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition shadow-md"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next slide"
            className="pointer-events-auto p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition shadow-md"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Bottom Content & Navigation */}
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
        <div className="flex items-end justify-between gap-4">
          <div className="text-white">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-gold-300">
              <Camera size={13} />
              {active?.eyebrow || 'TUMCU Ministry'}
            </div>
            <div className="text-2xl font-black tracking-tight sm:text-3xl line-clamp-2">
              {active?.caption || 'Growing in Christ'}
            </div>
            <div className="mt-1 text-xs text-white/70">TUMCU • Growing in Christ • Serving with Purpose</div>
          </div>

          <Link
            to="/about"
            className="hidden shrink-0 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur-md transition hover:bg-white/20 sm:inline-flex"
          >
            Our story <ArrowRight size={14} />
          </Link>
        </div>

        {/* Carousel indicator dots */}
        <div className="mt-5 flex items-center gap-2" aria-label="Photo carousel">
          {displaySlides.map((slide, i) => (
            <button
              key={slide.id || slide.caption || i}
              type="button"
              aria-label={`Show ${slide.caption}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === index ? 'w-9 bg-gold-400' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Slide counter badge */}
      <div className="absolute right-4 top-4 rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-[10px] font-bold text-white/90 backdrop-blur-md">
        {index + 1} / {displaySlides.length}
      </div>
    </div>
  );
}
