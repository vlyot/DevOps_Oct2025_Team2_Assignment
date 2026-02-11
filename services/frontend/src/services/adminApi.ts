const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const createUser = async (userData: any) => {
    const response = await fetch(`${API_URL}/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create user');
    return data;
};

// New function to fetch the list from Supabase
export const fetchUsers = async () => {
    // Note: You'll need to create a GET route in your backend for this later
    // For now, we will rely on the local state update in the Dashboard
    return []; 
};