import React from 'react';
import { View, ViewProps } from 'react-native';

interface DividerProps extends ViewProps {
    vertical?: boolean;
}

export const Divider: React.FC<DividerProps> = ({ vertical, style, className, ...props }) => {
    return (
        <View
            className={`${vertical ? 'w-[1px] h-full' : 'h-[1px] w-full'} bg-inactive opacity-10 ${className || ''}`}
            style={style}
            {...props}
        />
    );
};
