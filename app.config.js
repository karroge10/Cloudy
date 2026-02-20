module.exports = ({ config }) => {
  const isPreview = process.env.APP_VARIANT === 'preview';
  
  return {
    ...config,
    name: isPreview ? 'Cloudy (Preview)' : 'Cloudy',
    android: {
      ...config.android,
      package: isPreview ? 'app.cloudy.journal.preview' : 'app.cloudy.journal',
    },
    extra: {
      ...config.extra,
      googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    }
  };
};
