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
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .eq('user_id', userId)
        .single();

    if (error) {
        throw new Error('Failed to fetch file');
    }

    return data;
}

// Download file
export async function downloadFile(fileId: string): Promise<void> {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
        .from('files')
        .select('storage_path, file_name')
        .eq('id', fileId)
        .eq('user_id', userId)
        .single();

    if (error || !data) {
        throw new Error('File not found');
    }

    const { data: content, error: storageError } = await supabase.storage
        .from('user-files')
        .download(data.storage_path);

    if (storageError || !content) {
        throw new Error('Failed to download file from storage');
    }
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = data.file_name;
    document.body.appendChild(a);
    a.click();
}

// Upload + create metadata
export async function createFile(file: File): Promise<void> {
    const userId = await getCurrentUserId();
    console.log(userId)
    const filePath = `${userId}/${crypto.randomUUID()}-${file.name}`;
    console.log("Storing in " + filePath)
    const { error: storageError } = await supabase.storage
        .from('user-files')
        .upload(filePath, file);

    if (storageError) {
        throw new Error('Storage upload failed');
    }

    const { error: insertError } = await supabase
        .from('files')
        .insert({
            user_id: userId,
            file_name: file.name,
            storage_path: filePath
        });

    if (insertError) {
        console.log(insertError)
        throw new Error('Failed to save file metadata');
    }
}

// Delete file
export async function deleteFile(fileId: string): Promise<void> {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
        .from('files')
        .select('storage_path')
        .eq('id', fileId)
        .eq('user_id', userId)
        .single();

    if (error || !data) {
        throw new Error('File not found');
    }

    const { error: storageError } = await supabase.storage
        .from('user-files')
        .remove([data.storage_path]);

    if (storageError) {
        throw new Error('Failed to delete file from storage');
    }

    const { error: deleteError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId)
        .eq('user_id', userId);

    if (deleteError) {
        throw new Error('Failed to delete file record');
    }
}

