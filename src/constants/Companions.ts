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
        requiredStreak: 1,
        description: 'Planting the first seeds of mindfulness.',
        trait: 'Beginner',
        unlockPerk: 'Base Experience',
        unlockPerkDescription: 'The journey begins now.'
    },
    { 
        id: 'BRAINY', 
        name: 'Brainy', 
        asset: MASCOTS.DOCTOR, 
        requiredStreak: 7,
        description: 'Analyzing the patterns of your mind.',
        trait: 'Expert',
        unlockPerk: 'User Insights',
        unlockPerkDescription: 'See your personal insights.'
    },
    { 
        id: 'DREAMY', 
        name: 'Dreamy', 
        asset: MASCOTS.WIZARD, 
        requiredStreak: 14,
        description: 'Mastering the magic of nightly reflection.',
        trait: 'Master',
        unlockPerk: 'Streak Freeze',
        unlockPerkDescription: 'Saves your streak once per month.'
    },
    { 
        id: 'COOKIE', 
        name: 'Cookie', 
        asset: MASCOTS.CHEF, 
        requiredStreak: 30,
        description: 'Feeding your habit with daily presence.',
        trait: 'Dedicated',
        unlockPerk: 'Chef\'s Special',
        unlockPerkDescription: 'Cooks up a delicious mix of your past memories.'
    },
    { 
        id: 'GROOVY', 
        name: 'Groovy', 
        asset: MASCOTS.ROCK, 
        requiredStreak: 60,
        description: 'Rocking your journey with undeniable momentum.',
        trait: 'Legend',
        unlockPerk: 'Accent Colors',
        unlockPerkDescription: 'Personalize your app with a primary color of your choice.'
    },
    { 
        id: 'SPARKY', 
        name: 'Sparky', 
        asset: MASCOTS.HERO, 
        requiredStreak: 90,
        description: 'The ultimate transformation into a hero of self-care.',
        trait: 'HERO',
        unlockPerk: 'Verified Status',
        unlockPerkDescription: 'Earn a golden profile badge and verified seal.'
    },
] as const;

export type CompanionId = typeof COMPANIONS[number]['id'];
