export const calculateStreak = (entries: { created_at: string }[]): number => {
    if (!entries || entries.length === 0) return 0;

    // Helper to get YYYY-MM-DD in local time
    // using 'en-CA' gives YYYY-MM-DD which is sortable and consistent
    const getLocalDate = (dateInput: string | Date) => {
        const d = new Date(dateInput);
        return d.toLocaleDateString('en-CA'); 
    };

    const uniqueDays = new Set<string>();
    entries.forEach(entry => {
        uniqueDays.add(getLocalDate(entry.created_at));
    });

    const sortedDays = Array.from(uniqueDays).sort((a, b) => b.localeCompare(a));
    if (sortedDays.length === 0) return 0;

    const today = getLocalDate(new Date());
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = getLocalDate(yesterdayDate);

    // Check if streak is active (entry today OR yesterday)
    const lastEntryDay = sortedDays[0];
    if (lastEntryDay !== today && lastEntryDay !== yesterday) {
        return 0;
    }

    let streak = 0;
    let currentCheckDate = new Date(); // Start checking from Today

    // If the latest entry is absent today but present yesterday, we start counting from yesterday.
    // If we simply start from "today", and today is missing, the loop would break immediately if we didn't handle this logic.
    // But actually simpler logic:
    // If today is present, streak includes today.
    // If today is missing, but yesterday is present, streak includes yesterday (and is kept alive).
    // So we can just start checking from TODAY. If today is in the set, streak++. Move up.
    // If today is NOT in set, check yesterday. If yesterday IS in set, we start counting from there.
    
    if (!uniqueDays.has(today)) {
        // If no entry today, shift check to start from yesterday
        currentCheckDate.setDate(currentCheckDate.getDate() - 1);
    }

    // Now loop backwards
    while (true) {
        const dateStr = getLocalDate(currentCheckDate);
        if (uniqueDays.has(dateStr)) {
            streak++;
            currentCheckDate.setDate(currentCheckDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
};
