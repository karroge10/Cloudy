import React, { useRef } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

import { useAccent } from '../context/AccentContext';

import { useTranslation } from 'react-i18next';

interface ActivityGraphProps {
    entries?: { created_at: string }[]; // Array of objects with ISO date strings
    frozenDates?: string[];
    maxStreak?: number;
}

export const ActivityGraph: React.FC<ActivityGraphProps> = ({ entries, frozenDates, maxStreak }) => {
    const { currentAccent } = useAccent();
    const { t } = useTranslation();
    const scrollViewRef = useRef<ScrollView>(null);
    // Calculate reliable width
    const screenWidth = Dimensions.get('window').width;
    // We assume a smaller offset to calculate more weeks than strictly necessary
    // to guarantee the graph is "full" and has no gap on the right.
    const availableWidth = screenWidth - 100; 
    const weekWidth = 20; // 14px (w-3.5) + 6px (gap-1.5)
    
    // Calculate weeks to fill, and add 2 weeks buffer for a "full" look
    const targetWeeks = Math.ceil(availableWidth / weekWidth) + 2; 
    const totalDays = targetWeeks * 7;

    const monthsText = Math.round(totalDays / 30);

    // Generate data from entries
    const activityData = React.useMemo(() => {
        const counts = new Map<string, number>();
        entries?.forEach(entry => {
            // Use local date string to match streak calculation logic
            const d = new Date(entry.created_at);
            const key = d.toLocaleDateString('en-CA');
            counts.set(key, (counts.get(key) || 0) + 1);
        });

        // Generate last X days
        const days = [];
        const today = new Date();
        
        for (let i = totalDays - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const key = d.toLocaleDateString('en-CA');
            const count = counts.get(key) || 0;
            days.push(Math.min(count, 3));
        }
        return days;
    }, [entries, totalDays]);

    const weeks = React.useMemo(() => {
        const result = [];
        const today = new Date();
        const currentDayIndex = (today.getDay() + 6) % 7; // Mon=0, Sun=6
        
        const endOfCurrentWeek = new Date(today);
        endOfCurrentWeek.setDate(today.getDate() + (6 - currentDayIndex)); 

        const data: number[] = [];
        const counts = new Map<string, number>();
        entries?.forEach(entry => {
             const d = new Date(entry.created_at);
             const key = d.toLocaleDateString('en-CA');
             counts.set(key, (counts.get(key) || 0) + 1);
        });

        const frozenSet = new Set(frozenDates || []);

        // Generate days backwards from endOfCurrentWeek
        for (let i = totalDays - 1; i >= 0; i--) {
            const d = new Date(endOfCurrentWeek);
            d.setDate(d.getDate() - i);
            const key = d.toLocaleDateString('en-CA');
            const count = counts.get(key) || 0;
            // Don't show future days logic?
            if (d > today) {
                data.push(-1); // Future
            } else if (count === 0 && frozenSet.has(key)) {
                data.push(-2); // Frozen
            } else {
                data.push(Math.min(count, 3)); 
            }
        }
        
        // Now slice into 7s
        for (let i = 0; i < data.length; i += 7) {
            result.push(data.slice(i, i + 7));
        }
        return result;
    }, [entries, totalDays]);

    const getColorStyle = (intensity: number) => {
        if (intensity === -1) return { backgroundColor: 'transparent' }; 
        if (intensity === -2) return { backgroundColor: isDarkMode ? '#1E293B' : '#F0F9FF', borderColor: '#38BDF8', borderWidth: 1 }; // Frozen
        if (intensity === 0) return { backgroundColor: isDarkMode ? '#334155' : '#E2E8F0', opacity: 0.3 }; // inactive color
        
        // Use accent color with varying opacity
        switch (intensity) {
             // We can use hex opacity or rgba. hex 4D = 30%, 99 = 60%, FF = 100%
            case 1: return { backgroundColor: currentAccent.hex, opacity: 0.3 };
            case 2: return { backgroundColor: currentAccent.hex, opacity: 0.6 };
            default: return { backgroundColor: currentAccent.hex, opacity: 1 };
        }
    };

    const { isDarkMode } = useTheme();

    const days = t('calendar.weekdays.short', { returnObjects: true }) as string[];

    return (
        <View className="bg-card rounded-3xl p-6 shadow-xl mb-8 border border-inactive/5"
            style={{ shadowColor: isDarkMode ? '#000' : '#0000000D', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 15, elevation: 4 }}>
            <View className="flex-row justify-between items-center mb-6">
                <Text className="text-lg font-q-bold text-text">{t('common.activity')}</Text>
                <Text className="text-sm font-q-medium text-muted">{t('common.lastMonths', { count: monthsText })}</Text>
            </View>
            
            <View className="flex-row">
                {/* Day Labels */}
                <View className="pr-2 justify-between py-1">
                    {days.map((day, i) => (
                        <Text key={i} className="text-[10px] font-q-medium text-muted h-3 leading-3">{day}</Text>
                    ))}
                </View>

                <ScrollView 
                    ref={scrollViewRef}
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    className="flex-1"
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
                >
                    <View className="flex-row gap-1.5 flex-1">
                        {weeks.map((week, weekIndex) => (
                            <View key={weekIndex} className="gap-1.5">
                                {week.map((intensity, dayIndex) => (
                                    <View
                                        key={dayIndex}
                                        className="w-3.5 h-3.5 rounded-sm items-center justify-center overflow-hidden"
                                        style={getColorStyle(intensity)}
                                    >
                                        {intensity === -2 && (
                                            <Ionicons name="snow" size={8} color="#38BDF8" />
                                        )}
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </View>

            <View className="flex-row items-center justify-between mt-4">
                <View className="flex-row items-center gap-2">
                    <Text className="text-[10px] font-q-medium text-muted">{t('common.less')}</Text>
                    <View className="w-2.5 h-2.5 rounded-sm bg-inactive opacity-30" />
                    <View className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: currentAccent.hex, opacity: 0.3 }} />
                    <View className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: currentAccent.hex, opacity: 0.6 }} />
                    <View className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: currentAccent.hex }} />
                    <Text className="text-[10px] font-q-medium text-muted">{t('common.more')}</Text>
                </View>
                
                {maxStreak !== undefined && (
                    <Text className="text-[10px] font-q-bold" style={{ color: currentAccent.hex }}>
                        {t('common.maxStreak')}: {t('common.daysCount', { count: maxStreak })} 🔥
                    </Text>
                )}
            </View>
        </View>
    );
};

