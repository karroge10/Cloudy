import { MASCOTS } from './Assets';

export const COMPANIONS = [
    { id: 'HERO', name: 'Hero', asset: MASCOTS.HERO },
    { id: 'WIZARD', name: 'Wizard', asset: MASCOTS.WIZARD },
    { id: 'CHEF', name: 'Chef', asset: MASCOTS.CHEF },
    { id: 'DOCTOR', name: 'Doc', asset: MASCOTS.DOCTOR },
    { id: 'FARMER', name: 'Farmer', asset: MASCOTS.FARMER },
    { id: 'ROCK', name: 'Rocky', asset: MASCOTS.ROCK },
] as const;

export type CompanionId = typeof COMPANIONS[number]['id'];
export type Companion = typeof COMPANIONS[number];
