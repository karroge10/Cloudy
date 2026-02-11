import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const HistoryScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-background px-6 pt-10">
      <Text className="text-3xl font-q-bold text-text mb-6">Your Journey</Text>
      <View className="flex-1 items-center justify-center">
        <Text className="text-lg font-q-medium text-text opacity-80 text-center">
          Your journaling history will appear here.
        </Text>
      </View>
    </SafeAreaView>
  );
};
