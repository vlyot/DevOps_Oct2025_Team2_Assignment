const API_URL = "http://localhost:3000";

const getHeaders = (isMultipart = false) => {
  const token = localStorage.getItem("token");
  const headers: any = { Authorization: `Bearer ${token}` };
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
};

export const api = {
  // --- ADMIN: User Management ---
  getUsers: async () => {
    const res = await fetch(`${API_URL}/admin/users`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
  },

  createUser: async (user: any) => {
    const res = await fetch(`${API_URL}/admin/users`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(user),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create user");
    return data;
  },

  deleteUser: async (userId: string) => {
    const res = await fetch(`${API_URL}/admin/users/${userId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete user");
    return true;
  },

  // --- USER: File Management ---
  // Update the getFiles function
  getFiles: async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard/files`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      // If the backend sent an error object, return an empty array instead
      if (!res.ok || !Array.isArray(data)) {
        console.error("Backend error or invalid data format:", data);
        return [];
      }

      return data;
    } catch (err) {
      console.error("Network error:", err);
      return []; // Return empty array on network failure
    }
  },

  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_URL}/dashboard/upload`, {
      method: "POST",
      headers: getHeaders(true),
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data;
  },

  // CHANGED: Accepts ID now, not filename
  deleteFile: async (id: string) => {
    const res = await fetch(`${API_URL}/dashboard/files/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete file");
    return true;
  },

  // CHANGED: Accepts ID now
  getDownloadUrl: (id: string) => {
    return `${API_URL}/dashboard/download/${id}`;
  },
};
