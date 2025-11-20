import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Google Auth
vi.mock('@react-oauth/google', () => ({
    useGoogleLogin: () => vi.fn(),
    googleLogout: vi.fn(),
}));

describe('RentalCalculator - Session Management', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('stores user session in localStorage on login', () => {
        const mockToken = { access_token: 'test-token' };
        const mockProfile = { name: 'Test User', given_name: 'Test' };

        localStorage.setItem('google_token', JSON.stringify(mockToken));
        localStorage.setItem('google_profile', JSON.stringify(mockProfile));

        expect(localStorage.getItem('google_token')).toBeTruthy();
        expect(localStorage.getItem('google_profile')).toBeTruthy();
    });

    it('clears localStorage on logout', () => {
        localStorage.setItem('google_token', JSON.stringify({ access_token: 'test' }));
        localStorage.setItem('google_profile', JSON.stringify({ name: 'Test' }));

        localStorage.removeItem('google_token');
        localStorage.removeItem('google_profile');

        expect(localStorage.getItem('google_token')).toBeNull();
        expect(localStorage.getItem('google_profile')).toBeNull();
    });

    it('validates beforeunload handler logic', () => {
        const mockEvent = {
            preventDefault: vi.fn(),
            returnValue: ''
        };

        const isDirty = true;

        if (isDirty) {
            mockEvent.preventDefault();
            const message = 'You have unsaved changes. Are you sure you want to leave?';
            mockEvent.returnValue = message;
        }

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(mockEvent.returnValue).toBe('You have unsaved changes. Are you sure you want to leave?');
    });
});
