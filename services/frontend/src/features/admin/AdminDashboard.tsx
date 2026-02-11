import { useEffect, useState } from "react";
import {
  createUser,
  fetchUsers,
  deleteUserByEmail,
  updateUserRoleByEmail,
} from "../../services/adminApi"; // Removed fetchUsers for now to keep it simple
import CreateUserForm from "./CreateUserForm";

// Simplified User interface to match our local backend
interface User {
  id: number;
  email: string;
  role: string;
}

export function AdminDashboard() {
  // Change ID to string because Supabase IDs are UUID strings (e.g., "a1b2-c3d4...")
  interface User {
    id: string;
    email: string;
    role: string;
  }

  const [users, setUsers] = useState<User[]>([]);
  const [status, setStatus] = useState("");

  // 1. Load users when the page opens
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users", error);
    }
  };

  const handleCreate = async (
    email: string,
    password: string,
    role: string
  ) => {
    try {
      setStatus("Creating user...");
      await createUser({ email, password, role });
      setStatus("✅ User created successfully!");

      // Reload the list to see the new user
      loadUsers();
    } catch (err: any) {
      console.error("Error creating user:", err);
      setStatus(`❌ Error: ${err.message}`);
    }
  };

  const handleDelete = async (email: string) => {
    if (!confirm(`Are you sure you want to delete ${email}?`)) return;

    try {
      setStatus("Deleting...");
      await deleteUserByEmail(email); // Call the new email-based function

      // Refresh the list from the server to ensure accuracy
      const updatedUsers = await fetchUsers();
      setUsers(updatedUsers);

      setStatus("✅ User deleted successfully");
    } catch (error: any) {
      setStatus(`❌ Delete failed: ${error.message}`);
    }
  };

  const handleRoleChange = async (email: string, currentRole: string) => {
    // Simple toggle: if admin, make user. If user, make admin.
    const newRole = currentRole === "admin" ? "user" : "admin";

    try {
      setStatus("Updating role...");
      await updateUserRoleByEmail(email, newRole);

      // Update local state so the UI changes immediately
      setUsers(
        users.map((u) => (u.email === email ? { ...u, role: newRole } : u))
      );

      setStatus(`✅ ${email} is now ${newRole}`);
    } catch (error: any) {
      setStatus(`❌ Update failed: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Admin Control Panel</h1>
      <p>Welcome to the simplified admin area. You can create users here.</p>
      <hr style={{ margin: "20px 0" }} />

      {/* Render the form and pass our handleCreate function */}
      <CreateUserForm onSuccess={() => console.log("Refresh triggered")} />

      <div style={{ marginTop: "40px" }}>
        <h3>Current Users (This Session)</h3>
        {users.length === 0 ? (
          <p>No users created yet in this session.</p>
        ) : (
          <table className="user-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleRoleChange(user.email, user.role)}
                      className="btn-secondary"
                    >
                      Change Role
                    </button>
                    <button
                      onClick={() => handleDelete(user.email)}
                      className="btn-danger"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {status && (
        <p style={{ marginTop: "20px", fontStyle: "italic" }}>{status}</p>
      )}
    </div>
  );
}
