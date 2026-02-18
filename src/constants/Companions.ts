import { MASCOTS } from './Assets';

export interface Companion {
    id: string;
    name: string;
    asset: any;
    requiredStreak: number;
    description: string;
    trait: string;
    unlockPerk: string;
    unlockPerkDescription: string;
}

export const COMPANIONS: readonly Companion[] = [
    { 
        id: 'SUNNY', 
        name: 'Sunny', 
        asset: MASCOTS.FARMER, 
        requiredStreak: 0,
        description: 'Planting the first seeds of mindfulness.',
        trait: 'Beginner',
        unlockPerk: 'Base Experience',
        unlockPerkDescription: 'The standard Cloudy loop.'
    },
    { 
        id: 'COOKIE', 
        name: 'Cookie', 
        asset: MASCOTS.CHEF, 
        requiredStreak: 7,
        description: 'Feeding your habit with daily presence.',
        trait: 'Regular',
        unlockPerk: 'Streak Freeze',
        unlockPerkDescription: 'Saves your streak once per month (Passive).'
    },
    { 
        id: 'BRAINY', 
        name: 'Brainy', 
        asset: MASCOTS.DOCTOR, 
        requiredStreak: 14,
        description: 'Analyzing the patterns of your mind.',
        trait: 'Expert',
        unlockPerk: 'Insights Dashboard',
        unlockPerkDescription: 'Unlock Brainy to see personal insights on profile screen.'
    },
    { 
        id: 'DREAMY', 
        name: 'Dreamy', 
        asset: MASCOTS.WIZARD, 
        requiredStreak: 30,
        description: 'Mastering the magic of nightly reflection.',
        trait: 'Master',
        unlockPerk: 'Dreamy Theme',
        unlockPerkDescription: 'Unlock Dreamy for a special cosmic theme.'
    },
    { 
        id: 'GROOVY', 
        name: 'Groovy', 
        asset: MASCOTS.ROCK, 
        requiredStreak: 60,
        description: 'Rocking your journey with undeniable momentum.',
        trait: 'Legend',
        unlockPerk: 'Custom App Icons',
        unlockPerkDescription: 'Unlock Groovy to customize your home screen.'
    },
    { 
        id: 'SPARKY', 
        name: 'Sparky', 
        asset: MASCOTS.HERO, 
        requiredStreak: 90,
        description: 'The ultimate transformation into a hero of self-care.',
        trait: 'HERO',
        unlockPerk: 'Verified Status',
        unlockPerkDescription: 'A golden profile badge and verified seal.'
    },
] as const;

export type CompanionId = typeof COMPANIONS[number]['id'];
