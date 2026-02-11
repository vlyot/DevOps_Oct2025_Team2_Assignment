import { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';
import {
    fetchFilesByUserId,
    createFile,
    deleteFile,
    downloadFile
} from '../../services/userApi';
import { FileTable } from './FileTable';
import '../../user.css';

interface FileRecord {
    id: string;
    user_id: string;
    file_name: string;
    storage_path: string;
    created_at: string;
    uploaded_at: string;
}

export function UserDashboard() {
    const [files, setFiles] = useState<FileRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        init();
    }, []);

    async function init() {
        try {
        setLoading(true);

        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
            setError('No session');
            return;
        }

        const data = await fetchFilesByUserId(session.user.id);
        setFiles(data);
        } catch (err) {
        console.error(err);
        setError('Failed to load files');
        } finally {
        setLoading(false);
        }
    }

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return;

        try {
            setUploading(true);

            const file = e.target.files[0];

            await createFile(file);

            await init();
        } catch (err) {
            console.error(err);
            setError('Upload failed');
        } finally {
            setUploading(false);
        }
    }

    async function handleDelete(id: string) {
        try {
        await deleteFile(id);
        setFiles(prev => prev.filter(f => f.id !== id));
        } catch (err) {
        console.error(err);
        setError('Delete failed');
        }
    }

    async function handleDownload(id: string) {
        try {
            await downloadFile(id);
        } catch (err) {
            console.error(err);
            setError('Download failed');
        }
    }

    if (loading) return <p className='main-page'>Loading files...</p>;

    return (
        <div className="main-page">
            <div className="bucket-header">
                <h1>User Files</h1>
            </div>

            {error && <p>{error}</p>}
            <div className="bucket-header">
                <h2>Your Files</h2>
                <div className="upload-wrapper">
                    <input
                        type="file"
                        id="file-upload"
                        className="hidden-file-input"
                        onChange={handleUpload}
                    />
                    <label htmlFor="file-upload" className="upload-btn">
                        Upload
                    </label>
                </div>
            </div>
            <FileTable files={files} onDelete={handleDelete} onDownload={handleDownload}></FileTable>
        </div>
    );
}
