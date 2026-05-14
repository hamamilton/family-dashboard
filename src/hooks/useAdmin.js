import { useState, useCallback } from 'react';

const PB_URL = 'https://hamilton-family-db.fly.dev';

export function useAdmin() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminToken, setAdminToken] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const login = useCallback(async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identity: email, password }),
            });
            const data = await res.json();
            if (data.token) {
                setAdminToken(data.token);
                setIsAdmin(true);
                return true;
            }
            setError('Invalid credentials. Try again.');
            return false;
        } catch {
            setError('Could not reach the database.');
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        setAdminToken(null);
        setIsAdmin(false);
    }, []);

    const adminRequest = useCallback(async (path, method = 'GET', body = null) => {
        const opts = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': adminToken,
            },
        };
        if (body) opts.body = JSON.stringify(body);
        const res = await fetch(`${PB_URL}${path}`, opts);
        return res.json();
    }, [adminToken]);

    return { isAdmin, adminToken, loading, error, login, logout, adminRequest };
}
