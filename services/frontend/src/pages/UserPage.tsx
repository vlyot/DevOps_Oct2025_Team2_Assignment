import { useEffect, useState } from 'react';
import { UserDashboard } from '../features/user/userDashboard';
import { supabase } from '../../supabaseClient';
import '../../user.css';

const TEMP_USER_EMAIL = import.meta.env.VITE_TEMP_USER_EMAIL as string;
const TEMP_USER_PASSWORD = import.meta.env.VITE_TEMP_USER_PASSWORD as string;

export default function UserPage() {
    const [loading, setLoading] = useState(true);
    const [isAuthed, setIsAuthed] = useState(false);
    const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);

    useEffect(() => {
        initAuth();
    }, []);

    async function initAuth() {
        try {
        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (session) {
            setIsAuthed(true);
            const role = await getRole(session.user.id);
            setUserRole(role);
            return;
        }

        const isTest = true;

        if (isTest) {
            const { error } = await supabase.auth.signInWithPassword({
            email: TEMP_USER_EMAIL,
            password: TEMP_USER_PASSWORD,
            });

            if (!error) {
            setIsAuthed(true);

            const {
                data: { session: newSession },
            } = await supabase.auth.getSession();

            if (newSession) {
                const role = await getRole(newSession.user.id);
                setUserRole(role);
            }
            }
        }
        } finally {
        setLoading(false);
        }
    }

    async function getRole(
        userId: string
    ): Promise<'admin' | 'user' | null> {
        const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

        if (error) return null;
        return data?.role ?? null;
    }

    if (loading) {
        return <p>Initializing session...</p>;
    }

    if (!isAuthed) {
        return <p>Not authenticated</p>;
    }

    if (userRole !== 'user') {
        return <p>No access</p>;
    }

    return <UserDashboard />;
}
