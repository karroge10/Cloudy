import { Modal, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '../utils/haptics';
import { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';


const { width } = Dimensions.get('window');

interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    buttons?: AlertButton[];
    onClose: () => void;
    type?: 'error' | 'success' | 'info' | 'warning';
}

export const CustomAlert: React.FC<CustomAlertProps> = ({ 
    visible, 
    title, 
    message, 
    buttons = [], 
    onClose,
    type = 'info'
}) => {
    const { isDarkMode } = useTheme();
    const { t } = useTranslation();
    
    useEffect(() => {
        if (visible) {
            if (type === 'error') haptics.error();
            else if (type === 'success') haptics.success();
            else haptics.selection();
        }
    }, [visible, type]);

    const getIconName = () => {
        switch (type) {
            case 'error': return 'warning';
            case 'warning': return 'alert-circle';
            case 'success': return 'checkmark-circle';
            default: return 'information-circle';
        }
    };

    const getIconColor = () => {
        switch (type) {
            case 'error': return '#EF4444'; // red-500
            case 'warning': return '#F59E0B'; // amber-500
            case 'success': return '#22C55E'; // green-500
            default: return '#3B82F6'; // blue-500
        }
    };

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className={`flex-1 justify-center items-center bg-black/40 px-6 ${isDarkMode ? 'dark' : ''}`}>
                <View className="bg-background w-full max-w-sm rounded-[32px] p-6 items-center shadow-xl border-4 border-card/20">
                    <View className="mb-4 bg-card p-4 rounded-full shadow-sm">
                        <Ionicons name={getIconName()} size={40} color={getIconColor()} />
                    </View>
                    
                    <Text className="text-2xl font-q-bold text-text text-center mb-2">
                        {title}
                    </Text>
                    
                    <Text className="text-lg font-q-medium text-muted text-center mb-8 leading-6">
                        {message}
                    </Text>

                    <View className="w-full gap-3">
                        {buttons.length > 0 ? (
                            buttons.map((btn, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => {
                                        haptics.selection();
                                        btn.onPress?.();
                                        onClose();
                                    }}
                                    className={`py-4 rounded-full items-center ${
                                        btn.style === 'cancel' 
                                            ? 'bg-transparent border-2 border-inactive/20' 
                                            : btn.style === 'destructive'
                                            ? 'bg-red-500'
                                            : 'bg-primary'
                                    }`}
                                >
                                    <Text className={`font-q-bold text-lg ${
                                        btn.style === 'cancel' ? 'text-muted' : 'text-white'
                                    }`}>
                                        {btn.text}
                                    </Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <TouchableOpacity
                                onPress={() => { haptics.selection(); onClose(); }}
                                className="bg-primary py-4 rounded-full items-center"
                            >
                                <Text className="text-white font-q-bold text-lg">{t('common.okay')}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};
