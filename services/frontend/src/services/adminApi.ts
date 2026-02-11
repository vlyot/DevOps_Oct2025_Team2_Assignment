const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const createUser = async (userData: any) => {
  // 1. Get the token from storage
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // <--- ADD THIS LINE
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to create user");
  return data;
};

// New function to fetch the list from Supabase
export const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_URL}/admin/users`, {
        method: 'GET',
        headers: { 
            'Authorization': `Bearer ${token}` 
        }
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch users');
    
    return data;
};
