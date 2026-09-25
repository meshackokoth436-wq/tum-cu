import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Download,
  Smartphone,
  Laptop,
  CheckCircle2,
  Share2,
  ShieldCheck,
  Zap,
  WifiOff,
  Sparkles,
  ArrowRight,
  Info,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import tumcuLogo from '@/assets/tumcu-logo.png';

export function DownloadAppPage() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activePlatformTab, setActivePlatformTab] = useState<'android' | 'ios' | 'desktop'>('android');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Generate QR code for current app URL so desktop users can scan on their phone
    const appUrl = window.location.origin;
    QRCode.toDataURL(appUrl, {
      width: 220,
      margin: 2,
      color: {
        dark: '#006633',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));

    // Auto-detect platform for tab selection
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setActivePlatformTab('ios');
    } else if (/android/.test(userAgent)) {
      setActivePlatformTab('android');
    } else {
      setActivePlatformTab('desktop');
    }
  }, []);

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-800/20 bg-gradient-to-br from-[#004d26] via-[#006633] to-[#0b3d20] p-6 sm:p-10 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center md:text-left space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold backdrop-blur-md ring-1 ring-white/20">
              <Sparkles size={14} className="text-amber-300" />
              <span>Progressive Web App (PWA)</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              Install TECUMP as a Web App
            </h1>

            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
              Experience the Technical University of Mombasa Christian Union platform directly from your home screen. Fast, responsive, works offline, and requires zero storage from app stores.
            </p>

            {/* Install Call to Action */}
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
              {isInstalled ? (
                <div className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/30 backdrop-blur-md">
                  <CheckCircle2 size={18} className="text-emerald-300" />
                  <span>TECUMP is Installed & Active</span>
                </div>
              ) : isInstallable ? (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  disabled={isInstalling}
                  className="inline-flex items-center gap-2.5 rounded-2xl bg-amber-400 px-6 py-3.5 text-sm font-black text-slate-950 shadow-lg hover:bg-amber-300 transition active:scale-95 disabled:opacity-50"
                >
                  <Download size={18} className="text-slate-950" />
                  <span>{isInstalling ? 'Installing...' : 'Install App Now'}</span>
                </button>
              ) : isIOS ? (
                <div className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/30 backdrop-blur-md">
                  <Share2 size={18} className="text-amber-300" />
                  <span>Tap Safari Share &rarr; Add to Home Screen</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setActivePlatformTab('desktop')}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#006633] shadow-md hover:bg-emerald-50 transition active:scale-95"
                >
                  <Info size={16} />
                  <span>View Installation Steps Below</span>
                </button>
              )}

              <a
                href="#device-guides"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-200 hover:text-white px-3 py-2 transition"
              >
                <span>Step-by-step instructions</span>
                <ArrowRight size={13} />
              </a>
            </div>
          </div>

          {/* App Preview Card with Seal & QR Code */}
          <div className="relative shrink-0 rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-md shadow-2xl text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-white shadow-md p-1.5 ring-4 ring-white/20">
              <img src={tumcuLogo} alt="TUMCU Seal" className="h-full w-full object-contain" />
            </div>
            <h3 className="mt-3 text-sm font-black text-white">TECUMP Mobile</h3>
            <p className="text-[11px] text-emerald-200">Scan to install on phone</p>

            {qrCodeDataUrl ? (
              <div className="mt-3 rounded-xl bg-white p-2 shadow-inner inline-block">
                <img src={qrCodeDataUrl} alt="QR Code to install app" className="h-32 w-32 object-contain" />
              </div>
            ) : (
              <div className="mt-3 h-32 w-32 rounded-xl bg-white/20 animate-pulse" />
            )}

            <p className="mt-2 text-[10px] text-emerald-200 font-medium">Point your camera to scan</p>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
      </div>

      {/* Why Install as a Web App (Feature Grid) */}
      <div>
        <div className="text-center sm:text-left mb-4">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Why Install the TECUMP Web App?</h2>
          <p className="text-xs text-slate-500">The modern, official way to use Christian Union services on any device.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:border-emerald-300">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-[#006633] mb-3">
              <Zap size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Instant Access</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Launches instantly from your phone app drawer or desktop without browser bars or typing URLs.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:border-emerald-300">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-[#006633] mb-3">
              <WifiOff size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Offline Caching</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Service workers pre-cache essential resources, constitutional articles, and your membership card even without internet.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:border-emerald-300">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-[#006633] mb-3">
              <Layers size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Zero App Store Storage</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Uses less than 5 MB of storage compared to 80+ MB app store downloads. No store account required.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:border-emerald-300">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-[#006633] mb-3">
              <ShieldCheck size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Always Up to Date</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Always synchronizes with the latest TUMCU announcements, meetings, and election rosters seamlessly in the background.
            </p>
          </div>
        </div>
      </div>

      {/* Step-by-Step Installation Guides */}
      <div id="device-guides" className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-lg font-black text-slate-900">Step-by-Step Device Guides</h2>
            <p className="text-xs text-slate-500">Select your operating system or device type below</p>
          </div>

          {/* Platform Switcher Tabs */}
          <div className="flex items-center gap-1 rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setActivePlatformTab('android')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                activePlatformTab === 'android'
                  ? 'bg-white text-[#006633] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone size={14} />
              <span>Android</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePlatformTab('ios')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                activePlatformTab === 'ios'
                  ? 'bg-white text-[#006633] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone size={14} />
              <span>iPhone / iPad</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePlatformTab('desktop')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                activePlatformTab === 'desktop'
                  ? 'bg-white text-[#006633] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Laptop size={14} />
              <span>PC / Mac / Linux</span>
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="mt-6">
          {/* ANDROID GUIDE */}
          {activePlatformTab === 'android' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 rounded-xl p-3 border border-emerald-200/60">
                <Info size={16} className="shrink-0 text-[#006633]" />
                <span>Works on Google Chrome, Samsung Internet, Microsoft Edge, and Brave for Android.</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#006633] text-xs font-black text-white">
                    1
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Open in Chrome</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Navigate to this website in Google Chrome or your default Android browser.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#006633] text-xs font-black text-white">
                    2
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Tap Three Dots (⋮)</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Tap the <strong>3-dot menu</strong> in the top right corner of the Chrome toolbar.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#006633] text-xs font-black text-white">
                    3
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Select "Install App"</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>. Confirm when prompted.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* IOS GUIDE */}
          {activePlatformTab === 'ios' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 bg-amber-50 rounded-xl p-3 border border-amber-200/60">
                <Info size={16} className="shrink-0 text-amber-700" />
                <span>On iPhone and iPad, Apple requires installation via the Safari browser.</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#006633] text-xs font-black text-white">
                    1
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Open in Safari</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Ensure you are viewing this page in Apple Safari (not inside an in-app webview).
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#006633] text-xs font-black text-white">
                    2
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Tap the Share Icon</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Tap the <strong>Share button</strong> (a box with an arrow pointing upward) in the bottom navigation bar.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#006633] text-xs font-black text-white">
                    3
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">"Add to Home Screen"</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Scroll down and select <strong>"Add to Home Screen"</strong>, then tap <strong>Add</strong> in the top right.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* DESKTOP GUIDE */}
          {activePlatformTab === 'desktop' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 rounded-xl p-3 border border-emerald-200/60">
                <Info size={16} className="shrink-0 text-[#006633]" />
                <span>Compatible with Chrome, Microsoft Edge, and Brave on Windows, macOS, and Linux.</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#006633] text-xs font-black text-white">
                    1
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Address Bar Install Icon</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    In your browser address bar (top right), look for the <strong>install icon</strong> (a computer monitor with a download arrow).
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#006633] text-xs font-black text-white">
                    2
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Click "Install"</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Click the install icon or the top "Install App Now" button on this page and confirm the installation dialog.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#006633] text-xs font-black text-white">
                    3
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">Standalone Launch</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    The app now opens in its own window and appears in your Windows Start Menu, macOS Launchpad, or Linux app launcher.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Technical Specifications Footer Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5 text-xs text-slate-600">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#006633]" />
            <span className="font-bold text-slate-900">PWA Manifest & Service Worker Compliant</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
            <span>Name: TECUMP</span>
            <span>Display: Standalone</span>
            <span>Theme: #006633</span>
            <span>Offline: Supported</span>
          </div>
        </div>
      </div>
    </div>
  );
}
