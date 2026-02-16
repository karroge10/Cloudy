import { MASCOTS } from './Assets';

export const COMPANIONS = [
    { 
        id: 'SPARKY', 
        name: 'Sparky', 
        asset: MASCOTS.HERO, 
        requiredStreak: 3,
        description: 'Your first guide in the journey of self-reflection.',
        trait: 'Beginner'
    },
    { 
        id: 'COOKIE', 
        name: 'Cookie', 
        asset: MASCOTS.CHEF, 
        requiredStreak: 7,
        description: 'Cooking up healthy thoughts and positive habits.',
        trait: 'Consistency'
    },
    { 
        id: 'DREAMY', 
        name: 'Dreamy', 
        asset: MASCOTS.WIZARD, 
        requiredStreak: 14,
        description: 'Magic happens when you show up for yourself every day.',
        trait: 'Dedication'
    },
    { 
        id: 'BRAINY', 
        name: 'Brainy', 
        asset: MASCOTS.DOCTOR, 
        requiredStreak: 30,
        description: 'Understanding the patterns of your mind with clinical precision.',
        trait: 'Insight'
    },
    { 
        id: 'SUNNY', 
        name: 'Sunny', 
        asset: MASCOTS.FARMER, 
        requiredStreak: 60,
        description: 'Harvesting the fruits of your long-term mental clarity.',
        trait: 'Growth'
    },
    { 
        id: 'GROOVY', 
        name: 'Groovy', 
        asset: MASCOTS.ROCK, 
        requiredStreak: 90,
        description: 'You are now rocking the habit of daily mindfulness.',
        trait: 'Mastery'
    },
] as const;

export type CompanionId = typeof COMPANIONS[number]['id'];
export type Companion = typeof COMPANIONS[number];
