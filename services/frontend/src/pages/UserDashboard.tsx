import { useEffect, useState } from "react";
import { api } from "../services/api";

export const UserDashboard = () => {
  const [files, setFiles] = useState<any[]>([]); // Initialize as empty array
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const loadFiles = async () => {
    try {
      const data = await api.getFiles();
      // SAFETY CHECK: Ensure data is an array before setting state
      if (Array.isArray(data)) {
        setFiles(data);
      } else {
        console.error("Received non-array data:", data);
        setFiles([]);
      }
    } catch (err) {
      console.error("Failed to load files:", err);
      setFiles([]);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    setMessage("");

    try {
      await api.uploadFile(e.target.files[0]);
      setMessage("Upload successful!");
      loadFiles(); 
    } catch (err: any) {
      setMessage(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      if (e.target) e.target.value = ""; // Clear file input
    }
  };

  const handleDownload = (id: string, filename: string) => {
    const token = localStorage.getItem("token");

    // Point to the ID-based download URL
    fetch(api.getDownloadUrl(id), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Download failed");
        return response.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename; // Use the original filename for the saved file
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      })
      .catch((err) => alert("Download failed: " + err.message));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      await api.deleteFile(id);
      loadFiles(); 
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Personal Files</h1>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = "/login";
          }}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm transition"
        >
          Logout
        </button>
      </div>

      {/* --- UPLOAD BOX --- */}
      <div className="bg-blue-50 p-8 rounded-xl border-2 border-dashed border-blue-200 mb-8 text-center">
        <label className="block text-sm font-bold text-blue-900 mb-4">
          {uploading ? "Processing..." : "Select a file to upload to your secure storage"}
        </label>
        <input
          type="file"
          onChange={handleUpload}
          disabled={uploading}
          className="mx-auto block w-full max-w-xs text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer disabled:opacity-50"
        />
        {message && (
          <p className={`mt-4 text-sm font-medium ${message.includes("failed") ? "text-red-600" : "text-green-600"}`}>
            {message}
          </p>
        )}
      </div>

      {/* --- FILE LIST --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700">Storage Overview</h2>
        </div>
        
        {/* Safety Check for Array */}
        {!Array.isArray(files) || files.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-xl">📁</p>
            <p className="mt-2">No files found.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {files.map((file) => (
              <li key={file.id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition">
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800">{file.filename}</span>
                  <span className="text-xs text-gray-400">
                    {(file.file_size / 1024).toFixed(1)} KB • {new Date(file.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleDownload(file.id, file.filename)}
                    className="text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-md text-sm font-medium transition"
                  >
                    Download
                  </button>
                  <button 
                    onClick={() => handleDelete(file.id)}
                    className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-md text-sm font-medium transition"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};