import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { 
  School, 
  ImageUp, 
  CalendarDays, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Users, 
  Info,
  Star,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle
} from "lucide-react";

import { useAuth } from "@/providers/AuthProvider";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { AGE_GROUPS, LESSON_TYPES, WEEKDAYS } from "@/constants/classroomData";
import Layout from "@/components/layout/Layout";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { InputWithCounter } from "@/components/ui/input-with-counter";
import { Textarea } from "@/components/ui/textarea";
import { TextareaWithCounter } from "@/components/ui/textarea-with-counter";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// 都道府県一覧
const prefectures = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
];

// 文字数制限の定数定義
const FIELD_LIMITS = {
  name: 50,           // 教室名：一般的な店舗名・サービス名
  description: 1000,   // 教室の説明：詳細な紹介文
  city: 50,           // 市区町村：地名
  address: 100,       // 番地・建物名など：住所詳細
  phone: 20,          // 電話番号：ハイフン含む
  email: 100,         // メールアドレス：一般的な制限
  website_url: 200,   // ウェブサイトURL：長いURLにも対応
  available_times: 200, // レッスン時間帯：複数時間帯記述
  price_range: 300,   // 料金目安：複数コース記述
  instructor_info: 800, // 講師紹介：経歴・実績等
  pr_points: 800,     // PRポイント：アピールポイント
} as const;

// フォームのバリデーションスキーマ
const formSchema = z.object({
  name: z.string()
    .min(1, { message: "教室名を入力してください。" })
    .max(FIELD_LIMITS.name, { message: `教室名は${FIELD_LIMITS.name}文字以内で入力してください。` }),
  description: z.string()
    .min(10, { message: "教室の魅力が伝わるよう、最低10文字以上でご記入ください。" })
    .max(FIELD_LIMITS.description, { message: `教室の説明は${FIELD_LIMITS.description}文字以内で入力してください。` }),
  prefecture: z.string({ required_error: "都道府県を選択してください。" }),
  city: z.string()
    .min(1, { message: "市区町村名を入力してください。例：新宿区" })
    .max(FIELD_LIMITS.city, { message: `市区町村名は${FIELD_LIMITS.city}文字以内で入力してください。` }),
  address: z.string()
    .max(FIELD_LIMITS.address, { message: `番地・建物名は${FIELD_LIMITS.address}文字以内で入力してください。` })
    .optional(),
  phone: z.string()
    .max(FIELD_LIMITS.phone, { message: `電話番号は${FIELD_LIMITS.phone}文字以内で入力してください。` })
    .optional(),
  email: z.string()
    .email({ message: "有効なメールアドレスの形式で入力してください。例：info@example.com" })
    .max(FIELD_LIMITS.email, { message: `メールアドレスは${FIELD_LIMITS.email}文字以内で入力してください。` }),
  website_url: z.string()
    .url({ message: "有効なURLの形式で入力してください。例：https://example.com" })
    .max(FIELD_LIMITS.website_url, { message: `ウェブサイトURLは${FIELD_LIMITS.website_url}文字以内で入力してください。` })
    .optional(),
  lesson_types: z.array(z.string()).min(1, { message: "レッスン種類を少なくとも1つ選択してください。" }),
  target_ages: z.array(z.string()).min(1, { message: "対象年齢を少なくとも1つ選択してください。" }),
  available_days: z.array(z.string()).min(1, { message: "レッスン可能曜日を少なくとも1つ選択してください。" }),
  available_times: z.string()
    .max(FIELD_LIMITS.available_times, { message: `レッスン時間帯は${FIELD_LIMITS.available_times}文字以内で入力してください。` })
    .optional(),
  price_range: z.string()
    .min(1, { message: "料金目安を入力してください。例：月謝8,000円～" })
    .max(FIELD_LIMITS.price_range, { message: `料金目安は${FIELD_LIMITS.price_range}文字以内で入力してください。` }),
  instructor_info: z.string()
    .max(FIELD_LIMITS.instructor_info, { message: `講師紹介は${FIELD_LIMITS.instructor_info}文字以内で入力してください。` })
    .optional(),
  pr_points: z.string()
    .max(FIELD_LIMITS.pr_points, { message: `PRポイントは${FIELD_LIMITS.pr_points}文字以内で入力してください。` })
    .optional(),
});

type ClassroomFormValues = z.infer<typeof formSchema>;

// existingClassroom state がDBの published 状態を保持できるように型を拡張
interface ExtendedClassroomFormValues extends ClassroomFormValues {
  id?: string; // id をオプショナルで追加
  publishedDbState?: boolean; // DBから読み込んだ実際の公開状態
  thumbnail_url?: string | null; // DBから読み込んだサムネイルURL
  image_urls?: string[] | null; // DBから読み込んだ画像URLリスト
  last_draft_saved_at?: string | null; // last_draft_saved_at をオプショナルで追加
}

// 型定義の追加
interface DatabaseClassroom {
  id: string;
  name: string;
  description: string;
  area: string;
  address: string;
  phone: string | null;
  email: string;
  website_url: string | null;
  lesson_types: string[];
  age_range: string;
  image_urls: string[] | null;
  thumbnail_url: string | null;
  available_days: string[];
  available_times: string | null;
  price_range: string;
  instructor_info: string | null;
  pr_points: string | null;
  monthly_fee_min: number | null;
  monthly_fee_max: number | null;
  trial_lesson_available: boolean;
  parking_available: boolean;
  published: boolean;
  draft_saved: boolean;
  last_draft_saved_at: string | null;
  updated_at: string;
  user_id: string;
}

const ClassroomRegistration = () => {
  const [images, setImages] = useState<File[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [thumbnailIndex, setThumbnailIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [existingClassroom, setExistingClassroom] = useState<ExtendedClassroomFormValues | null>(null);
  const [publishStatus, setPublishStatus] = useState<'public' | 'draft'>('draft');
  
  // ObjectURLキャッシュ（メモリリーク防止）
  const objectUrlsRef = useRef<Map<File, string>>(new Map());
  
  const { user, loading: authLoading } = useAuth();
  const { subscription, loading: subscriptionLoading, refreshSubscriptionStatus } = useSubscription();
  const navigate = useNavigate();

  // 支払い状況と既存データに基づいて、公開するかどうかの初期値を設定します
  useEffect(() => {
    if (authLoading || subscriptionLoading || loading) {
      return;
    }

    if (existingClassroom) {
      // existingClassroom.publishedDbState を参照するように変更
      if (existingClassroom.publishedDbState) {
        setPublishStatus('public');
      } else {
        setPublishStatus('draft');
      }
    } else {
      if (subscription && subscription.hasActiveSubscription) {
        setPublishStatus('public');
      } else {
        setPublishStatus('draft');
      }
    }
  }, [existingClassroom, subscription, authLoading, subscriptionLoading, loading]);

  // 認証チェック（認証状態確定後のみ）
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "ログインが必要です",
        description: "教室登録にはアカウントが必要です",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      // 全てのObjectURLをクリーンアップ
      objectUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      objectUrlsRef.current.clear();
    };
  }, []);

  // フォームの初期化
  const form = useForm<ClassroomFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      prefecture: "",
      city: "",
      address: "",
      phone: "",
      email: "",
      website_url: "",
      lesson_types: [],
      target_ages: [],
      available_days: [],
      available_times: "",
      price_range: "",
      instructor_info: "",
      pr_points: "",
    },
  });

  // 既存の下書きデータを読み込み
  useEffect(() => {
    const loadDraftData = async () => {
      if (!user) { setLoading(false); return; }
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('classrooms')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error("下書きデータ読み込みエラー:", error);
          toast({ title: "エラー", description: "データの読み込みに失敗しました。", variant: "destructive" });
          setLoading(false);
          return;
        }

        if (data) {
          const dbData = data as DatabaseClassroom;
          const prefecture = (dbData.area && typeof dbData.area === 'string' && dbData.area.includes(' ')) ? dbData.area.split(' ')[0] : (dbData.area && typeof dbData.area === 'string' ? dbData.area : "");
          const city = (dbData.area && typeof dbData.area === 'string' && dbData.area.includes(' ')) ? dbData.area.split(' ').slice(1).join(' ') : "";
          
          const parseStringToArray = (value: unknown): string[] => {
            if (Array.isArray(value)) return value.filter(s => typeof s === 'string');
            if (value && typeof value === 'string' && value.trim().length > 0) {
              return value.split(',').map(s => s.trim()).filter(Boolean);
            }
            return [];
          };

          const lessonTypes = parseStringToArray(dbData.lesson_types);
          const targetAges = parseStringToArray(dbData.age_range);
          const availableDays = parseStringToArray(dbData.available_days);
          
          const formData: ExtendedClassroomFormValues = {
            name: dbData.name || "",
            description: dbData.description || "",
            prefecture: prefecture,
            city: city,
            address: dbData.address || "",
            phone: dbData.phone || "",
            email: dbData.email || "",
            website_url: dbData.website_url || "",
            lesson_types: lessonTypes,
            target_ages: targetAges,
            available_days: availableDays,
            available_times: dbData.available_times || "",
            price_range: dbData.price_range || "",
            instructor_info: dbData.instructor_info || "",
            pr_points: dbData.pr_points || "",
            publishedDbState: dbData.published,
            thumbnail_url: dbData.thumbnail_url,
            image_urls: dbData.image_urls,
            last_draft_saved_at: dbData.last_draft_saved_at,
          };
          form.reset(formData);
          setExistingClassroom(formData);
          if (dbData.image_urls) {
            setExistingImageUrls(dbData.image_urls);
          }
          if (dbData.thumbnail_url && dbData.image_urls) {
            const thumbIndex = dbData.image_urls.findIndex(url => url === dbData.thumbnail_url);
            if (thumbIndex !== -1) {
              setThumbnailIndex(thumbIndex);
              }
          }
        }
      } catch (err) {
        console.error("下書きデータ処理エラー:", err);
        toast({ title: "エラー", description: "データの処理中にエラーが発生しました。", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    if (user) { 
    loadDraftData();
    } else {
        setLoading(false); 
    }
  }, [user, form]);

  const MAX_IMAGES = 6;

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      const totalImages = images.length + existingImageUrls.length + newFiles.length;
      if (totalImages > MAX_IMAGES) {
        toast({
          title: "画像上限エラー",
          description: `画像は合計${MAX_IMAGES}枚までアップロードできます。`,
          variant: "destructive",
        });
        return;
      }
      setImages(prev => [...prev, ...newFiles]);
      // 新しいファイルに対してObjectURLを生成してキャッシュ
      newFiles.forEach(file => {
        const url = URL.createObjectURL(file);
        objectUrlsRef.current.set(file, url);
      });
    }
  };

  const uploadFileToSupabase = async (file: File, userId: string): Promise<string | null> => {
      const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage
      .from('classroom-images')
      .upload(fileName, file, { upsert: true });

    if (error) {
      console.error('Supabaseへのファイルアップロードエラー:', error);
      toast({ title: "アップロードエラー", description: error.message, variant: "destructive" });
        return null;
      }
    // 公開URLを取得
    const { data: publicUrlData } = supabase.storage.from('classroom-images').getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  };

  const getAllImages = (): (string | File)[] => {
    return [...existingImageUrls, ...images];
  };
      
  const getImageUrl = (index: number): string => {
    const allImages = getAllImages();
    const item = allImages[index];
    if (typeof item === 'string') {
      return item; // 既存のURL
    }
    // キャッシュされたObjectURLを使用
    return objectUrlsRef.current.get(item) || ""; 
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const allImages = getAllImages();
    const itemToRemove = allImages[indexToRemove];

    if (typeof itemToRemove === 'string') {
      // 既存の画像を削除リストに追加（実際の削除はonSubmit時）
      setExistingImageUrls(prev => prev.filter(url => url !== itemToRemove));
      // もし削除されたのがサムネイルなら、サムネイルインデックスをリセット
      if (indexToRemove === thumbnailIndex && existingImageUrls.length > 1) {
        setThumbnailIndex(0); 
      } else if (existingImageUrls.length <=1 && images.length === 0) {
        setThumbnailIndex(0);
      }
      } else {
      // 新しく追加された画像を削除
      const newImages = images.filter((_, i) => {
        // existingImageUrls.length をオフセットとして考慮
        return (existingImageUrls.length + i) !== indexToRemove;
      });
      setImages(newImages);
      // ObjectURLを解放
      const objectUrl = objectUrlsRef.current.get(itemToRemove);
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrlsRef.current.delete(itemToRemove);
        }
       // もし削除されたのがサムネイルなら、サムネイルインデックスをリセット
       if (indexToRemove === thumbnailIndex && getAllImages().length > 1) {
        setThumbnailIndex(0); 
      } else if (getAllImages().length <= 1) {
        setThumbnailIndex(0);
      }
    }
  };

  const handleThumbnailSelect = (index: number) => {
      setThumbnailIndex(index);
  };
  
  const onSubmit = async (data: ClassroomFormValues) => {
    if (!user) {
      toast({ title: "エラー", description: "ユーザー情報が見つかりません。", variant: "destructive" });
      return;
    }

    // 公開を選択していて、月額プランが有効でない場合は警告
    if (publishStatus === 'public' && !(subscription && subscription.hasActiveSubscription)) {
      toast({
        title: "公開設定について",
        description: "教室を「公開する」に設定するには、有効な月額プランのご契約が必要です。「下書きとして保存する」か、管理画面で月額プランをご契約ください。",
        variant: "default",
        duration: 7000,
      });
      return; // ここで処理を中断し、ユーザーにプラン契約を促す
    }

    setIsSubmitting(true);

    try {
      const imageUploadPromises: Promise<string | null>[] = [];
      const uploadedImageUrls: string[] = [];

      // 新しい画像をアップロード
      images.forEach(file => {
        imageUploadPromises.push(uploadFileToSupabase(file, user.id));
      });
      const newImageResults = await Promise.all(imageUploadPromises);
      newImageResults.forEach(url => {
        if (url) uploadedImageUrls.push(url);
      });

      // 既存の画像URLと新しい画像URLを結合
      const allImageUrls = [...existingImageUrls, ...uploadedImageUrls];
      const newThumbnailUrl = allImageUrls[thumbnailIndex] || null;

      // DBのclassroomsテーブルのスキーマに合わせてオブジェクトを構築
      const classroomDataToSave = {
        user_id: user.id,
        name: data.name,
        description: data.description,
        area: `${data.prefecture} ${data.city}`.trim(),
        address: data.address || null,
        phone: data.phone || null,
        email: data.email,
        website_url: data.website_url || null,
        lesson_types: data.lesson_types, // string[] (DBがtext[]型と想定)
        age_range: data.target_ages.join(','), // string (DBがtext型でカンマ区切りと想定)
        available_days: data.available_days, // string[] (DBがtext[]型と想定)
        available_times: data.available_times || null,
        price_range: data.price_range,
        instructor_info: data.instructor_info || null,
        pr_points: data.pr_points || null,
        image_urls: allImageUrls.length > 0 ? allImageUrls : null,
        thumbnail_url: newThumbnailUrl,
        published: publishStatus === 'public' && subscription.hasActiveSubscription, // 「公開する」が選択され、かつ月額プラン契約中であるか
        draft_saved: true, // 常に下書きは保存されたとみなす
        last_draft_saved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const newPublishedState = classroomDataToSave.published;

      let classroomId = existingClassroom?.id;

      // 更新か新規作成かを判定 (IDの存在を確実にする)
      if (classroomId) {
        // 更新
        const { error } = await supabase
          .from('classrooms')
          .update(classroomDataToSave)
          .eq('id', classroomId);
        if (error) throw error;
        toast({ title: "成功", description: "教室情報が更新されました。" });
      } else {
        // 新規作成
        const { data: newClassroomData, error } = await supabase
          .from('classrooms')
          .insert(classroomDataToSave)
          .select('id')
          .single();
        if (error) throw error;
        classroomId = newClassroomData.id;
        toast({ title: "成功", description: "教室情報が下書き保存されました。" });
      }
      
      // フォームとstateをリセットまたは更新
      form.reset(data); 
      const updatedExistingClassroom: ExtendedClassroomFormValues = {
        ...data,
        id: classroomId, // ここでidをセット
        publishedDbState: newPublishedState,
        thumbnail_url: newThumbnailUrl,
        image_urls: allImageUrls,
        last_draft_saved_at: classroomDataToSave.last_draft_saved_at,
      };
      setExistingClassroom(updatedExistingClassroom);
      setImages([]); // 新規アップロード用画像をクリア
      setExistingImageUrls(allImageUrls); // 既存画像URLリストを更新

      if (publishStatus === 'public' && !subscription.hasActiveSubscription) {
      toast({
          title: "保存設定の確認",
          description: "教室情報は下書きとして保存されました。公開するには月額プランのご契約が必要です。管理画面からお手続きください。",
          duration: 7000
        });
      } else if (publishStatus === 'public') {
        toast({ title: "成功", description: "教室情報が公開されました！" });
        }

      // 教室リストページまたは管理画面にリダイレクト
      navigate('/dashboard');
      
    } catch (error) {
      console.error("フォーム送信エラー:", error);
      toast({ title: "エラー", description: (error as Error).message || "処理中にエラーが発生しました。", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || authLoading || subscriptionLoading) {
    return (
      <Layout title="読み込み中...">
        <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
      </Layout>
    );
  }

  return (
    <Layout title={existingClassroom ? "教室情報の編集" : "教室情報を登録して魅力を伝えましょう"}>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="shadow-lg">
            <CardHeader>
            <div className="flex items-center mb-2">
              <School className="h-7 w-7 mr-2 text-primary" />
              <CardTitle className="text-2xl font-bold">
                {existingClassroom ? "教室情報の編集" : "教室情報の入力"}
              </CardTitle>
            </div>
            <CardDescription className="text-md">
              {existingClassroom 
                ? "登録済みの教室情報を編集できます。変更内容は下にスクロールして「更新して保存」ボタンを押してください。" 
                : "あなたの教室の詳細情報を入力してください。入力された情報は下書きとして保存され、いつでも編集可能です。"}
              <br />
              {!existingClassroom && "教室を公開して生徒募集を開始するには、別途月額プランのご契約（月額500円）が必要です。"}
            </CardDescription>
            </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
                
                {/* 基本情報セクション */}
                <section id="basic-info">
                  <h2 className="text-xl font-semibold mb-6 border-b pb-3 flex items-center">
                    <Info size={22} className="mr-2 text-primary" /> 基本情報
                  </h2>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                      <FormItem className="mb-8">
                        <FormLabel className="font-medium">教室名 (必須)</FormLabel>
                    <FormControl>
                          <InputWithCounter 
                            placeholder="例：鈴木ピアノ教室、リトミックスタジオ・マーチ" 
                            maxLength={FIELD_LIMITS.name}
                            {...field} 
                            data-testid="classroom-name" 
                          />
                    </FormControl>
                        <FormDescription>
                          ウェブサイトや看板に表示される教室の正式名称を入力してください。({FIELD_LIMITS.name}文字まで)
                        </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                      <FormItem className="mb-8">
                        <FormLabel className="font-medium">教室の説明 (必須)</FormLabel>
                    <FormControl>
                          <TextareaWithCounter
                            placeholder="教室の特徴、レッスン内容、雰囲気、対象とする生徒さんへのメッセージなどを具体的に記述してください。"
                            className="min-h-[120px] resize-y"
                            maxLength={FIELD_LIMITS.description}
                            {...field}
                            data-testid="classroom-description"
                          />
                    </FormControl>
                        <FormDescription>
                          生徒さんが教室を選ぶ上で重要な情報となります。10文字以上、{FIELD_LIMITS.description}文字以内でご記入ください。
                        </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
                <div>
                    <FormLabel className="font-medium block mb-2">教室の写真 (任意・最大6枚)</FormLabel>
                    <FormDescription className="mb-3">
                      教室の雰囲気、レッスン風景、外観などの写真をアップロードできます。<br />
                      <span className="font-semibold text-primary">🌟 メイン画像に設定した写真は、教室詳細ページで教室名の直下に大きく表示されます。</span><br />
                      また、検索結果のサムネイルとしても使用されますので、教室の魅力が最も伝わる写真をメイン画像に設定してください。<br />
                      (推奨形式: JPG, PNG / 各ファイル最大5MB)
                    </FormDescription>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                      {getAllImages().map((item, index) => (
                        <div key={index} className="relative group aspect-video border rounded-md overflow-hidden">
                          <img
                              src={getImageUrl(index)}
                            alt={`教室画像 ${index + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex flex-col items-center justify-center space-y-1">
                            <Button 
                            type="button"
                              variant="destructive"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 h-auto"
                              onClick={() => handleRemoveImage(index)}
                              aria-label={`画像を削除 ${index + 1}`}
                            >
                              <Trash2 size={16} />
                            </Button>
                            <Button 
                            type="button"
                              variant={thumbnailIndex === index ? "default" : "secondary"} 
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 h-auto text-xs leading-tight"
                              onClick={() => handleThumbnailSelect(index)}
                              title={thumbnailIndex === index ? 'メイン画像として設定中' : 'メイン画像に設定する'}
                            >
                              {thumbnailIndex === index ? <Star size={14} className="mr-1 fill-current" /> : <Star size={14} className="mr-1"/>}
                              {thumbnailIndex === index ? 'メイン画像' : 'メイン画像に設定'}
                            </Button>
                          </div>
                        </div>
                      ))}
                      {(getAllImages().length < MAX_IMAGES) && (
                        <label htmlFor="image-upload" className="cursor-pointer aspect-video border-2 border-dashed rounded-md flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                          <ImageUp size={32} className="mb-1" />
                          <span className="text-sm">写真を追加</span>
                          <input id="image-upload" type="file" multiple accept="image/png, image/jpeg" className="hidden" onChange={handleImageChange} />
                        </label>
                      )}
                    </div>
                    {getAllImages().length > 0 && (
                        <p className="text-xs text-muted-foreground">
                            現在 {getAllImages().length}枚 / 最大{MAX_IMAGES}枚. ドラッグ&ドロップは未対応です。
                        </p>
                )}
              </div>
                </section>

                <Separator className="my-8" />

          {/* 所在地セクション */}
                <section id="location-info">
                  <h2 className="text-xl font-semibold mb-6 border-b pb-3 flex items-center">
                    <MapPin size={22} className="mr-2 text-primary" /> 所在地
                  </h2>
              <FormField
                control={form.control}
                name="prefecture"
                render={({ field }) => (
                      <FormItem className="mb-6">
                        <FormLabel className="font-medium">都道府県 (必須)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                            <SelectTrigger data-testid="classroom-prefecture">
                              <SelectValue placeholder="都道府県を選択してください" />
                            </SelectTrigger>
                    </FormControl>
                          <SelectContent>
                            {prefectures.map((pref) => (
                              <SelectItem key={pref} value={pref}>{pref}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                      <FormItem className="mb-8">
                        <FormLabel className="font-medium">市区町村 (必須)</FormLabel>
                    <FormControl>
                          <InputWithCounter 
                            placeholder="例：千代田区丸の内、横浜市西区みなとみらい" 
                            maxLength={FIELD_LIMITS.city}
                            {...field} 
                            data-testid="classroom-city" 
                          />
                    </FormControl>
                        <FormDescription>
                          「〇〇市〇〇区〇〇町」や「〇〇市〇〇学区」のように入力してください。({FIELD_LIMITS.city}文字まで)
                        </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                      <FormItem className="mb-8">
                        <FormLabel className="font-medium">番地・建物名・最寄駅など (任意)</FormLabel>
                    <FormControl>
                          <InputWithCounter 
                            placeholder="例：1-2-3 ABCビル2F、JR東京駅 八重洲中央口 徒歩5分" 
                            maxLength={FIELD_LIMITS.address}
                            {...field} 
                            data-testid="classroom-address" 
                          />
                    </FormControl>
                        <FormDescription>
                          詳細な住所を公開したくない場合は、最寄りの駅名や目印などを入力できます。({FIELD_LIMITS.address}文字まで)
                        </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
                </section>
                
                <Separator className="my-8" />

          {/* 連絡先セクション */}
                <section id="contact-info">
                  <h2 className="text-xl font-semibold mb-6 border-b pb-3 flex items-center">
                    <Phone size={20} className="mr-2.5 text-primary" /> 連絡先
                  </h2>
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                      <FormItem className="mb-8">
                        <FormLabel className="font-medium">電話番号 (任意)</FormLabel>
                    <FormControl>
                          <InputWithCounter 
                            type="tel" 
                            placeholder="例：03-1234-5678 (市外局番から)" 
                            maxLength={FIELD_LIMITS.phone}
                            {...field} 
                            data-testid="classroom-phone" 
                          />
                    </FormControl>
                    <FormDescription>
                          公開したくない場合は空欄のままで構いません。({FIELD_LIMITS.phone}文字まで)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                      <FormItem className="mb-8">
                        <FormLabel className="font-medium">メールアドレス (必須)</FormLabel>
                    <FormControl>
                          <InputWithCounter 
                            type="email" 
                            placeholder="info@example.com" 
                            maxLength={FIELD_LIMITS.email}
                            {...field} 
                            data-testid="classroom-email" 
                          />
                    </FormControl>
                        <FormDescription>
                          生徒さんからの連絡に使用されます。正確なアドレスを入力してください。({FIELD_LIMITS.email}文字まで)
                        </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website_url"
                render={({ field }) => (
                      <FormItem className="mb-8">
                        <FormLabel className="font-medium">ウェブサイトURL (任意)</FormLabel>
                    <FormControl>
                          <InputWithCounter 
                            type="url" 
                            placeholder="https://example.com" 
                            maxLength={FIELD_LIMITS.website_url}
                            {...field} 
                            data-testid="classroom-website"
                          />
                    </FormControl>
                        <FormDescription>
                          教室の公式ウェブサイトやブログ、SNSページのURLがあれば入力してください。({FIELD_LIMITS.website_url}文字まで)
                        </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
                </section>

                <Separator className="my-8" />

          {/* レッスン情報セクション */}
                <section id="lesson-info">
                  <h2 className="text-xl font-semibold mb-6 border-b pb-3 flex items-center">
                    <CalendarDays size={20} className="mr-2.5 text-primary" /> レッスン情報
                  </h2>
              <FormField
                control={form.control}
                name="lesson_types"
                    render={({ field }) => (
                      <FormItem className="mb-6">
                        <FormLabel className="font-medium">レッスンの種類 (必須・複数選択可)</FormLabel>
                        <FormDescription className="mb-2">
                          提供しているレッスンの種類をすべて選択してください。
                        </FormDescription>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                          {LESSON_TYPES.map((item) => (
                        <FormField
                              key={item.id}
                          control={form.control}
                          name="lesson_types"
                              render={({ field: itemField }) => {
                            return (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                        checked={itemField.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                            ? itemField.onChange([...(itemField.value || []), item.id])
                                            : itemField.onChange(
                                                (itemField.value || []).filter(
                                                  (value) => value !== item.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                      {item.label}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="target_ages"
                    render={({ field }) => (
                      <FormItem className="mb-6">
                        <FormLabel className="font-medium">対象年齢 (必須・複数選択可)</FormLabel>
                        <FormDescription className="mb-2">
                          主なレッスン対象となる年齢層を選択してください。
                        </FormDescription>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                          {AGE_GROUPS.map((item) => (
                        <FormField
                              key={item.id}
                          control={form.control}
                          name="target_ages"
                              render={({ field: itemField }) => {
                            return (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                        checked={itemField.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                            ? itemField.onChange([...(itemField.value || []), item.id])
                                            : itemField.onChange(
                                                (itemField.value || []).filter(
                                                  (value) => value !== item.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                      {item.label}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="available_days"
                    render={({ field }) => (
                      <FormItem className="mb-6">
                        <FormLabel className="font-medium">レッスン可能曜日 (必須・複数選択可)</FormLabel>
                        <FormDescription className="mb-2">
                          レッスンを行っている曜日をすべて選択してください。
                        </FormDescription>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2">
                          {WEEKDAYS.map((item) => (
                        <FormField
                              key={item.id}
                          control={form.control}
                          name="available_days"
                              render={({ field: itemField }) => {
                            return (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                        checked={itemField.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                            ? itemField.onChange([...(itemField.value || []), item.id])
                                            : itemField.onChange(
                                                (itemField.value || []).filter(
                                                  (value) => value !== item.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                      {item.label}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="available_times"
                render={({ field }) => (
                      <FormItem className="mb-8">
                        <FormLabel className="font-medium">レッスン時間帯 (任意)</FormLabel>
                    <FormControl>
                          <InputWithCounter 
                            placeholder="例：平日 10:00～18:00、土日祝 9:00～17:00" 
                            maxLength={FIELD_LIMITS.available_times}
                            {...field} 
                            data-testid="classroom-times" 
                          />
                    </FormControl>
                        <FormDescription>
                          具体的なレッスン時間や、曜日ごとの違いなどがあれば補足説明としてご記入ください。({FIELD_LIMITS.available_times}文字まで)
                        </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price_range"
                render={({ field }) => (
                      <FormItem className="mb-8">
                        <FormLabel className="font-medium">料金目安 (必須)</FormLabel>
                    <FormControl>
                          <InputWithCounter 
                            placeholder="例：月謝 8,000円～、1レッスン 3,000円（税込）" 
                            maxLength={FIELD_LIMITS.price_range}
                            {...field} 
                            data-testid="classroom-price" 
                          />
                    </FormControl>
                        <FormDescription>
                          最も代表的なコースの月謝や1レッスンあたりの料金などを入力してください。必要に応じて「税込」「税抜」も明記してください。({FIELD_LIMITS.price_range}文字まで)
                        </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
                </section>

                <Separator className="my-8" />

          {/* 追加情報セクション */}
                <section id="additional-info">
                  <h2 className="text-xl font-semibold mb-6 border-b pb-3 flex items-center">
                    <Star size={20} className="mr-2.5 text-primary" /> 追加情報 (任意)
                  </h2>
              <FormField
                control={form.control}
                name="instructor_info"
                render={({ field }) => (
                      <FormItem className="mb-8">
                        <FormLabel className="font-medium">講師紹介</FormLabel>
                    <FormControl>
                      <TextareaWithCounter 
                            placeholder="講師の経歴、実績、指導方針、生徒さんへのメッセージなどを記入してください。"
                            className="min-h-[100px] resize-y"
                            maxLength={FIELD_LIMITS.instructor_info}
                        {...field}
                            data-testid="classroom-instructor"
                      />
                    </FormControl>
                        <FormDescription>
                          任意入力です。{FIELD_LIMITS.instructor_info}文字以内でご記入ください。
                        </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pr_points"
                render={({ field }) => (
                      <FormItem className="mb-8">
                        <FormLabel className="font-medium">教室のPRポイント</FormLabel>
                    <FormControl>
                      <TextareaWithCounter 
                            placeholder="教室の特長、強み、他教室との差別化ポイント、発表会やイベント情報などを自由にアピールしてください。"
                            className="min-h-[100px] resize-y"
                            maxLength={FIELD_LIMITS.pr_points}
                        {...field}
                            data-testid="classroom-pr"
                      />
                    </FormControl>
                        <FormDescription>
                          任意入力です。{FIELD_LIMITS.pr_points}文字以内でご記入ください。
                        </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
                </section>

                <Separator className="my-8" />

                {/* 公開設定セクション */}
                <section id="publish-settings" className="space-y-6">
                    <h2 className="text-xl font-semibold mb-2 border-b pb-3 flex items-center">
                        <Eye size={20} className="mr-2.5 text-primary" /> 公開設定
                    </h2>
                    
                    {!subscription.hasActiveSubscription && (
                        <Alert variant="default">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            <AlertTitle className="font-semibold text-yellow-700">月額プラン未契約</AlertTitle>
                            <AlertDescription className="text-yellow-600">
                                教室情報を公開するには、月額500円の月額プランのご契約が必要です。
                                まずは下書きとして情報を保存し、
                                <Link to="/dashboard?tab=plan-details" className="underline font-medium hover:text-yellow-900">
                                    管理画面でプラン内容を確認
                                </Link>
                                の上、ご契約ください。
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="flex items-center space-x-3 p-4 border rounded-md bg-muted/40">
              <Switch
                            id="publish-switch"
                checked={publishStatus === 'public'}
                            onCheckedChange={(checked) => setPublishStatus(checked ? 'public' : 'draft')}
                            disabled={!subscription.hasActiveSubscription && !existingClassroom?.publishedDbState}
                            data-testid="publish-switch"
              />
                        <Label htmlFor="publish-switch" className="flex flex-col space-y-1">
                            <span className="font-medium">
                                {publishStatus === 'public' ? "教室情報を公開する" : "下書きとして保存する"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {subscription.hasActiveSubscription 
                                    ? (publishStatus === 'public' ? "チェックを外すと教室情報は非公開（下書き）になります。" : "チェックを入れると教室情報が公開されます。")
                                    : "教室を公開するには月額プランのご契約が必要です。現在は下書き保存のみ可能です。公開設定はプラン契約後に変更できます。"}
                            </span>
                            {!subscription.hasActiveSubscription && !existingClassroom?.publishedDbState && (
                               <p className="text-xs text-muted-foreground mt-1">
                                 先に <Link to="/dashboard?tab=plan-details" className="underline">管理画面で月額プランをご契約</Link> いただくと、ここから直接公開できます。
                </p>
              )}
                        </Label>
          </div>
                    {existingClassroom?.last_draft_saved_at && (
                        <p className="text-sm text-muted-foreground">
                            最終下書き保存日時: {new Date(existingClassroom.last_draft_saved_at).toLocaleString('ja-JP')}
               </p>
            )}
                </section>

                <CardFooter className="flex justify-end pt-8">
          <Button 
            type="submit" 
                    disabled={isSubmitting || loading || authLoading || subscriptionLoading}
                    className="min-w-[180px]"
                    data-testid="submit-classroom-form"
          >
            {isSubmitting ? (
                      <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>処理中...</>
            ) : (
                      existingClassroom ? "更新して保存" : "登録して下書き保存"
            )}
          </Button>
                </CardFooter>
        </form>
      </Form>
          </CardContent>
        </Card>
    </div>
    </Layout>
  );
};

export default ClassroomRegistration;
