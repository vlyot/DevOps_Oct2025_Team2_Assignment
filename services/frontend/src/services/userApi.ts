import { supabase } from '../../supabaseClient';

export interface FileRecord {
    id: string;
    user_id: string;
    file_name: string;
    storage_path: string;
    created_at: string;
    uploaded_at: string;
}

// Get current session user
async function getCurrentUserId(): Promise<string> {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
        throw new Error('User not authenticated');
    }
    return data.user.id;
}

// Fetch all files for current user
export async function fetchFilesByUserId(
    userId: string
): Promise<FileRecord[]> {
    const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        throw new Error('Failed to fetch files');
    }

    return data ?? [];
}


// Fetch single file by id
export async function fetchFileById(fileId: string): Promise<FileRecord | null> {
    return null
}

// Download file
export async function downloadFile(fileId: string): Promise<void> {

}

// Upload + create metadata
export async function createFile(file: File): Promise<void> {

}

// Delete file
export async function deleteFile(fileId: string): Promise<void> {

}

