import React from 'react';
import { TouchableOpacity, Image, Text, ImageSourcePropType } from 'react-native';
import { haptics } from '../utils/haptics';

interface MascotCardProps {
    name: string;
    asset: ImageSourcePropType;
    isSelected: boolean;
    onPress: () => void;
}

export const MascotCard = ({ name, asset, isSelected, onPress }: MascotCardProps) => {
    const handlePress = () => {
        haptics.selection();
        onPress();
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            className={`w-[30%] aspect-square mb-4 rounded-[32px] items-center justify-center border-2 active:scale-95 transition-transform ${
                isSelected 
                    ? 'bg-secondary border-primary shadow-sm' 
                    : 'bg-white border-primary/10 shadow-sm'
            }`}
            style={isSelected ? { elevation: 2 } : { elevation: 1 }}
        >
            <Image 
                source={asset} 
                className="w-14 h-14" 
                resizeMode="contain" 
            />
            <Text className={`font-q-bold text-[10px] mt-2 uppercase ${
                isSelected ? 'text-primary' : 'text-muted'
            }`}>
                {name}
            </Text>
        </TouchableOpacity>
    );
};
