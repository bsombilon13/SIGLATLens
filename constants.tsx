
import { Filter } from './types';

export const FILTERS: Filter[] = [
  { id: 'none', name: 'Normal', cssClass: '' },
  { id: 'grayscale', name: 'Mono', cssClass: 'grayscale' },
  { id: 'sepia', name: 'Retro', cssClass: 'sepia' },
  { id: 'warm', name: 'Warm', cssClass: 'brightness-110 contrast-90 saturate-150 sepia-[0.2]' },
  { id: 'cool', name: 'Cool', cssClass: 'brightness-105 contrast-105 hue-rotate-[15deg] saturate-125' },
  { id: 'vibrant', name: 'Vibrant', cssClass: 'saturate-200 contrast-110' },
  { id: 'noir', name: 'Noir', cssClass: 'grayscale contrast-[1.4] brightness-75' },
  { id: 'dramatic', name: 'Drama', cssClass: 'contrast-[1.2] brightness-90 saturate-[0.8]' },
];

export const LAYOUT_CONFIGS = {
  single: { count: 1, cols: 1, rows: 1 },
  grid2x2: { count: 4, cols: 2, rows: 2 },
  strip4: { count: 4, cols: 1, rows: 4 },
};
