
export type LayoutType = 'single' | 'grid2x2' | 'strip4';
export type AppView = 'camera' | 'preview' | 'gallery';
export type AspectRatio = '1:1' | '3:4' | '4:5' | '9:16';

export interface Filter {
  id: string;
  name: string;
  cssClass: string;
}

export interface CapturedPhoto {
  id: string;
  dataUrl: string;
  filterId: string;
}

export interface GalleryItem {
  id: string;
  dataUrl: string;
  timestamp: number;
}

export interface Overlay {
  id: string;
  type: 'sticker' | 'text';
  content: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  size: number;
  rotation: number;
  color?: string;
}

export interface PhotoboothState {
  isCapturing: boolean;
  countdown: number | null;
  photos: CapturedPhoto[];
  layout: LayoutType;
  activeFilter: string;
  aiCaption: string | null;
  overlays: Overlay[];
}
