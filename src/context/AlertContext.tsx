import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CustomAlert } from '../components/CustomAlert';

interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

interface AlertState {
    visible: boolean;
    title: string;
    message: string;
    type: 'error' | 'success' | 'info' | 'warning';
    buttons: AlertButton[];
}

interface AlertContextData {
    showAlert: (
        title: string,
        message: string,
        buttons?: AlertButton[],
        type?: 'error' | 'success' | 'info' | 'warning'
    ) => void;
    hideAlert: () => void;
}

const AlertContext = createContext<AlertContextData>({} as AlertContextData);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<AlertState>({
        visible: false,
        title: '',
        message: '',
        type: 'info',
        buttons: [],
    });

    const showAlert = useCallback((
        title: string,
        message: string,
        buttons: AlertButton[] = [],
        type: 'error' | 'success' | 'info' | 'warning' = 'info'
    ) => {
        setState({
            visible: true,
            title,
            message,
            type,
            buttons,
        });
    }, []);

    const hideAlert = useCallback(() => {
        setState(prev => ({ ...prev, visible: false }));
    }, []);

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            <CustomAlert
                visible={state.visible}
                title={state.title}
                message={state.message}
                type={state.type}
                buttons={state.buttons}
                onClose={hideAlert}
            />
        </AlertContext.Provider>
    );
};

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};
