import { Filter, AspectRatio } from './types';

export const FILTERS: Filter[] = [
  { id: 'none', name: 'Normal', cssClass: '' },
  { id: 'arctic', name: 'Arctic', cssClass: 'sepia-[40%] hue-rotate-[170deg] saturate-50 brightness-110' },
  { id: 'grayscale', name: 'Mono', cssClass: 'grayscale' },
  { id: 'sepia', name: 'Retro', cssClass: 'sepia' },
  { id: 'warm', name: 'Warm', cssClass: 'brightness-110 contrast-90 saturate-150 sepia-[20%]' },
  { id: 'cool', name: 'Cool', cssClass: 'brightness-105 contrast-105 hue-rotate-[15deg] saturate-125' },
  { id: 'vibrant', name: 'Vibrant', cssClass: 'saturate-200 contrast-110' },
  { id: 'noir', name: 'Noir', cssClass: 'grayscale contrast-[1.4] brightness-75' },
  { id: 'dramatic', name: 'Drama', cssClass: 'contrast-[1.2] brightness-90 saturate-[0.8]' },
  { id: 'emerald', name: 'Emerald', cssClass: 'hue-rotate-[140deg] saturate-150 contrast-110' },
  { id: 'rose', name: 'Rose', cssClass: 'hue-rotate-[320deg] saturate-120 brightness-110' },
  { id: 'cyber', name: 'Cyber', cssClass: 'hue-rotate-[240deg] saturate-200 brightness-105 contrast-125' },
  { id: 'film', name: 'Film', cssClass: 'sepia-[15%] contrast-90 brightness-105 saturate-[0.8]' },
];

export const LAYOUT_CONFIGS = {
  single: { count: 1, cols: 1, rows: 1 },
  grid2x2: { count: 4, cols: 2, rows: 2 },
  strip4: { count: 4, cols: 1, rows: 4 },
};

export const ASPECT_RATIOS: { id: AspectRatio, label: string, value: number }[] = [
  { id: '1:1', label: 'Square', value: 1 },
  { id: '3:4', label: 'Classic', value: 3/4 },
  { id: '4:5', label: 'Portrait', value: 4/5 },
  { id: '9:16', label: 'Story', value: 9/16 },
];