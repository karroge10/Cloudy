import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '../utils/haptics';
import { HomeScreen } from '../screens/HomeScreen';
import { JourneyScreen } from '../screens/JourneyScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

import { useTheme } from '../context/ThemeContext';
import { useAccent } from '../context/AccentContext';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useTheme();
  const { currentAccent } = useAccent();
  const { t } = useTranslation();
  
  return (
    <View style={[
      styles.tabBar, 
      { 
        height: 80 + insets.bottom, 
        paddingBottom: insets.bottom, 
        backgroundColor: isDarkMode ? '#1a1d35' : '#FFFFFF' 
      }
    ]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          
          haptics.selection();

          if (!isFocused && !event.defaultPrevented) {
            requestAnimationFrame(() => {
                navigation.navigate(route.name, route.params);
            });
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        let iconName: any;
        if (route.name === 'Entry') {
          iconName = isFocused ? 'create' : 'create-outline';
        } else if (route.name === 'Journey') {
          iconName = isFocused ? 'calendar' : 'calendar-outline';
        } else if (route.name === 'Profile') {
          iconName = isFocused ? 'person' : 'person-outline';
        }

        const activeColor = currentAccent.hex;
        const inactiveColor = isDarkMode ? '#64748B' : '#94A3B8';

        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            delayPressIn={0}
            style={styles.tabItem}
          >
            <Ionicons 
              name={iconName} 
              size={24} 
              color={isFocused ? activeColor : inactiveColor} 
            />
            <Text style={[
              styles.tabLabel,
              { color: isFocused ? activeColor : inactiveColor }
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export const MainTabNavigator = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Entry" 
        component={HomeScreen} 
        options={{ title: t('navigation.entry') }} 
      />
      <Tab.Screen 
        name="Journey" 
        component={JourneyScreen} 
        options={{ title: t('navigation.journey') }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: t('navigation.profile') }} 
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    // Height will be overridden dynamically
    // height: 100, 
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: 80, 
  },
  tabLabel: {
    marginTop: 4,
    fontFamily: 'Quicksand_600SemiBold',
    fontSize: 12,
  },
});
