
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LayoutType, CapturedPhoto, Filter, Overlay } from './types';
import { FILTERS, LAYOUT_CONFIGS } from './constants';
import { CameraIcon, LayoutIcon, RefreshIcon, FilterIcon, DownloadIcon, TimerIcon } from './components/Icons';
import { getSmartCaption } from './services/geminiService';

const STICKERS = ['✨', '❤️', '🔥', '📸', '✌️', '😎', '🎉', '🌟', '🌈', '💎', '🎨', '🍕', '🐱', '🦋', '⚡️', '🦄'];
const TIMER_OPTIONS = [0, 3, 5, 10];

interface GestureState {
  initialDistance: number;
  initialAngle: number;
  initialSize: number;
  initialRotation: number;
}

const App: React.FC = () => {
  const [view, setView] = useState<'camera' | 'preview'>('camera');
  const [layout, setLayout] = useState<LayoutType>('grid2x2');
  const [activeFilter, setActiveFilter] = useState<Filter>(FILTERS[0]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [countdownDuration, setCountdownDuration] = useState<number>(3);
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showTimerMenu, setShowTimerMenu] = useState(false);
  const [showDecorationMenu, setShowDecorationMenu] = useState(false);
  const [aiCaption, setAiCaption] = useState<string | null>(null);
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [activeOverlayId, setActiveOverlayId] = useState<string | null>(null);
  
  const gestureRef = useRef<GestureState | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const initCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user', 
          width: { ideal: 1080 }, 
          height: { ideal: 1920 },
          aspectRatio: { ideal: 0.75 } // 3:4
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      alert("Please allow camera access to use the photobooth.");
    }
  }, []);

  useEffect(() => {
    if (view === 'camera') {
      initCamera();
    }
    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, [view, initCamera]);

  const getCanvasFilterString = (filterId: string) => {
    switch (filterId) {
      case 'grayscale': return 'grayscale(100%)';
      case 'sepia': return 'sepia(100%)';
      case 'warm': return 'brightness(110%) contrast(90%) saturate(150%) sepia(20%)';
      case 'cool': return 'brightness(105%) contrast(105%) hue-rotate(15deg) saturate(125%)';
      case 'vibrant': return 'saturate(200%) contrast(110%)';
      case 'noir': return 'grayscale(100%) contrast(140%) brightness(75%)';
      case 'dramatic': return 'contrast(120%) brightness(90%) saturate(80%)';
      default: return 'none';
    }
  };

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        const targetRatio = 3 / 4;
        let sourceWidth = video.videoWidth;
        let sourceHeight = video.videoHeight;
        let sourceX = 0;
        let sourceY = 0;

        const currentRatio = sourceWidth / sourceHeight;
        if (currentRatio > targetRatio) {
          const newWidth = sourceHeight * targetRatio;
          sourceX = (sourceWidth - newWidth) / 2;
          sourceWidth = newWidth;
        } else {
          const newHeight = sourceWidth / targetRatio;
          sourceY = (sourceHeight - newHeight) / 2;
          sourceHeight = newHeight;
        }

        canvas.width = 1200;
        canvas.height = 1600;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.filter = getCanvasFilterString(activeFilter.id);
        
        context.save();
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
        context.restore();
        
        context.filter = 'none';
        
        const dataUrl = canvas.toDataURL('image/png');
        setPhotos(prev => [...prev, { id: Date.now().toString(), dataUrl, filterId: activeFilter.id }]);
        return dataUrl;
      }
    }
    return null;
  }, [activeFilter]);

  const startPhotoboothSession = async () => {
    setIsCapturing(true);
    setPhotos([]);
    setOverlays([]);
    const requiredPhotos = LAYOUT_CONFIGS[layout].count;

    for (let i = 0; i < requiredPhotos; i++) {
      if (countdownDuration > 0) {
        for (let c = countdownDuration; c > 0; c--) {
          setCountdown(c);
          await new Promise(r => setTimeout(r, 1000));
        }
      }
      setCountdown(null);
      const flash = document.createElement('div');
      flash.className = 'fixed inset-0 bg-white z-[100] animate-pulse';
      document.body.appendChild(flash);
      setTimeout(() => flash.remove(), 150);
      capturePhoto();
      await new Promise(r => setTimeout(r, 1000));
    }
    setIsCapturing(false);
    setView('preview');
  };

  useEffect(() => {
    if (view === 'preview' && photos.length > 0) {
      getSmartCaption(photos[0].dataUrl).then(setAiCaption);
    }
  }, [view, photos]);

  const addSticker = (sticker: string) => {
    const newOverlay: Overlay = {
      id: Date.now().toString(),
      type: 'sticker',
      content: sticker,
      x: 50,
      y: 50,
      size: 64,
      rotation: 0,
    };
    setOverlays([...overlays, newOverlay]);
    setShowDecorationMenu(false);
  };

  const addText = () => {
    const text = prompt("Enter text overlay:");
    if (text) {
      const newOverlay: Overlay = {
        id: Date.now().toString(),
        type: 'text',
        content: text,
        x: 50,
        y: 80,
        size: 32,
        rotation: 0,
        color: '#000000',
      };
      setOverlays([...overlays, newOverlay]);
    }
    setShowDecorationMenu(false);
  };

  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    setActiveOverlayId(id);
    const overlay = overlays.find(o => o.id === id);
    if (!overlay) return;

    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      const angle = Math.atan2(touch2.clientY - touch1.clientY, touch2.clientX - touch1.clientX);
      
      gestureRef.current = {
        initialDistance: dist,
        initialAngle: angle,
        initialSize: overlay.size,
        initialRotation: overlay.rotation
      };
    } else {
      gestureRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent, id: string) => {
    if (!previewRef.current) return;
    const overlay = overlays.find(o => o.id === id);
    if (!overlay) return;

    if (e.touches.length === 2 && gestureRef.current) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      const currentAngle = Math.atan2(touch2.clientY - touch1.clientY, touch2.clientX - touch1.clientX);
      
      const scale = currentDist / gestureRef.current.initialDistance;
      const angleDelta = (currentAngle - gestureRef.current.initialAngle) * (180 / Math.PI);
      
      setOverlays(prev => prev.map(o => o.id === id ? {
        ...o,
        size: Math.max(16, Math.min(300, gestureRef.current!.initialSize * scale)),
        rotation: gestureRef.current!.initialRotation + angleDelta
      } : o));
    } else if (e.touches.length === 1) {
      const rect = previewRef.current.getBoundingClientRect();
      const x = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
      const y = ((e.touches[0].clientY - rect.top) / rect.height) * 100;
      
      setOverlays(prev => prev.map(o => o.id === id ? {
        ...o,
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y))
      } : o));
    }
  };

  const handleDownload = () => {
    const resultCanvas = document.createElement('canvas');
    const ctx = resultCanvas.getContext('2d');
    if (!ctx || photos.length === 0) return;

    const config = LAYOUT_CONFIGS[layout];
    const imgWidth = 900;
    const imgHeight = 1200;
    const padding = 60;
    const brandingHeight = 200;
    
    resultCanvas.width = (imgWidth * config.cols) + (padding * (config.cols + 1));
    resultCanvas.height = (imgHeight * config.rows) + (padding * (config.rows + 1)) + brandingHeight;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);

    let loadedCount = 0;
    photos.forEach((photo, index) => {
      const col = index % config.cols;
      const row = Math.floor(index / config.cols);
      const x = padding + (col * (imgWidth + padding));
      const y = padding + (row * (imgHeight + padding));

      const img = new Image();
      img.src = photo.dataUrl;
      img.onload = () => {
        ctx.drawImage(img, x, y, imgWidth, imgHeight);
        loadedCount++;
        if (loadedCount === photos.length) {
          ctx.fillStyle = '#de4928'; // Use theme color for branding on print
          ctx.font = 'italic bold 42px Plus Jakarta Sans';
          ctx.textAlign = 'center';
          ctx.fillText(aiCaption || "SIGLATLens Moment", resultCanvas.width / 2, resultCanvas.height - 110);
          
          ctx.fillStyle = '#888';
          ctx.font = '500 24px Plus Jakarta Sans';
          ctx.fillText(new Date().toLocaleDateString() + " • SIGLATLens", resultCanvas.width / 2, resultCanvas.height - 60);

          overlays.forEach(overlay => {
            const canvasX = (overlay.x / 100) * resultCanvas.width;
            const canvasY = (overlay.y / 100) * (resultCanvas.height - brandingHeight);
            
            ctx.save();
            ctx.translate(canvasX, canvasY);
            ctx.rotate((overlay.rotation * Math.PI) / 180);
            
            if (overlay.type === 'sticker') {
              ctx.font = `${overlay.size * 2.5}px Arial`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(overlay.content, 0, 0);
            } else {
              ctx.font = `bold ${overlay.size * 2}px Plus Jakarta Sans`;
              ctx.fillStyle = overlay.color || '#000000';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(overlay.content, 0, 0);
            }
            ctx.restore();
          });

          const link = document.createElement('a');
          link.download = `siglat-lens-${Date.now()}.png`;
          link.href = resultCanvas.toDataURL('image/png', 1.0);
          link.click();
        }
      };
    });
  };

  const reset = () => {
    setPhotos([]);
    setOverlays([]);
    setView('camera');
    setAiCaption(null);
  };

  const closeMenus = () => {
    setShowLayoutMenu(false);
    setShowFilterMenu(false);
    setShowTimerMenu(false);
    setShowDecorationMenu(false);
    setActiveOverlayId(null);
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden relative">
      {/* Header with SIGLAT Branding */}
      <div className="flex items-center justify-between px-6 py-5 z-10 bg-gradient-to-b from-black/60 to-transparent">
        <h1 className="text-2xl font-extrabold tracking-tighter">
          <span className="text-theme-gradient">SIGLAT</span><span className="text-white/90">Lens</span>
        </h1>
        {view === 'preview' && (
          <button onClick={reset} className="p-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-full active:scale-95 transition-all">
            <RefreshIcon />
          </button>
        )}
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {view === 'camera' ? (
          <div className="w-full h-full relative overflow-hidden bg-neutral-900 flex items-center justify-center">
            <div className={`relative w-full h-full transition-all duration-300 ${activeFilter.cssClass}`}>
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
            </div>
            {/* Camera Guides */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full aspect-[3/4] border border-white/20 shadow-[0_0_0_100vmax_rgba(0,0,0,0.6)]"></div>
            </div>
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                <span className="text-[12rem] font-black text-theme-gradient drop-shadow-[0_0_30px_rgba(222,73,40,0.5)] animate-ping">{countdown}</span>
              </div>
            )}
            {isCapturing && (
              <div className="absolute top-6 left-6 bg-theme-gradient px-4 py-1.5 rounded-full flex items-center gap-2 animate-pulse z-20 shadow-theme">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white">Shot {photos.length + 1} / {LAYOUT_CONFIGS[layout].count}</span>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        ) : (
          <div className="w-full h-full overflow-y-auto px-6 py-8 pb-48 flex flex-col items-center">
            <div 
              ref={previewRef}
              className={`relative grid gap-3 p-6 bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] rounded-2xl animate-zoom-out ${
                layout === 'strip4' ? 'grid-cols-1 w-64' : layout === 'single' ? 'grid-cols-1 w-72' : 'grid-cols-2 max-w-sm'
              }`}
            >
              {photos.map((p, idx) => (
                <div key={p.id} className={`relative aspect-[3/4] bg-neutral-100 overflow-hidden rounded-lg opacity-0 animate-zoom-out stagger-${idx + 1}`}>
                  <img src={p.dataUrl} className="w-full h-full object-cover" alt="Captured" />
                  <div className="absolute top-2 left-2 bg-theme-gradient text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-md">{idx+1}</div>
                </div>
              ))}
              
              {overlays.map((o) => (
                <div
                  key={o.id}
                  className={`absolute select-none p-4 touch-none z-50 flex items-center justify-center ${activeOverlayId === o.id ? 'ring-2 ring-[#de4928] rounded-2xl bg-black/5 backdrop-blur-[2px]' : ''}`}
                  style={{
                    left: `${o.x}%`,
                    top: `${o.y}%`,
                    transform: `translate(-50%, -50%) rotate(${o.rotation}deg)`,
                    fontSize: `${o.size}px`,
                    color: o.color || '#000',
                    fontWeight: o.type === 'text' ? 'bold' : 'normal',
                    lineHeight: 1
                  }}
                  onTouchStart={(e) => handleTouchStart(e, o.id)}
                  onTouchMove={(e) => handleTouchMove(e, o.id)}
                >
                  <span className="pointer-events-none">{o.content}</span>
                  {activeOverlayId === o.id && (
                    <div 
                      className="absolute -top-4 -right-4 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-lg shadow-lg active:scale-75 transition-transform"
                      onClick={(e) => { e.stopPropagation(); setOverlays(overlays.filter(item => item.id !== o.id)); }}
                    >✕</div>
                  )}
                </div>
              ))}
            </div>
            {aiCaption && (
              <div className="mt-12 text-center animate-zoom-out stagger-4 opacity-0 max-w-xs">
                <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-4">SIGLATLens AI Vision</p>
                <p className="text-2xl font-serif italic text-white/90 leading-relaxed font-semibold">"{aiCaption}"</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modern Glassmorphic Menus */}
      {showLayoutMenu && (
        <div className="absolute bottom-36 left-6 right-6 bg-neutral-900/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 grid grid-cols-3 gap-4 z-40 animate-in fade-in slide-in-from-bottom-8 duration-500 shadow-2xl">
          {(Object.keys(LAYOUT_CONFIGS) as LayoutType[]).map((key) => (
            <button key={key} onClick={() => { setLayout(key); setShowLayoutMenu(false); }} className={`flex flex-col items-center gap-3 p-4 rounded-[2rem] transition-all ${layout === key ? 'bg-theme-gradient shadow-theme' : 'hover:bg-white/5 bg-white/5'}`}>
              <div className={`grid gap-1 w-12 h-12 ${key === 'strip4' ? 'grid-cols-1' : key === 'grid2x2' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {Array.from({ length: LAYOUT_CONFIGS[key].count }).map((_, i) => (
                  <div key={i} className={`bg-white/40 border border-white/20 rounded-sm ${key === 'single' ? 'w-full h-full' : ''}`}></div>
                ))}
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest leading-none">{key === 'single' ? '1 Shot' : key === 'grid2x2' ? 'Classic 4' : 'Strip'}</span>
            </button>
          ))}
        </div>
      )}

      {showFilterMenu && (
        <div className="absolute bottom-36 left-0 right-0 z-40 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="flex gap-4 overflow-x-auto px-6 pb-8 no-scrollbar">
            {FILTERS.map((f) => (
              <button 
                key={f.id} 
                onClick={() => setActiveFilter(f)} 
                className={`flex-shrink-0 flex flex-col items-center gap-3 transition-all group ${activeFilter.id === f.id ? 'scale-110' : 'opacity-40'}`}
              >
                <div className={`w-20 h-20 rounded-3xl border-2 overflow-hidden transition-all shadow-xl ${activeFilter.id === f.id ? 'border-[#eb841e]' : 'border-white/10 group-hover:border-white/30'}`}>
                   {photos.length > 0 ? (
                      <img src={photos[0].dataUrl} className={`w-full h-full object-cover ${f.cssClass}`} />
                   ) : (
                      <div className={`w-full h-full bg-neutral-800 flex items-center justify-center ${f.cssClass}`}><div className="w-10 h-10 border-2 border-white/10 rounded-full"></div></div>
                   )}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">{f.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {showTimerMenu && (
        <div className="absolute bottom-36 left-6 right-6 bg-neutral-900/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 flex justify-around items-center z-40 animate-in fade-in slide-in-from-bottom-8 duration-500 shadow-2xl">
          {TIMER_OPTIONS.map((val) => (
            <button
              key={val}
              onClick={() => { setCountdownDuration(val); setShowTimerMenu(false); }}
              className={`flex flex-col items-center gap-2 p-5 rounded-[2rem] transition-all min-w-[70px] ${countdownDuration === val ? 'bg-theme-gradient shadow-theme' : 'hover:bg-white/5 bg-white/5'}`}
            >
              <span className="text-xl font-extrabold">{val}s</span>
              <span className="text-[8px] uppercase tracking-widest opacity-60 font-bold">{val === 0 ? 'Off' : 'Wait'}</span>
            </button>
          ))}
        </div>
      )}

      {showDecorationMenu && (
        <div className="absolute bottom-52 left-6 right-6 bg-neutral-900/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 z-40 animate-in fade-in slide-in-from-bottom-8 duration-500 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Props & Decor</h3>
            <button onClick={addText} className="text-[10px] font-bold uppercase bg-theme-gradient px-4 py-2 rounded-full shadow-theme">+ Add Caption</button>
          </div>
          <div className="grid grid-cols-6 gap-4 max-h-48 overflow-y-auto pr-2 no-scrollbar">
            {STICKERS.map(s => (
              <button key={s} onClick={() => addSticker(s)} className="text-3xl p-3 hover:bg-white/10 rounded-2xl transition-all active:scale-90">{s}</button>
            ))}
          </div>
        </div>
      )}

      {/* Main Control Bar */}
      <div className="safe-area-bottom bg-neutral-900/90 backdrop-blur-3xl border-t border-white/5 px-4 pt-6 pb-12 flex items-center justify-between gap-3 z-30">
        {view === 'camera' ? (
          <>
            <button onClick={() => { setShowLayoutMenu(!showLayoutMenu); setShowFilterMenu(false); setShowTimerMenu(false); }} className={`p-4 rounded-3xl transition-all active:scale-90 ${showLayoutMenu ? 'bg-theme-gradient shadow-theme' : 'bg-white/5 border border-white/10'}`} disabled={isCapturing}><LayoutIcon /></button>
            <button onClick={() => { setShowTimerMenu(!showTimerMenu); setShowLayoutMenu(false); setShowFilterMenu(false); }} className={`p-4 rounded-3xl transition-all active:scale-90 ${showTimerMenu ? 'bg-theme-gradient shadow-theme' : 'bg-white/5 border border-white/10'}`} disabled={isCapturing}><TimerIcon /></button>
            
            {/* Capture Button with Theme Ring */}
            <button onClick={startPhotoboothSession} disabled={isCapturing} className="relative w-24 h-24 rounded-full bg-white flex items-center justify-center active:scale-90 transition-all shadow-2xl disabled:opacity-50">
              <div className="w-20 h-20 rounded-full border-[6px] border-black/5 bg-white"></div>
              {isCapturing && (
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="48" cy="48" r="45" stroke="url(#themeGradient)" strokeWidth="6" fill="transparent" strokeDasharray={283} strokeDashoffset={283 - (283 * photos.length) / LAYOUT_CONFIGS[layout].count} style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                  <defs>
                    <linearGradient id="themeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#de4928" />
                      <stop offset="100%" stopColor="#eb841e" />
                    </linearGradient>
                  </defs>
                </svg>
              )}
            </button>

            <button onClick={() => { setShowFilterMenu(!showFilterMenu); setShowLayoutMenu(false); setShowTimerMenu(false); }} className={`p-4 rounded-3xl transition-all active:scale-90 ${showFilterMenu ? 'bg-theme-gradient shadow-theme' : 'bg-white/5 border border-white/10'}`} disabled={isCapturing}><FilterIcon /></button>
            <div className="w-4"></div> {/* Spacer */}
          </>
        ) : (
          <div className="w-full flex flex-col gap-4 px-2">
            <div className="flex gap-3 w-full">
              <button onClick={() => setShowDecorationMenu(!showDecorationMenu)} className={`flex-1 flex items-center justify-center gap-2 py-5 rounded-[1.75rem] font-bold text-sm transition-all ${showDecorationMenu ? 'bg-white text-black' : 'bg-white/10 border border-white/10'}`}>
                ✨ Decorate
              </button>
              <button onClick={handleDownload} className="flex-[2] bg-theme-gradient text-white font-bold py-5 rounded-[1.75rem] flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-theme">
                <DownloadIcon /> Save Digital Print
              </button>
            </div>
            <button onClick={reset} className="w-full py-4 rounded-[1.5rem] text-[10px] font-extrabold tracking-[0.25em] uppercase opacity-40 hover:opacity-100 transition-all">Retake Session</button>
          </div>
        )}
      </div>

      {/* Menu Overlay */}
      {(showLayoutMenu || showFilterMenu || showTimerMenu || showDecorationMenu) && (
        <div className="fixed inset-0 z-20 bg-black/60 backdrop-blur-md" onClick={closeMenus} />
      )}
    </div>
  );
};

export default App;
