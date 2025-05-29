import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  ClassroomWithSubscriptions, 
  ClassroomFilters,
  UseClassroomsReturn,
  shouldShowClassroom,
  SUBSCRIPTION_ERROR_MESSAGES,
  SubscriptionStatus
} from '@/types/classroom';

export const useClassrooms = (): UseClassroomsReturn => {
  const [classrooms, setClassrooms] = useState<ClassroomWithSubscriptions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPublishedClassrooms = async (filters?: ClassroomFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      // 本番仕様：確実なクエリで教室データを取得
      let query = supabase
        .from('classrooms')
        .select('*')
        .eq('published', true);

      // エリアフィルター
      if (filters?.area && filters.area !== '') {
        query = query.ilike('area', `%${filters.area}%`);
      }

      // キーワード検索
      if (filters?.keyword && filters.keyword.trim() !== '') {
        query = query.or(`name.ilike.%${filters.keyword}%,description.ilike.%${filters.keyword}%,area.ilike.%${filters.keyword}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('教室検索エラー:', error);
        throw new Error(SUBSCRIPTION_ERROR_MESSAGES.GENERAL_ERROR);
      }

      // 型安全な変換
      const classroomsData = (data || []);
      
      // 本番仕様：各教室のサブスクリプション情報を個別取得して結合
      const classroomsWithSubscriptions: ClassroomWithSubscriptions[] = await Promise.all(
        classroomsData.map(async (classroom) => {
          // 教室所有者のサブスクリプション情報を取得
          const { data: subscriptionsData } = await supabase
            .from('subscriptions')
            .select('status, current_period_end')
            .eq('user_id', classroom.user_id);
          
          return {
            ...classroom,
            subscriptions: (subscriptionsData as SubscriptionStatus[]) || null
          };
        })
      );

      // 本番ビジネスロジック適用（妥協なし）
      const validClassrooms = classroomsWithSubscriptions.filter(shouldShowClassroom);

      // レッスンタイプフィルター
      let filteredData = validClassrooms;
      if (filters?.lessonTypes && filters.lessonTypes.length > 0) {
        filteredData = filteredData.filter(classroom => {
          const lessonTypes = classroom.lesson_types || [];
          return filters.lessonTypes?.some(lessonType => 
            lessonTypes.includes(lessonType)
          );
        });
      }

      // 年齢グループフィルター
      if (filters?.ageGroups && filters.ageGroups.length > 0) {
        filteredData = filteredData.filter(classroom => {
          return filters.ageGroups?.some(ageGroup => {
            const ageRange = classroom.age_range?.toLowerCase() || '';
            switch (ageGroup) {
              case 'toddler':
                return ageRange.includes('幼児') || ageRange.includes('toddler');
              case 'elementary':
                return ageRange.includes('小学') || ageRange.includes('elementary');
              case 'junior_high':
                return ageRange.includes('中学') || ageRange.includes('junior_high');
              case 'high_school':
                return ageRange.includes('高校') || ageRange.includes('high_school');
              case 'adult':
                return ageRange.includes('大人') || ageRange.includes('adult');
              case 'senior':
                return ageRange.includes('シニア') || ageRange.includes('senior');
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
              default:
                return false;
            }
          });
        });
      }

      setClassrooms(filteredData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '教室データの取得に失敗しました';
      console.error('教室データ取得エラー:', error);
      setError(errorMessage);
      setClassrooms([]);
      
      toast({
        title: "エラー",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getClassroomById = useCallback(async (id: string): Promise<ClassroomWithSubscriptions | null> => {
    try {
      const { data, error } = await supabase
        .from('classrooms')
        .select('*')
        .eq('id', id)
        .eq('published', true)
        .maybeSingle();

      if (error) {
        console.error('教室詳細取得エラー:', error);
        throw new Error(SUBSCRIPTION_ERROR_MESSAGES.GENERAL_ERROR);
      }
      
      if (!data) return null;
      
      // 教室所有者のサブスクリプション情報を取得
      const { data: subscriptionsData } = await supabase
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('user_id', data.user_id);
      
      const typedClassroom: ClassroomWithSubscriptions = {
        ...data,
        subscriptions: (subscriptionsData as SubscriptionStatus[]) || null
      };
      
      return typedClassroom;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '教室詳細の取得に失敗しました';
      console.error('教室詳細取得エラー:', error);
      
      toast({
        title: "エラー",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    }
  }, [supabase, toast]);

  const getClassroomByIdForPreview = useCallback(async (id: string, currentUserId?: string): Promise<ClassroomWithSubscriptions | null> => {
    try {
      // プレビューは必ずログイン済み所有者による確認
      if (!currentUserId) {
        console.error('プレビューはログイン必須です');
        return null;
      }

      const { data, error } = await supabase
        .from('classrooms')
        .select('*')
        .eq('id', id)
        .eq('user_id', currentUserId) // 所有者の教室のみ取得
        .maybeSingle();

      if (error) {
        console.error('プレビュー教室詳細取得エラー:', error);
        throw new Error(SUBSCRIPTION_ERROR_MESSAGES.GENERAL_ERROR);
      }
      
      if (!data) {
        console.log('所有者の教室が見つかりません:', { id, currentUserId });
        return null;
      }
      
      // 教室所有者のサブスクリプション情報を取得
      const { data: subscriptionsData } = await supabase
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('user_id', data.user_id);
      
      const typedClassroom: ClassroomWithSubscriptions = {
        ...data,
        subscriptions: (subscriptionsData as SubscriptionStatus[]) || null
      };
      
      return typedClassroom;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'プレビュー教室詳細の取得に失敗しました';
      console.error('プレビュー教室詳細取得エラー:', error);
      
      toast({
        title: "エラー",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    }
  }, []);

  return {
    classrooms,
    loading,
    error,
    fetchPublishedClassrooms,
    getClassroomById,
    getClassroomByIdForPreview,
  };
};
