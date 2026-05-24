import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const storedUser = localStorage.getItem('user');
            const token = localStorage.getItem('token');

            if (token) {
                try {
                    // Fetch fresh user data to get updated flags
                    const response = await api.get('/api/user');
                    if (response.data.success) {
                        const userData = response.data.data;
                        setUser(userData);
                        localStorage.setItem('user', JSON.stringify(userData));
                    } else if (storedUser) {
                        setUser(JSON.parse(storedUser));
                    }
                } catch (err) {
                    if (storedUser) setUser(JSON.parse(storedUser));
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (username, password) => {
        try {
            const response = await api.post('/api/login', { username, password });
            const { token, user: userData } = response.data.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);

            return { success: true, role: userData.role };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Gagal login. Periksa username dan password.'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('adminPeriodConfirmed');
        localStorage.removeItem('adminViewYear');
        localStorage.removeItem('adminViewSemester');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
