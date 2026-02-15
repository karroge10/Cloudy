import { MASCOTS } from './Assets';

export const COMPANIONS = [
    { id: 'SPARKY', name: 'Sparky', asset: MASCOTS.HERO },
    { id: 'DREAMY', name: 'Dreamy', asset: MASCOTS.WIZARD },
    { id: 'COOKIE', name: 'Cookie', asset: MASCOTS.CHEF },
    { id: 'BRAINY', name: 'Brainy', asset: MASCOTS.DOCTOR },
    { id: 'SUNNY', name: 'Sunny', asset: MASCOTS.FARMER },
    { id: 'GROOVY', name: 'Groovy', asset: MASCOTS.ROCK },
] as const;

export type CompanionId = typeof COMPANIONS[number]['id'];
export type Companion = typeof COMPANIONS[number];
