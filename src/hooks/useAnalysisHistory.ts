import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DesignAnalysis } from '../types';
import { AnalysisRecord } from '../types';
import { encryptData, decryptData } from '../utils/encryption';

export function useAnalysisHistory(userId: string | undefined) {
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchAnalyses();
    }
  }, [userId]);

  const fetchAnalyses = async () => {
    if (!userId || !isSupabaseConfigured()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('design_analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Decrypt analysis data and transform
      const transformedData = (data || []).map(item => {
        let decryptedAnalysis;
        try {
          // Check if analysis_data is already an object (raw JSON from jsonb column)
          if (typeof item.analysis_data === 'object' && item.analysis_data !== null) {
            decryptedAnalysis = item.analysis_data;
          } else if (typeof item.analysis_data === 'string') {
            // Try to decrypt if it's a string
            decryptedAnalysis = decryptData(item.analysis_data);
          } else {
            throw new Error('Invalid analysis_data type');
          }
        } catch (error) {
          console.error('Failed to decrypt analysis data:', error);
          // If it's a string and decryption failed, try parsing as unencrypted JSON
          if (typeof item.analysis_data === 'string') {
            try {
              decryptedAnalysis = JSON.parse(item.analysis_data);
            } catch (parseError) {
              console.error('Failed to parse as JSON:', parseError);
              decryptedAnalysis = null;
            }
          } else {
            decryptedAnalysis = null;
          }
        }
        
        // Handle null decryption result
        if (decryptedAnalysis === null) {
          console.warn('Skipping analysis with invalid data:', item.id);
          decryptedAnalysis = {
            overall: 0,
            categories: {
              typography: { score: 0, feedback: 'Data unavailable', improvementIdeas: [] },
              colorHarmony: { score: 0, feedback: 'Data unavailable', improvementIdeas: [] },
              composition: { score: 0, feedback: 'Data unavailable', improvementIdeas: [] },
              hierarchy: { score: 0, feedback: 'Data unavailable', improvementIdeas: [] },
              spacing: { score: 0, feedback: 'Data unavailable', improvementIdeas: [] },
              contrast: { score: 0, feedback: 'Data unavailable', improvementIdeas: [] }
            },
            strengths: [],
            improvements: [],
            designPrinciples: []
          };
        }
        
        return {
          ...item,
          analysis_data: decryptedAnalysis,
          is_public: item.is_public,
          user: { username: 'User' }
        };
      });

      setAnalyses(transformedData as AnalysisRecord[]);
    } catch (error) {
      console.error('Error fetching analyses:', error);
      setAnalyses([]);
    } finally {
      setLoading(false);
    }
  };

  const saveAnalysis = async (fileName: string, analysis: DesignAnalysis, imageBlob?: Blob) => {
    if (!userId || !isSupabaseConfigured()) return;

    try {
      let imageUrl = null;
      
      // Upload image if provided
      if (imageBlob) {
        try {
          const fileExt = 'png';
          const filePath = `${userId}/${Date.now()}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('design-images')
            .upload(filePath, imageBlob, {
              contentType: 'image/png',
              upsert: false
            });

          if (uploadError) {
            console.error('Error uploading image:', uploadError);
            // Don't throw error for storage issues, just continue without image
            console.warn('Continuing without image upload due to storage policy restrictions');
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('design-images')
              .getPublicUrl(filePath);
            
            imageUrl = publicUrl;
          }
        } catch (storageError) {
          console.error('Storage upload failed:', storageError);
          console.warn('Continuing analysis save without image');
        }
      }
      
      // Encrypt sensitive analysis data before storing
      const encryptedAnalysis = encryptData(analysis);
      
      const { data, error } = await supabase
        .from('design_analyses')
        .insert({
          user_id: userId,
          file_name: fileName,
          analysis_data: encryptedAnalysis,
          image_url: imageUrl,
          is_public: false
        })
        .select()
        .single();

      if (error) throw error;
      
      // Refresh the list
      fetchAnalyses();
      return data;
    } catch (error) {
      console.error('Error saving analysis:', error);
      return null;
    }
  };

  const deleteAnalysis = async (id: string) => {
    if (!userId || !isSupabaseConfigured()) return;

    try {
      const { error } = await supabase
        .from('design_analyses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Refresh the list
      fetchAnalyses();
    } catch (error) {
      console.error('Error deleting analysis:', error);
    }
  };

  const togglePublic = async (id: string, isPublic: boolean) => {
    if (!userId || !isSupabaseConfigured()) return;

    try {
      const { error } = await supabase
        .from('design_analyses')
        .update({ is_public: isPublic })
        .eq('id', id);

      if (error) throw error;

      // Refresh the list
      fetchAnalyses();
    } catch (error) {
      console.error('Error toggling public status:', error);
    }
  };

  const getPublicAnalysis = async (id: string) => {
    if (!isSupabaseConfigured()) return null;

    try {
      // First try to get the analysis by ID (without public check to see if it exists)
      const { data: checkData, error: checkError } = await supabase
        .from('design_analyses')
        .select('id, is_public')
        .eq('id', id)
        .maybeSingle();
      
      // Check if analysis exists and is public (handle both 'yes' string and true boolean)
      if (!checkData) {
        return null;
      }
      
      const isPublic = checkData.is_public === true;
      if (!isPublic) {
        return null;
      }
      
      // Now fetch the full data with profiles join
      const { data, error } = await supabase
        .from('design_analyses')
        .select(`
          *,
          profiles!design_analyses_user_id_fkey (username)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Decrypt analysis data for public viewing
      let decryptedAnalysis;
      try {
        // Check if analysis_data is already an object (raw JSON from jsonb column)
        if (typeof data.analysis_data === 'object' && data.analysis_data !== null) {
          decryptedAnalysis = data.analysis_data;
        } else if (typeof data.analysis_data === 'string') {
          // Try to decrypt if it's a string
          decryptedAnalysis = decryptData(data.analysis_data);
        } else {
          throw new Error('Invalid analysis_data type');
        }
      } catch (error) {
        console.error('Failed to decrypt public analysis data:', error);
        // If it's a string and decryption failed, try parsing as unencrypted JSON
        if (typeof data.analysis_data === 'string') {
          try {
            decryptedAnalysis = JSON.parse(data.analysis_data);
          } catch (parseError) {
            console.error('Failed to parse as JSON:', parseError);
            decryptedAnalysis = data.analysis_data; // Fallback to original data
          }
        } else {
          decryptedAnalysis = data.analysis_data; // Fallback to original data
        }
      }

      return {
        ...data,
        analysis_data: decryptedAnalysis,
        user: {
          username: (data.profiles as any)?.username || 'User'
        }
      };
    } catch (error) {
      console.error('Error fetching public analysis:', error);
      return null;
    }
  };

  return {
    analyses,
    loading,
    saveAnalysis,
    deleteAnalysis,
    togglePublic,
    getPublicAnalysis,
  };
}
