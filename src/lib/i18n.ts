import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from '../translations/en.json';
import es from '../translations/es.json';
import pt from '../translations/pt.json';
import fr from '../translations/fr.json';
import de from '../translations/de.json';
import hi from '../translations/hi.json';
import ru from '../translations/ru.json';
import it from '../translations/it.json';
import zh from '../translations/zh.json';
import ja from '../translations/ja.json';
import ko from '../translations/ko.json';
import id from '../translations/id.json';

// Define the resources
const resources = {
  en: { translation: en },
  es: { translation: es },
  pt: { translation: pt },
  fr: { translation: fr },
  de: { translation: de },
  hi: { translation: hi },
  ru: { translation: ru },
  it: { translation: it },
  zh: { translation: zh },
  ja: { translation: ja },
  ko: { translation: ko },
  id: { translation: id },
};

// Function to get the saved language or default to device locale
const getInitialLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('user-language');
    if (savedLanguage) return savedLanguage;
    
    // Fallback to device locale
    const deviceLanguage = Localization.getLocales()[0]?.languageCode ?? 'en';
    return resources[deviceLanguage as keyof typeof resources] ? deviceLanguage : 'en';
  } catch (error) {
    return 'en';
  }
};

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: Localization.getLocales()[0]?.languageCode ?? 'en', // Initial sync load
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, 
    },
    compatibilityJSON: 'v4',
  });

// Load the persisted language asynchronously
getInitialLanguage().then((language) => {
  if (i18n.language !== language) {
    i18n.changeLanguage(language);
  }
});

export default i18n;
