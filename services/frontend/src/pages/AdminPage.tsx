import { useEffect, useState } from 'react';
import { AdminDashboard } from '../features/admin/AdminDashboard';
import { supabase } from '../../supabaseClient';

const TEMP_ADMIN_EMAIL = import.meta.env.VITE_TEMP_ADMIN_EMAIL as string;
const TEMP_ADMIN_PASSWORD = import.meta.env.VITE_TEMP_ADMIN_PASSWORD as string;

export default function AdminPage() {
    const [loading, setLoading] = useState(true);
    const [isAuthed, setIsAuthed] = useState(false);
    const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);

    // Temp admin login
    useEffect(() => {
        initAuth();
        const getSession = async () => {
        const { data } = await supabase.auth.getSession();
    };

    getSession();
    }, []);

    async function initAuth() {
        const {
        data: { session },
        } = await supabase.auth.getSession();

        if (session) {
            setIsAuthed(true);
            const role = await getRole(session.user.id);
            setUserRole(role);
            setLoading(false);
        return;
        }
        const isTest = true;
        if (isTest) {
        const { error } = await supabase.auth.signInWithPassword({
            email: TEMP_ADMIN_EMAIL,
            password: TEMP_ADMIN_PASSWORD,
        });

        if (!error) {
            setIsAuthed(true);
        }
        }
        

        setLoading(false);
    }

    async function getRole(userId: string): Promise<'admin' | 'user' | null> {
        const { data, error } = await supabase
        .from('users') 
        .select('role')
        .eq('id', userId)
        .maybeSingle();

        if (error) {
        return null;
        }
        return data?.role ?? null;
    }

    if (loading) {
        return <p className="main-page">Initializing session...</p>;
    }

    if (userRole != "admin"){
        return <p className="main-page">No access</p>;
    }
    return (
        <AdminDashboard>
        </AdminDashboard>
    );
}
