import { TouchableOpacity, Text, ImageSourcePropType, View } from 'react-native';
import { haptics } from '../utils/haptics';
import { MascotImage } from './MascotImage';
import { Ionicons } from '@expo/vector-icons';

interface MascotCardProps {
    name: string;
    asset: ImageSourcePropType;
    isSelected: boolean;
    isLocked: boolean;
    requiredStreak?: number;
    onPress: () => void;
}

export const MascotCard = ({ name, asset, isSelected, isLocked, requiredStreak, onPress }: MascotCardProps) => {
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
            className={`w-[30%] aspect-square mb-4 rounded-[32px] items-center justify-center border-2 transition-transform ${
                isLocked 
                    ? 'bg-inactive/5 border-transparent opacity-60'
                    : isSelected 
                        ? 'bg-secondary border-primary shadow-sm active:scale-95' 
                        : 'bg-white border-primary/10 shadow-sm active:scale-95'
            }`}
            style={!isLocked && isSelected ? { elevation: 2 } : { elevation: 1 }}
        >
            <View className="items-center justify-center">
                <MascotImage 
                    source={asset} 
                    className={`w-14 h-14 ${isLocked ? 'grayscale opacity-50' : ''}`}
                    resizeMode="contain" 
                />
                {isLocked && (
                    <View className="absolute bg-background/80 rounded-full p-1 border border-inactive/20">
                        <Ionicons name="lock-closed" size={14} color="#94A3B8" />
                    </View>
                )}
            </View>
            <Text className={`font-q-bold text-[10px] mt-2 uppercase ${
                isLocked ? 'text-muted/50' : isSelected ? 'text-primary' : 'text-muted'
            }`}>
                {isLocked ? (requiredStreak !== undefined ? `${requiredStreak} Days` : 'Locked') : name}
            </Text>
        </TouchableOpacity>
    );
};
