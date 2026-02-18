export const calculateStreak = (entries: { created_at: string }[], maxStreak: number = 0): number => {
    if (!entries || entries.length === 0) return 0;

    // Helper to get YYYY-MM-DD in local time
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
    // Dreamy Logic: If freeze is available, we might even rescue a streak that "ended" days ago? 
    // No, standard freeze only covers accidental holes. We still enforce "recency" somewhat.
    // However, if I missed yesterday, and I have a freeze, my streak IS active.
    // So we relax simple check.
    
    // Actually, we just start counting from Today/Yesterday. 
    // If the loop finds holes, it attempts to patch them.
    // If the loop returns > 0, the streak is alive.
    
    let streak = 0;
    let currentCheckDate = new Date(); // Start checking from Today

    if (!uniqueDays.has(today)) {
        // If no entry today, check from yesterday
        currentCheckDate.setDate(currentCheckDate.getDate() - 1);
    }

    let lastGapDate: Date | null = null;

    // Now loop backwards
    while (true) {
        const dateStr = getLocalDate(currentCheckDate);
        
        if (uniqueDays.has(dateStr)) {
            streak++;
            currentCheckDate.setDate(currentCheckDate.getDate() - 1);
        } else {
            // Missing day encountered
            if (maxStreak >= 14) {
                 const thisGapDate = new Date(currentCheckDate);
                 
                 if (lastGapDate === null) {
                     // First/Most recent gap. Allow it.
                     lastGapDate = thisGapDate;
                     // Do NOT increment streak, just skip the day
                     currentCheckDate.setDate(currentCheckDate.getDate() - 1);
                 } else {
                     // Subsequent gap. Check regeneration (30 days).
                     // diff = Recent - Old
                     const diffTime = Math.abs(lastGapDate.getTime() - thisGapDate.getTime());
                     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                     
                     if (diffDays >= 30) {
                         // Regenerated. Allow this gap.
                         lastGapDate = thisGapDate;
                         currentCheckDate.setDate(currentCheckDate.getDate() - 1);
                     } else {
                         // Too close. Streak breaks.
                         break;
                     }
                 }
            } else {
                break;
            }
        }
    }

    return streak;
};
