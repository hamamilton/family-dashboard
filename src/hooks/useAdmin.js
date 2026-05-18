import { useState, useCallback } from 'react';

const PB_URL = 'https://hamilton-family-db.fly.dev';

async function safeJson(res) {
    try {
        return await res.json();
    } catch {
        return null;
    }
}

export function useAdmin() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminToken, setAdminToken] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const login = useCallback(async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const endpoints = [
                '/api/collections/_superusers/auth-with-password',
                '/api/admins/auth-with-password',
            ];

            for (const endpoint of endpoints) {
                const res = await fetch(`${PB_URL}${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identity: email, password }),
                });

                const data = await safeJson(res);
                if (res.ok && data?.token) {
                    setAdminToken(data.token);
                    setIsAdmin(true);
                    return true;
                }

                // Invalid credentials should stop trying alternate endpoints.
                if (res.status === 400 || res.status === 401 || res.status === 403) {
                    break;
                }
            }

            setError('Invalid credentials. Try again.');
            return false;
        } catch {
            setIsAdmin(false);
            setAdminToken(null);
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
        if (!adminToken) {
            throw new Error('Not authenticated. Please log in again.');
        }

        const opts = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': adminToken,
            },
        };
        if (body) opts.body = JSON.stringify(body);
        const res = await fetch(`${PB_URL}${path}`, opts);

        const data = await safeJson(res);
        if (!res.ok) {
            const message = data?.message || data?.error || `Request failed (${res.status})`;
            throw new Error(message);
        }

        return data;
    }, [adminToken]);

    return { isAdmin, adminToken, loading, error, login, logout, adminRequest };
}
