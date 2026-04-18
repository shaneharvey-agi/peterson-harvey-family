// lib/design-tokens.ts
export const tokens = {
  bg: '#07090F',
  gold: '#C4A050',
  goldGlow: 'rgba(196, 160, 80, 0.4)',
  red: '#E24B4A',

  shane: '#378ADD',
  molly: '#7F77DD',
  evey:  '#D4537E',
  jax:   '#639922',

  shaneBg: '#0F1F38',
  mollyBg: '#2A1B3D',
  eveyBg:  '#3D1B2B',
  jaxBg:   '#1F3017',

  shaneText: '#85B7EB',
  mollyText: '#AFA9EC',
  eveyText:  '#ED93B1',
  jaxText:   '#97C459',
} as const;

export type FamilyMember = 'shane' | 'molly' | 'evey' | 'jax';

export function familyColor(m: FamilyMember): string { return tokens[m]; }
export function familyBg(m: FamilyMember): string { return tokens[`${m}Bg` as const]; }
export function familyText(m: FamilyMember): string { return tokens[`${m}Text` as const]; }
