// Simple API service for Admin actions

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const createUser = async (userData: any) => {
    console.log("Sending create request:", userData);
    
    const response = await fetch(`${API_URL}/admin/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // We are skipping the 'Authorization' header for now to keep it simple
        },
        body: JSON.stringify(userData),
    });

    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
    }
    
    return data;
};

// We can add getUsers() here later













/*const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface User {
    id: string;
    email: string;
    role: string;
    created_at: string;
    last_sign_in_at?: string;
    email_confirmed_at?: string;
}

interface AdminUsersResponse {
    users: User[];
    count: number;
}

interface CreateUserResponse {
    message: string;
    user: {
        id: string;
        email: string;
        role: string;
        created_at: string;
    };
}

interface DeleteUserResponse {
    message: string;
    deleted_id: string;
}

interface UpdateRoleResponse {
    message: string;
    user_id: string;
    new_role: string;
}

// Get auth token from localStorage
function getAuthToken(): string {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }
    return token;
}

// Fetch all users
export async function fetchUsers(): Promise<User[]> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch users');
    }

    const data: AdminUsersResponse = await response.json();
    return data.users;
}

// Create new user
export async function createUser(payload: {
    email: string;
    password: string;
    role: 'admin' | 'user';
}): Promise<CreateUserResponse> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
    }

    return response.json();
}

// Delete user
export async function deleteUser(userId: string): Promise<DeleteUserResponse> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
    }

    return response.json();
}

// Update user role
export async function updateUserRole(userId: string, role: 'admin' | 'user'): Promise<UpdateRoleResponse> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update role');
    }

    return response.json();
}*/
