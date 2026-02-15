import { MASCOTS } from './Assets';

export const COMPANIONS = [
    { id: 'SPARKY', name: 'Sparky', asset: MASCOTS.HERO, requiredStreak: 0 },
    { id: 'COOKIE', name: 'Cookie', asset: MASCOTS.CHEF, requiredStreak: 3 },
    { id: 'DREAMY', name: 'Dreamy', asset: MASCOTS.WIZARD, requiredStreak: 7 },
    { id: 'BRAINY', name: 'Brainy', asset: MASCOTS.DOCTOR, requiredStreak: 14 },
    { id: 'SUNNY', name: 'Sunny', asset: MASCOTS.FARMER, requiredStreak: 21 },
    { id: 'GROOVY', name: 'Groovy', asset: MASCOTS.ROCK, requiredStreak: 30 },
] as const;

export type CompanionId = typeof COMPANIONS[number]['id'];
export type Companion = typeof COMPANIONS[number];
