export interface StreakResult {
    streak: number;
    isFrozen: boolean;
    frozenDates: string[];
}

export const calculateStreak = (entries: { created_at: string }[], currentMaxStreak: number = 0): StreakResult => {
    if (!entries || entries.length === 0) return { streak: 0, isFrozen: false, frozenDates: [] };

    // 1. Prepare unique sorted days (Local Time)
    const getLocalDate = (dateInput: string | Date) => {
        const d = new Date(dateInput);
        return d.toLocaleDateString('en-CA'); 
    };

    const uniqueDaysArr = Array.from(new Set(entries.map(e => getLocalDate(e.created_at))))
        .sort((a, b) => a.localeCompare(b));
    
    if (uniqueDaysArr.length === 0) return { streak: 0, isFrozen: false, frozenDates: [] };

    const today = getLocalDate(new Date());
    const firstEntryDate = new Date(uniqueDaysArr[0]);
    const lastEntryDate = new Date(uniqueDaysArr[uniqueDaysArr.length - 1]);
    
    // We scan up to Today or the last entry, whichever is later
    const lastDateToScan = new Date(today) > lastEntryDate ? new Date(today) : lastEntryDate;

    // 2. Simulation State
    let rollingMax = 0;
    let currentStreak = 0;
    let lastGapClaimedTime: number | null = null;
    let allFrozenDates: string[] = [];
    
    // Set for O(1) lookups
    const entrySet = new Set(uniqueDaysArr);

    // 3. Forward Simulation
    let cursor = new Date(firstEntryDate);
    while (cursor <= lastDateToScan) {
        const dateStr = getLocalDate(cursor);
        const isToday = dateStr === today;
        
        if (entrySet.has(dateStr)) {
            currentStreak++;
            rollingMax = Math.max(rollingMax, currentStreak);
        } else {
            // GAP FOUND
            const canFreeze = rollingMax >= 14 && (
                lastGapClaimedTime === null || 
                (cursor.getTime() - lastGapClaimedTime) >= (30 * 24 * 60 * 60 * 1000)
            );

            if (canFreeze) {
                allFrozenDates.push(dateStr);
                lastGapClaimedTime = cursor.getTime();
                // currentStreak remains unchanged (the bridge)
            } else if (!isToday) {
                // Streak only breaks if the gap is in the PAST.
                // If the gap is TODAY, we wait until the day is over.
                currentStreak = 0;
            }
        }
        cursor.setDate(cursor.getDate() + 1);
    }

    // 4. Final results
    // The simulation already calculated the 'currentStreak' up to Today.
    // If it's > 0, it means it's either from today's post, yesterday's post, 
    // or a bridge that hasn't collapsed yet.
    
    const finalStreak = currentStreak;
    const isFrozen = finalStreak > 0 && !entrySet.has(today) && allFrozenDates.includes(today);

    // One last check: If the last post was more than 1 day ago (+ bridges), 
    // and today wasn't a bridge, the streak should be dead.
    // But the simulation loop handles this by setting currentStreak = 0 
    // the moment it hits a gap it can't bridge.

    return { 
        streak: finalStreak, 
        isFrozen, 
        frozenDates: allFrozenDates 
    };
};
