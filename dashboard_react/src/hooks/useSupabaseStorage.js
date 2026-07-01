import { useState, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "../config/supabase";

const BUCKET_NAME = "relatorios";

export function useSupabaseStorage() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const uploadFile = useCallback(async (file, path) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error("Supabase Storage nao configurado");
    }

    setUploading(true);
    setError(null);

    try {
      const filePath = path || `${Date.now()}_${file.name}`;

      const { data, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      return { path: filePath, url: urlData.publicUrl };
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setUploading(false);
    }
  }, []);

  const downloadFile = useCallback(async (path) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error("Supabase Storage nao configurado");
    }

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(path);

    if (error) throw error;
    return data;
  }, []);

  const listFiles = useCallback(async (folder = "") => {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(folder, { limit: 100, sortBy: { column: "created_at", order: "desc" } });

    if (error) throw error;
    return data || [];
  }, []);

  const deleteFile = useCallback(async (path) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error("Supabase Storage nao configurado");
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) throw error;
  }, []);

  const getPublicUrl = useCallback((path) => {
    if (!isSupabaseConfigured || !supabase) return null;
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);
    return data?.publicUrl || null;
  }, []);

  return {
    uploadFile,
    downloadFile,
    listFiles,
    deleteFile,
    getPublicUrl,
    uploading,
    error,
  };
}
