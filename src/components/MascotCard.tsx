import { TouchableOpacity, Text, ImageSourcePropType, View } from 'react-native';
import { haptics } from '../utils/haptics';
import { MascotImage } from './MascotImage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAccent } from '../context/AccentContext';

interface MascotCardProps {
    name: string;
    asset: ImageSourcePropType;
    isSelected: boolean;
    isLocked: boolean;
    requiredStreak?: number;
    unlockPerk?: string;
    onPress: () => void;
}

export const MascotCard = ({ name, asset, isSelected, isLocked, requiredStreak, unlockPerk, onPress }: MascotCardProps) => {
    const { isDarkMode } = useTheme();
    const { currentAccent } = useAccent();
    const handlePress = () => {
        haptics.selection();
        onPress();
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            disabled={isLocked}
            delayPressIn={0}
            activeOpacity={isLocked ? 1 : 0.7}
            className={`w-[30%] aspect-square mb-4 rounded-[32px] items-center justify-center p-2 ${
                isLocked 
                    ? 'bg-inactive/5 opacity-60'
                    : 'bg-card shadow-sm active:scale-95'
            }`}
            style={{
                borderColor: !isLocked && isSelected ? currentAccent.hex : 'transparent',
                borderWidth: 2,
                elevation: !isLocked && isSelected ? 2 : 0
            }}
        >
            {!isLocked && isSelected && (
                <View 
                    style={{ 
                        position: 'absolute', 
                        top: 0, left: 0, right: 0, bottom: 0, 
                        backgroundColor: `${currentAccent.hex}15`,
                        borderRadius: 30
                    }} 
                />
            )}
            <View className="items-center justify-center">
                <MascotImage 
                    source={asset} 
                    className={`w-12 h-12 ${isLocked ? 'grayscale opacity-50' : ''}`}
                    resizeMode="contain" 
                />
                {isLocked && (
                    <View className="absolute bg-card rounded-full p-1 border border-inactive/20">
                        <Ionicons name="lock-closed" size={14} color={isDarkMode ? "#E5E7EB" : "#94A3B8"} />
                    </View>
                )}
                {!isLocked && isSelected && (
                    <View className="absolute bg-white rounded-full p-0.5 shadow-sm border border-inactive/20 -right-2 -top-2">
                        <Ionicons name="checkmark-circle" size={16} color={currentAccent.hex} />
                    </View>
                )}
            </View>
            <Text 
                className={`font-q-bold text-[10px] mt-2 uppercase ${isLocked ? 'text-muted/50' : isSelected ? '' : 'text-muted'}`}
                style={!isLocked && isSelected ? { color: currentAccent.hex } : undefined}
            >
                {isLocked ? (requiredStreak !== undefined ? `${requiredStreak} Days` : 'Locked') : name}
            </Text>
            {isLocked && unlockPerk && (
                <Text 
                    className="font-q-medium text-[8px] text-center px-1 leading-tight" 
                    numberOfLines={1}
                    style={{ color: `${currentAccent.hex}66` }}
                >
                    {unlockPerk}
                </Text>
            )}
        </TouchableOpacity>
    );
};
