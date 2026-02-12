import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';

export const fileController = {
  
  // 1. UPLOAD (Storage + DB Insert)
  uploadFile: async (req: Request, res: Response) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Get User ID from the token (set by authMiddleware)
    const userId = (req as any).user.id; 

    try {
      // A. Upload to Supabase Storage Bucket ("uploads")
      const uniquePath = `${userId}/${Date.now()}-${req.file.originalname}`;
      
      const { error: uploadError } = await supabase
        .storage
        .from('uploads')
        .upload(uniquePath, req.file.buffer, {
          contentType: req.file.mimetype
        });

      if (uploadError) throw uploadError;

      // B. Insert Metadata into 'files' Table
      const { data: dbData, error: dbError } = await supabase
        .from('files')
        .insert({
          user_id: userId,
          filename: req.file.originalname,
          storage_path: uniquePath,
          file_size: req.file.size,
          mime_type: req.file.mimetype
        })
        .select()
        .single();

      if (dbError) throw dbError;

      res.status(201).json({ message: 'File uploaded', file: dbData });

    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: 'Upload failed: ' + err.message });
    }
  },

  // 2. LIST FILES (Query Table)
  listFiles: async (req: Request, res: Response) => {
    const userId = (req as any).user.id; 

    try {
      // We query the TABLE, not the bucket. It's much faster.
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  // 3. DOWNLOAD FILE
  downloadFile: async (req: Request, res: Response) => {
    const fileId = req.params.id; // This is the Table ID
    const userId = (req as any).user.id; 

    try {
      // A. Get file info from Table first
      const { data: fileRecord, error: dbError } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .eq('user_id', userId) // Security Check
        .single();

      if (dbError || !fileRecord) return res.status(404).json({ error: 'File not found' });

      // B. Download stream from Storage
      const { data, error: storageError } = await supabase
        .storage
        .from('uploads')
        .download(fileRecord.storage_path);

      if (storageError) throw storageError;

      // C. Send to User
      const buffer = Buffer.from(await data.arrayBuffer());
      res.setHeader('Content-Type', fileRecord.mime_type);
      res.setHeader('Content-Disposition', `attachment; filename="${fileRecord.filename}"`);
      res.send(buffer);

    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  // 4. DELETE (Storage + DB Delete)
  deleteFile: async (req: Request, res: Response) => {
    const fileId = req.params.id;
    const userId = (req as any).user.id; 

    try {
      // A. Get file path from Table
      const { data: fileRecord, error: fetchError } = await supabase
        .from('files')
        .select('storage_path')
        .eq('id', fileId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !fileRecord) return res.status(404).json({ error: 'File not found' });

      // B. Delete from Storage Bucket
      const { error: storageError } = await supabase
        .storage
        .from('uploads')
        .remove([fileRecord.storage_path]);

      if (storageError) throw storageError;

      // C. Delete from Table
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      res.json({ message: 'File deleted successfully' });

    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
};