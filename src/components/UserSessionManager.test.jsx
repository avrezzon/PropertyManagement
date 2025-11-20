import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UserSessionManager from './UserSessionManager';

// Mock axios
vi.mock('axios');

describe('UserSessionManager', () => {
    const mockUser = {
        token: { access_token: 'mock-token' },
        profile: { name: 'Test User', given_name: 'Test' }
    };

    it('renders guest mode when no user', () => {
        render(<UserSessionManager user={null} currentData={{}} />);
        expect(screen.getByText('Guest Mode')).toBeInTheDocument();
    });

    it('shows unsaved changes badge when isDirty is true', () => {
        render(<UserSessionManager user={null} isDirty={true} currentData={{}} />);
        expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
    });

    it('hides unsaved changes badge when isDirty is false', () => {
        render(<UserSessionManager user={null} isDirty={false} currentData={{}} />);
        expect(screen.queryByText('Unsaved Changes')).not.toBeInTheDocument();
    });

    it('shows login button for guests', () => {
        const onLogin = vi.fn();
        render(<UserSessionManager user={null} onLogin={onLogin} currentData={{}} />);
        expect(screen.getByText('Login with Google')).toBeInTheDocument();
    });
});
