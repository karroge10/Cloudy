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
      googleWebClientId: isPreview 
        ? '110002315879-eh54gn7dvu4tjocgq15h3nnibmfkiavt.apps.googleusercontent.com'
        : '110002315879-19osagf9f4s3spnpns5jckcdc5dq0g5r.apps.googleusercontent.com',
    }
  };
};
