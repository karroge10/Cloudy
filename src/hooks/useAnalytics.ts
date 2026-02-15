import { posthog } from '../lib/posthog';

export const useAnalytics = () => {
    const trackEvent = (eventName: string, properties?: Record<string, any>) => {
        posthog.capture(eventName, properties);
    };

    const screenView = (screenName: string, properties?: Record<string, any>) => {
        posthog.screen(screenName, properties);
    };

    return {
        trackEvent,
        screenView,
        posthog,
    };
};
