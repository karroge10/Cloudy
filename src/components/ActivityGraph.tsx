import React from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';

interface ActivityGraphProps {
    data?: number[]; // Intensity per day for the last X days
}

export const ActivityGraph: React.FC<ActivityGraphProps> = ({ data }) => {
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

    // Generate dummy data if none provided
    const activityData = data || Array.from({ length: totalDays }, () => Math.floor(Math.random() * 4));

    // Chunk into weeks (7 days per week)
    const weeks = [];
    for (let i = 0; i < activityData.length; i += 7) {
        weeks.push(activityData.slice(i, i + 7));
    }

    const getColor = (intensity: number) => {
        switch (intensity) {
            case 0: return 'bg-inactive opacity-30';
            case 1: return 'bg-primary opacity-30';
            case 2: return 'bg-primary opacity-60';
            case 3: return 'bg-primary';
            default: return 'bg-inactive';
        }
    };

    const days = ['M', '', 'W', '', 'F', '', 'S'];

    return (
        <View className="bg-card rounded-3xl p-6 shadow-[#0000000D] shadow-xl mb-8"
            style={{ shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 15, elevation: 4 }}>
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-q-bold text-text">Activity</Text>
                <Text className="text-sm font-q-medium text-muted">Last {monthsText} months</Text>
            </View>
            
            <View className="flex-row">
                {/* Day Labels */}
                <View className="pr-2 justify-between py-1">
                    {days.map((day, i) => (
                        <Text key={i} className="text-[10px] font-q-medium text-muted h-3 leading-3">{day}</Text>
                    ))}
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
                    <View className="flex-row gap-1.5 flex-1">
                        {weeks.map((week, weekIndex) => (
                            <View key={weekIndex} className="gap-1.5">
                                {week.map((intensity, dayIndex) => (
                                    <View
                                        key={dayIndex}
                                        className={`w-3.5 h-3.5 rounded-sm ${getColor(intensity)}`}
                                    />
                                ))}
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </View>

            <View className="flex-row items-center mt-4 gap-2">
                <Text className="text-[10px] font-q-medium text-muted">Less</Text>
                <View className="w-2.5 h-2.5 rounded-sm bg-inactive opacity-30" />
                <View className="w-2.5 h-2.5 rounded-sm bg-primary opacity-30" />
                <View className="w-2.5 h-2.5 rounded-sm bg-primary opacity-60" />
                <View className="w-2.5 h-2.5 rounded-sm bg-primary" />
                <Text className="text-[10px] font-q-medium text-muted">More</Text>
            </View>
        </View>
    );
};
