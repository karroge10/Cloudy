import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '../utils/haptics';
import { useTheme } from '../context/ThemeContext';

interface CalendarViewProps {
    markedDates: Set<string>; // YYYY-MM-DD
    onDateSelect: (date: string | null) => void;
    selectedDate: string | null;
}

export const CalendarView = ({ markedDates, onDateSelect, selectedDate }: CalendarViewProps) => {
    const { isDarkMode } = useTheme();
    const [currentMonth, setCurrentMonth] = useState(() => {
        if (selectedDate) {
            const [year, month, day] = selectedDate.split('-').map(Number);
            return new Date(year, month - 1, day);
        }
        return new Date();
    });

    const daysInMonth = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const date = new Date(year, month, 1);
        const days = [];
        while (date.getMonth() === month) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
    }, [currentMonth]);

    const firstDayOfMonth = daysInMonth[0].getDay(); // 0 = Sunday
    const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const handlePrevMonth = () => {
        haptics.selection();
        setCurrentMonth(prev => {
            const temp = new Date(prev);
            temp.setMonth(temp.getMonth() - 1);
            return temp;
        });
    };

    const handleNextMonth = () => {
        haptics.selection();
        setCurrentMonth(prev => {
            const temp = new Date(prev);
            temp.setMonth(temp.getMonth() + 1);
            return temp;
        });
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    };

    const isSameDate = (d1: Date, dateString: string | null) => {
        if (!dateString) return false;
        // dateString is YYYY-MM-DD
        // d1 is Date object
        // We need to compare carefully.
        // Let's format d1 to YYYY-MM-DD locally
        const year = d1.getFullYear();
        const month = (d1.getMonth() + 1).toString().padStart(2, '0');
        const day = d1.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}` === dateString;
    };

    const getDayString = (date: Date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const renderDay = (date: Date | null, index: number) => {
        if (!date) return <View key={`empty-${index}`} className="flex-1 aspect-square" />;

        const dateStr = getDayString(date);
        const hasEntry = markedDates.has(dateStr);
        const isSelected = selectedDate === dateStr;
        const isCurrentDay = isToday(date);

        return (
            <TouchableOpacity
                key={date.getDate()}
                className="flex-1 aspect-square items-center justify-center m-0.5 rounded-full"
                onPress={() => {
                    haptics.selection();
                    if (isSelected) {
                         onDateSelect(null);
                    } else {
                         onDateSelect(dateStr);
                    }
                }}
                style={{
                    backgroundColor: isSelected ? '#FF9E7D' : isCurrentDay ? (isDarkMode ? '#FF9E7D20' : '#FFF0E6') : 'transparent',
                    borderWidth: isCurrentDay && !isSelected ? 1 : 0,
                    borderColor: '#FF9E7D'
                }}
            >
                <Text className={`font-q-bold ${isSelected ? 'text-white' : hasEntry ? 'text-text' : 'text-muted/50'}`}>
                    {date.getDate()}
                </Text>
                {hasEntry && !isSelected && (
                    <View className="w-1 h-1 rounded-full bg-primary mt-0.5 absolute bottom-1" />
                )}
            </TouchableOpacity>
        );
    };

    // Create grid rows
    const blanks = Array(firstDayOfMonth).fill(null);
    const allSlots = [...blanks, ...daysInMonth];
    const rows: (Date | null)[][] = [];
    
    for (let i = 0; i < allSlots.length; i += 7) {
        const chunk = allSlots.slice(i, i + 7);
        while (chunk.length < 7) chunk.push(null);
        rows.push(chunk);
    }

    return (
        <View 
            className="bg-card rounded-3xl p-6 border border-inactive/10 shadow-lg"
            style={{ 
                shadowColor: isDarkMode ? '#000' : '#00000020', 
                shadowOffset: { width: 0, height: 4 }, 
                shadowOpacity: 1, 
                shadowRadius: 20, 
                elevation: 10,
                zIndex: 1000
            }}
        >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4 px-2">
                <TouchableOpacity onPress={handlePrevMonth} className="p-2">
                    <Ionicons name="chevron-back" size={20} color={isDarkMode ? "#E5E7EB" : "#333"} />
                </TouchableOpacity>
                <Text className="font-q-bold text-lg text-text">{monthLabel}</Text>
                <TouchableOpacity onPress={handleNextMonth} className="p-2">
                     <Ionicons name="chevron-forward" size={20} color={isDarkMode ? "#E5E7EB" : "#333"} />
                </TouchableOpacity>
            </View>

            {/* Week Days */}
            <View className="flex-row mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <View key={day} className="flex-1 items-center justify-center">
                        <Text className="font-q-bold text-xs text-muted/60 uppercase">{day}</Text>
                    </View>
                ))}
            </View>

            {/* Days Grid */}
            <View>
                {rows.map((row, rIndex) => (
                    <View key={rIndex} className="flex-row items-center justify-between">
                        {row.map((date, cIndex) => (
                            <View key={cIndex} className="flex-1 aspect-square">
                                {renderDay(date, rIndex * 7 + cIndex)}
                            </View>
                        ))}
                    </View>
                ))}
            </View>
        </View>
    );
};
