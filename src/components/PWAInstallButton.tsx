import React, { useState } from 'react';
import { Download, CheckCircle2, Share2, Smartphone, Monitor } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'primary' | 'outline' | 'pill' | 'minimal';
  showInstalledBadge?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'primary',
  showInstalledBadge = false,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);

  if (isInstalled) {
    if (!showInstalledBadge) return null;
    return (
      <div className={`inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200/80 ${className}`}>
        <CheckCircle2 size={14} className="text-emerald-600" />
        <span>App Installed</span>
      </div>
    );
  }

  // Common styling variants
  let buttonClasses = '';
  if (variant === 'primary') {
    buttonClasses = 'inline-flex items-center gap-2 rounded-xl bg-[#006633] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#005229] transition active:scale-95';
  } else if (variant === 'pill') {
    buttonClasses = 'inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-[#006633] hover:bg-emerald-100 transition active:scale-95';
  } else if (variant === 'outline') {
    buttonClasses = 'inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95';
  } else {
    buttonClasses = 'inline-flex items-center gap-1.5 text-xs font-bold text-[#006633] hover:underline';
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowDesktopGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`${buttonClasses} ${className}`}
        title="Install TECUMP as a Web App"
      >
        <Download size={14} className="shrink-0" />
        <span>Download App</span>
      </button>

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-[#006633]">
                <Smartphone size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Install on iPhone / iPad</h3>
                <p className="text-xs text-slate-500">Add to your Home Screen in 2 steps</p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600 bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div className="flex items-start gap-2.5">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#006633] text-[10px] font-bold text-white">
                  1
                </span>
                <p>
                  Tap the <strong className="text-slate-900 inline-flex items-center gap-1"><Share2 size={12} /> Share</strong> button in your Safari navigation bar.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#006633] text-[10px] font-bold text-white">
                  2
                </span>
                <p>
                  Scroll down the share sheet and tap <strong className="text-slate-900">Add to Home Screen</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Desktop / Browser Guide Modal */}
      {showDesktopGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-[#006633]">
                <Monitor size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Install TECUMP Web App</h3>
                <p className="text-xs text-slate-500">Run as a standalone desktop application</p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600 bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div className="flex items-start gap-2.5">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#006633] text-[10px] font-bold text-white">
                  1
                </span>
                <p>
                  Look for the <strong className="text-slate-900">Install icon</strong> (computer with a downward arrow) in your browser address bar (top right).
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#006633] text-[10px] font-bold text-white">
                  2
                </span>
                <p>
                  Alternatively, click browser menu (<strong>⋮</strong> or <strong>⋯</strong>) &rarr; <strong className="text-slate-900">Save and share / Install TECUMP</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDesktopGuide(false)}
              className="mt-5 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
