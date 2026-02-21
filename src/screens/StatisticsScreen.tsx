import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Layout } from '../components/Layout';
import { TopNav } from '../components/TopNav';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MascotImage } from '../components/MascotImage';
import { MASCOTS } from '../constants/Assets';
import { useTheme } from '../context/ThemeContext';
import { useAccent } from '../context/AccentContext';
import { useTranslation } from 'react-i18next';

export const StatisticsScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { data } = route.params || {};
    const { isDarkMode } = useTheme();
    const { currentAccent } = useAccent();
    const { t } = useTranslation();

    if (!data) return null;

    const accentBgStyle = { backgroundColor: `${currentAccent.hex}1A` }; // 10% opacity
    const accentTextStyle = { color: currentAccent.hex };

    const StatCard = ({ title, value, subtitle, icon }: any) => (
        <View className="bg-card rounded-3xl p-4 mb-4 shadow-sm border border-inactive/5 flex-row items-center min-h-[112px]">
            <View 
                className="w-10 h-10 rounded-2xl items-center justify-center mr-3"
                style={{ backgroundColor: `${currentAccent.hex}1A` }}
            >
                <Ionicons name={icon} size={20} color={currentAccent.hex} />
            </View>
            <View className="flex-1">
                <Text 
                    className="text-[9px] font-q-bold text-muted uppercase tracking-wider mb-1" 
                    numberOfLines={2}
                >
                    {title}
                </Text>
                <View className="flex-row items-baseline flex-wrap">
                    <Text 
                        className="text-xl font-q-bold text-text mr-1" 
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    >
                        {value}
                    </Text>
                    <Text 
                        className="text-[11px] font-q-medium text-muted" 
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    >
                        {subtitle}
                    </Text>
                </View>
            </View>
        </View>
    );

    return (
        <Layout useSafePadding={false}>
            <View className="px-6 pt-4 mb-4">
                <TopNav title={t('statistics.title')} onBack={() => navigation.goBack()} />
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
            >
                <View className="items-center w-full mb-8">
                    <MascotImage source={MASCOTS.ANALYTICS} className="w-40 h-40" resizeMode="contain" />
                    <Text className="text-2xl font-q-bold text-text mt-4">{t('statistics.analysis')}</Text>
                    <Text className="text-base font-q-medium text-muted text-center mt-1">{t('statistics.description')}</Text>
                </View>

                <View className="mb-4">
                    <Text className="text-xs font-q-bold text-muted uppercase tracking-[0.2em] mb-4 ml-1">{t('statistics.keyMetrics')}</Text>
                    <View className="flex-row flex-wrap justify-between w-full">
                        <View style={{ width: '48%' }}>
                            <StatCard title={t('statistics.activeDays')} value={data.activeDays} subtitle={t('statistics.days')} icon="calendar-outline" />
                        </View>
                        <View style={{ width: '48%' }}>
                            <StatCard title={t('statistics.totalLogs')} value={data.totalEntries} subtitle={t('statistics.logs')} icon="documents-outline" />
                        </View>
                        <View style={{ width: '48%' }}>
                            <StatCard title={t('statistics.avgLength')} value={data.avgWordsPerEntry} subtitle={t('statistics.words')} icon="text-outline" />
                        </View>
                        <View style={{ width: '48%' }}>
                            <StatCard title={t('statistics.maxWords')} value={data.longestEntryWords} subtitle={t('statistics.words')} icon="trophy-outline" />
                        </View>
                        <View style={{ width: '48%' }}>
                            <StatCard title={t('statistics.timeSpent')} value={`${data.totalTimeSpentMinutes}${t('common.min_short')}`} subtitle={t('statistics.writing')} icon="hourglass-outline" />
                        </View>
                        <View style={{ width: '48%' }}>
                            <StatCard title={t('statistics.wordCount')} value={data.totalWords} subtitle={t('statistics.words')} icon="create-outline" />
                        </View>
                    </View>
                </View>

                {/* Graph Section */}
                <View className="mb-4">
                    <Text className="text-xs font-q-bold text-muted uppercase tracking-[0.2em] mb-4 ml-1">{t('statistics.writingRhythm')}</Text>
                    <View className="bg-card rounded-3xl p-6 mb-4 shadow-sm border border-inactive/5">
                        <View className="flex-row items-end h-32 justify-around">
                            {(() => {
                                const total = data.timeOfDay.morning + data.timeOfDay.afternoon + data.timeOfDay.evening;
                                const mPct = total ? (data.timeOfDay.morning / total) * 100 : 0;
                                const aPct = total ? (data.timeOfDay.afternoon / total) * 100 : 0;
                                const ePct = total ? (data.timeOfDay.evening / total) * 100 : 0;
                                
                                return (
                                    <>
                                        <View className="items-center flex-1">
                                            <View className="w-12 rounded-t-xl" style={{ height: `${Math.max(mPct, 5)}%`, backgroundColor: mPct === Math.max(mPct, aPct, ePct) && total > 0 ? currentAccent.hex : `${currentAccent.hex}33` }} />
                                            <Text className="text-xs font-q-bold text-muted mt-2">{t('statistics.morning')}</Text>
                                            <Text className="text-[10px] font-q-bold" style={{ color: currentAccent.hex }}>{data.timeOfDay.morning}</Text>
                                        </View>
                                        <View className="items-center flex-1">
                                            <View className="w-12 rounded-t-xl" style={{ height: `${Math.max(aPct, 5)}%`, backgroundColor: aPct === Math.max(mPct, aPct, ePct) && total > 0 ? currentAccent.hex : `${currentAccent.hex}33` }} />
                                            <Text className="text-xs font-q-bold text-muted mt-2">{t('statistics.afternoon')}</Text>
                                            <Text className="text-[10px] font-q-bold" style={{ color: currentAccent.hex }}>{data.timeOfDay.afternoon}</Text>
                                        </View>
                                        <View className="items-center flex-1">
                                            <View className="w-12 rounded-t-xl" style={{ height: `${Math.max(ePct, 5)}%`, backgroundColor: ePct === Math.max(mPct, aPct, ePct) && total > 0 ? currentAccent.hex : `${currentAccent.hex}33` }} />
                                            <Text className="text-xs font-q-bold text-muted mt-2">{t('statistics.evening')}</Text>
                                            <Text className="text-[10px] font-q-bold" style={{ color: currentAccent.hex }}>{data.timeOfDay.evening}</Text>
                                        </View>
                                    </>
                                );
                            })()}
                        </View>
                    </View>
                </View>

                {/* Top Themes Section */}
                {data.topWords.length > 0 && (
                    <View className="mb-12">
                        <Text className="text-xs font-q-bold text-muted uppercase tracking-[0.2em] mb-4 ml-1">{t('statistics.topThemes')}</Text>
                        <View className="flex-row flex-wrap gap-3">
                                {data.topWords.map((item: any, index: number) => (
                                     <View key={index} className="bg-card border border-inactive/10 px-4 py-3 rounded-2xl flex-row items-center shadow-sm">
                                        <Text className="text-base font-q-medium text-text mr-2 capitalize">{item.word}</Text>
                                        <Text className="text-xs font-q-bold" style={{ color: `${currentAccent.hex}99` }}>{item.count}</Text>
                                    </View>
                                ))}
                            </View>
                    </View>
                )}
            </ScrollView>
        </Layout>
    );
};
