const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const createUser = async (userData: any) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to create user");
  return data;
};

export const fetchUsers = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/admin/users`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to fetch users");

  return data;
};

export const deactivateUser = async (userId: string) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/admin/users/${userId}/deactivate`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to deactivate user");

  return data;
};

export const deleteUserByEmail = async (email: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/admin/users/email/${email}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
    }
    return true;
};

export const updateUserRoleByEmail = async (email: string, newRole: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/admin/users/email/${email}/role`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update role');
    }
    return await response.json();
};
