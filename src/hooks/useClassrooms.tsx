
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Classroom {
  id: string;
  name: string;
  description: string;
  area: string;
  address: string;
  phone: string;
  email: string;
  website_url: string;
  image_url: string;
  lesson_types: string[];
  age_range: string;
  monthly_fee_min: number;
  monthly_fee_max: number;
  trial_lesson_available: boolean;
  parking_available: boolean;
  published: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useClassrooms = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPublishedClassrooms = async (filters?: {
    area?: string;
    keyword?: string;
    ageGroups?: string[];
    features?: string[];
  }) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('classrooms')
        .select(`
          *,
          subscriptions!inner(status, current_period_end)
        `)
        .eq('published', true)
        .eq('subscriptions.status', 'active')
        .gte('subscriptions.current_period_end', new Date().toISOString());

      // エリアフィルター
      if (filters?.area && filters.area !== '') {
        query = query.ilike('area', `%${filters.area}%`);
      }

      // キーワード検索
      if (filters?.keyword && filters.keyword.trim() !== '') {
        query = query.or(`name.ilike.%${filters.keyword}%,description.ilike.%${filters.keyword}%,area.ilike.%${filters.keyword}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // フロントエンドでの追加フィルタリング
      let filteredData = data || [];

      // 年齢グループフィルター
      if (filters?.ageGroups && filters.ageGroups.length > 0) {
        filteredData = filteredData.filter(classroom => {
          return filters.ageGroups?.some(ageGroup => {
            const ageRange = classroom.age_range?.toLowerCase() || '';
            switch (ageGroup) {
              case 'toddler':
                return ageRange.includes('未就学') || ageRange.includes('幼児');
              case 'elementary':
                return ageRange.includes('小学') || ageRange.includes('子供');
              case 'junior':
                return ageRange.includes('中学');
              case 'high':
                return ageRange.includes('高校');
              case 'adult':
                return ageRange.includes('大人') || ageRange.includes('成人');
              default:
                return false;
            }
          });
        });
      }

      // 特徴フィルター
      if (filters?.features && filters.features.length > 0) {
        filteredData = filteredData.filter(classroom => {
          return filters.features?.some(feature => {
            const lessonTypes = classroom.lesson_types || [];
            const description = classroom.description?.toLowerCase() || '';
            
            switch (feature) {
              case 'beginner':
                return description.includes('初心者') || description.includes('はじめて');
              case 'advanced':
                return description.includes('上級') || description.includes('専門');
              case 'online':
                return description.includes('オンライン') || description.includes('リモート');
              case 'recital':
                return classroom.trial_lesson_available || description.includes('発表会');
              case 'group':
                return description.includes('グループ') || description.includes('集団');
              case 'individual':
                return description.includes('個人') || description.includes('マンツーマン');
              case 'eurythmics':
                return lessonTypes.includes('リトミック') || description.includes('リトミック');
              default:
                return false;
            }
          });
        });
      }

      setClassrooms(filteredData);
    } catch (error) {
      console.error('教室データ取得エラー:', error);
      setClassrooms([]);
    } finally {
      setLoading(false);
    }
  };

  const getClassroomById = async (id: string): Promise<Classroom | null> => {
    try {
      const { data, error } = await supabase
        .from('classrooms')
        .select(`
          *,
          subscriptions!inner(status, current_period_end)
        `)
        .eq('id', id)
        .eq('published', true)
        .eq('subscriptions.status', 'active')
        .gte('subscriptions.current_period_end', new Date().toISOString())
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('教室詳細取得エラー:', error);
      return null;
    }
  };

  return {
    classrooms,
    loading,
    fetchPublishedClassrooms,
    getClassroomById,
  };
};
