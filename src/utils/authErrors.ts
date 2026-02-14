import { AuthError } from '@supabase/supabase-js';

export const getFriendlyAuthErrorMessage = (error: AuthError | Error | any): { title: string, message: string } => {
    const status = error.status;
    const message = (error.message || '').toLowerCase();

    // 429: Rate Limiting (Too Many Requests)
    if (status === 429 || message.includes('too many requests') || message.includes('rate limit')) {
        return {
            title: 'Slow down a bit',
            message: 'For your security, there have been too many attempts. Please wait a few minutes and try again.'
        };
    }

    // 400/401: Invalid Credentials
    if ((status === 400 || status === 401) && message.includes('invalid login credentials')) {
        return {
            title: 'Login Failed',
            message: 'The email or password you entered is incorrect. Double-check them and try again.'
        };
    }

    // 422: Email already registered / Weak Password
    if (status === 422 || message.includes('already registered')) {
        if (message.includes('password')) {
            return {
                title: 'Weak Password',
                message: 'Your password should be at least 6 characters long.'
            };
        }
        return {
            title: 'Account Exists',
            message: 'This email is already registered. Try signing in instead.'
        };
    }

    // Network Errors
    if (message.includes('network request failed')) {
        return {
            title: 'Connection Error',
            message: "Cloudy can't reach the sky right now. Please check your internet connection."
        };
    }

    // General Fallback
    return {
        title: 'Something went wrong',
        message: error.message || 'An unexpected error occurred. Please try again later.'
    };
};
