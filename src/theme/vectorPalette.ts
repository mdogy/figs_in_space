export const VECTOR_COLORS = {
  primary: '#4dff73', // HUD score/lives green
  accent: '#ff67c3', // general accent
  warning: '#ffe64d',
  danger: '#ff3b3b', // game over red
  hostile: '#67c0ff', // enemy tones
  neutral: '#ffffff' // fallback/lines
} as const;

export const VECTOR_LINE_WIDTH = 2;

export type VectorColorName = keyof typeof VECTOR_COLORS;

export const getVectorColor = (name: VectorColorName = 'primary'): string => {
  return VECTOR_COLORS[name] ?? VECTOR_COLORS.primary;
};
