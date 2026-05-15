import type { Language } from '@/types';
import type { LandingContent } from './landingTypes';
import { LANDING_EN, LANDING_HI } from './landingEnHi';

export function getLandingContent(lang: Language): LandingContent {
  switch (lang) {
    case 'hi':
      return LANDING_HI;
    default:
      return LANDING_EN;
  }
}

export type { LandingContent };
