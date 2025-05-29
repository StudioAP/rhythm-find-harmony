import { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, MapPin, Phone, Mail, Globe, Clock, Users, Star, Send, X, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useClassrooms } from "@/hooks/useClassrooms";
import { useAuth } from "@/hooks/useAuth";
import { ClassroomWithSubscriptions } from "@/types/classroom";
import { translateDay, translateLessonType, translateAgeRange } from "@/constants/classroomData";
import Layout from "@/components/layout/Layout";

const ClassroomDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';
  const [currentImageIndex, setCurrentImageIndex] = useState(-1);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  // 問い合わせ送信中フラグ
  const [submitting, setSubmitting] = useState(false);
  const [classroom, setClassroom] = useState<ClassroomWithSubscriptions | null>(null);
  const [loading, setLoading] = useState(true);
  const { getClassroomById, getClassroomByIdForPreview } = useClassrooms();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // パンくずリストのカスタム設定
  const breadcrumbItems = [
    { label: "ホーム", href: "/" },
    { 
      label: isPreview ? "管理ダッシュボード" : "教室を探す", 
      href: isPreview ? "/dashboard" : "/search" 
    },
    { label: classroom?.name || "教室詳細" }
  ];

  // 教室データの取得
  useEffect(() => {
    const fetchClassroom = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        let data: ClassroomWithSubscriptions | null = null;
        
        // プレビューモードでは所有者確認付きの関数を使用
        if (isPreview) {
          if (!user?.id) {
            toast({
              title: "エラー",
              description: "プレビューにはログインが必要です",
              variant: "destructive"
            });
            setClassroom(null);
            setLoading(false);
            return;
          }
          data = await getClassroomByIdForPreview(id, user.id);
        } else {
          data = await getClassroomById(id);
        }
        
        console.log("[ClassroomDetail] 教室データ取得結果:", data);
        if (data) {
          setClassroom(data);
          console.log("[ClassroomDetail] classroom state after setClassroom:", data);
        } else {
          if (isPreview) {
            toast({
              title: "エラー",
              description: "プレビューできません。教室が見つからないか、まだ公開されていません。",
              variant: "destructive"
            });
          } else {
            toast({
              title: "エラー",
              description: "教室が見つかりませんでした",
              variant: "destructive"
            });
          }
          setClassroom(null);
        }
      } catch (error) {
        console.error("教室データ取得エラー:", error);
        toast({
          title: "エラー",
          description: "教室情報の取得に失敗しました",
          variant: "destructive"
        });
        setClassroom(null);
      } finally {
        setLoading(false);
      }
    };

    fetchClassroom();
  }, [id, getClassroomById, getClassroomByIdForPreview, isPreview, user?.id]);

  if (loading) {
    return (
      <Layout showBreadcrumb={false}>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!classroom) {
    return (
      <Layout title="教室が見つかりません" breadcrumbItems={breadcrumbItems}>
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">お探しの教室が見つかりませんでした。</p>
          <Button asChild>
            <Link to="/search">教室を探す</Link>
          </Button>
        </div>
      </Layout>
    );
  }
  
  // 画像配列（複数画像対応、デフォルト画像を使用）
  const defaultImage = "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3";
  
  // 実際の画像配列を取得
  let displayImages: string[] = [];
  let hasActualImages = false;
  
  if (classroom.image_urls && classroom.image_urls.length > 0) {
    displayImages = classroom.image_urls.filter(url => url && url.trim() !== "");
    hasActualImages = displayImages.length > 0;
  } else if (classroom.thumbnail_url && classroom.thumbnail_url.trim() !== "") {
    displayImages = [classroom.thumbnail_url];
    hasActualImages = true;
  }
  
  // 実際の画像がない場合はデフォルト画像を使用
  if (!hasActualImages) {
    displayImages = [defaultImage];
  }
  
  const nextImage = () => {
    if (!hasActualImages || displayImages.length <= 1) return;
    setCurrentImageIndex(prev => {
      const nextIndex = prev === displayImages.length - 1 ? 0 : prev + 1;
      return Math.max(0, Math.min(nextIndex, displayImages.length - 1));
    });
  };
  
  const prevImage = () => {
    if (!hasActualImages || displayImages.length <= 1) return;
    setCurrentImageIndex(prev => {
      const prevIndex = prev === 0 ? displayImages.length - 1 : prev - 1;
      return Math.max(0, Math.min(prevIndex, displayImages.length - 1));
    });
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 送信中フラグを立てる
    setSubmitting(true);
    
    if (!classroom.email) {
      toast({
        title: "エラー",
        description: "この教室のメールアドレスが設定されていません。お電話でお問い合わせください。",
        variant: "destructive"
      });
      setSubmitting(false); // ここでフラグをリセット
      return;
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          classroomName: classroom.name,
          classroomEmail: classroom.email,
          senderName: contactForm.name,
          senderEmail: contactForm.email,
          senderPhone: contactForm.phone,
          message: contactForm.message,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "送信完了",
          description: result.message,
        });
        // フォームをリセット
        setContactForm({
          name: "",
          email: "",
          phone: "",
          message: ""
        });
      } else {
        toast({
          title: "エラー",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('問い合わせ送信エラー:', error);
      toast({
        title: "エラー",
        description: "メールの送信に失敗しました。しばらく時間をおいて再度お試しください。",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout 
      breadcrumbItems={breadcrumbItems}
      className="bg-gray-50"
    >
      {/* プレビューバナー */}
      {isPreview && (
        <div className="bg-orange-100 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-orange-600" />
              <span className="text-orange-800 font-medium">
                プレビューモード - 公開前の教室情報を確認しています
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="p-6">
            <h1 className="text-3xl font-bold mb-2">{classroom.name || "教室名未設定"}</h1>
            
            {/* 特徴タグ（lesson_typesから表示） */}
            {classroom.lesson_types && classroom.lesson_types.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {classroom.lesson_types.map(type => (
                  <span 
                    key={type} 
                    className="bg-primary/10 text-primary text-xs px-3 py-1 rounded-full"
                  >
                    {translateLessonType(type)}
                  </span>
                ))}
              </div>
            )}
            {classroom.trial_lesson_available && (
              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full mb-4 inline-block">
                体験レッスンあり
              </span>
            )}
            
            {/* 説明（基本情報の前に移動） */}
            {classroom.description && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-3">教室の説明</h2>
                <p className="text-gray-700 whitespace-pre-line">{classroom.description}</p>
              </div>
            )}
            
            {/* 基本情報 */}
            <div className="space-y-2 mb-6">
              {classroom.area && (
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                  <span>{classroom.area}</span>
                </div>
              )}
              {classroom.phone && (
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-gray-500 mr-2" />
                  <a href={`tel:${classroom.phone}`} className="text-primary hover:underline">{classroom.phone}</a>
                </div>
              )}
              {classroom.email && (
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-500 mr-2" />
                  <a href={`mailto:${classroom.email}`} className="text-primary hover:underline">{classroom.email}</a>
                </div>
              )}
              {classroom.website_url && (
                <div className="flex items-center">
                  <Globe className="h-5 w-5 text-gray-500 mr-2" />
                  <a href={classroom.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{classroom.website_url}</a>
                </div>
              )}
            </div>
            
            {/* レッスン情報統合セクション */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-3">レッスン情報</h2>
              <div className="bg-gray-50 p-4 rounded-md space-y-3">
                {/* 対象年齢 */}
                {classroom.age_range && classroom.age_range.trim() !== "" && (
                  <div>
                    <p className="text-gray-700"><strong>対象年齢:</strong> {translateAgeRange(classroom.age_range)}</p>
                  </div>
                )}
                
                {/* レッスン時間・曜日 */}
                {(classroom.available_days && classroom.available_days.length > 0) || (classroom.available_times && classroom.available_times.trim() !== "") ? (
                  <div className="space-y-1">
                    {classroom.available_days && classroom.available_days.length > 0 && (
                      <p className="text-gray-700">
                        <strong>レッスン可能曜日:</strong> {classroom.available_days.map(translateDay).join(', ')}
                      </p>
                    )}
                    {classroom.available_times && classroom.available_times.trim() !== "" && (
                      <p className="text-gray-700">
                        <strong>レッスン時間帯:</strong> {classroom.available_times}
                      </p>
                    )}
                  </div>
                ) : null}
                
                {/* 料金情報統合 */}
                {(classroom.price_range && classroom.price_range.trim() !== "") || (classroom.monthly_fee_min != null || classroom.monthly_fee_max != null) ? (
                  <div>
                    <p className="text-gray-700"><strong>料金目安:</strong></p>
                    {classroom.price_range && classroom.price_range.trim() !== "" && (
                      <p className="text-gray-700 ml-4">{classroom.price_range}</p>
                    )}
                    {(classroom.monthly_fee_min != null || classroom.monthly_fee_max != null) && (
                      <p className="text-gray-700 ml-4">
                        月謝: {classroom.monthly_fee_min != null ? `${classroom.monthly_fee_min.toLocaleString()}円` : '未設定'}
                        {(classroom.monthly_fee_min != null && classroom.monthly_fee_max != null && classroom.monthly_fee_min !== classroom.monthly_fee_max) && '〜'}
                        {(classroom.monthly_fee_max != null && classroom.monthly_fee_max !== classroom.monthly_fee_min) ? `${classroom.monthly_fee_max.toLocaleString()}円` : ''}
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
            
            {/* 講師紹介 */}
            {classroom.instructor_info && classroom.instructor_info.trim() !== "" && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-3">講師紹介</h2>
                <div className="bg-green-50 p-4 rounded-md">
                  <p className="text-gray-700 whitespace-pre-line">{classroom.instructor_info}</p>
                </div>
              </div>
            )}
            
            {/* PRポイント */}
            {classroom.pr_points && classroom.pr_points.trim() !== "" && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-3">PRポイント</h2>
                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-gray-700 whitespace-pre-line">{classroom.pr_points}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* 教室の写真ギャラリー（詳細確認用） */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">教室の写真</h2>
            {hasActualImages ? (
              <div className={`grid gap-4 ${
                displayImages.length === 1 
                  ? 'grid-cols-1 max-w-lg mx-auto' 
                  : displayImages.length === 2 
                  ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              }`}>
                {displayImages.map((imageUrl, index) => (
                  <div
                    key={index}
                    className="group relative cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 bg-gray-50"
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img
                      src={imageUrl}
                      alt={`${classroom.name} - 画像 ${index + 1}`}
                      className="w-full h-auto object-contain max-h-80"
                      style={{ aspectRatio: 'auto' }}
                      loading="lazy"
                      onError={(e) => {
                        console.error('画像読み込みエラー:', imageUrl);
                        e.currentTarget.src = defaultImage;
                      }}
                    />
                    {/* 画像番号表示 */}
                    <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded-md text-sm">
                      {index + 1}/{displayImages.length}
                    </div>
                    {/* ホバー効果 */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <span className="text-white font-medium">クリックで拡大</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // デフォルト画像の場合
              <div className="text-center py-8">
                <img
                  src={defaultImage}
                  alt="デフォルト画像"
                  className="mx-auto max-w-md w-full h-auto object-contain rounded-lg"
                />
                <p className="text-gray-500 mt-4">まだ写真が登録されていません</p>
              </div>
            )}
          </div>
        </div>

        {/* 画像モーダル（拡大表示用） */}
        {currentImageIndex >= 0 && hasActualImages && (
          <div 
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setCurrentImageIndex(-1)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setCurrentImageIndex(-1);
              } else if (e.key === 'ArrowLeft') {
                prevImage();
              } else if (e.key === 'ArrowRight') {
                nextImage();
              }
            }}
            tabIndex={0}
            role="dialog"
            aria-label="画像拡大表示"
          >
            <div className="relative max-w-4xl max-h-full">
              <img
                src={
                  currentImageIndex >= 0 && currentImageIndex < displayImages.length 
                    ? displayImages[currentImageIndex] 
                    : displayImages[0] || defaultImage
                }
                alt={`${classroom.name} - 拡大画像 ${Math.max(1, currentImageIndex + 1)}`}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
                onError={(e) => {
                  console.error('画像読み込みエラー:', displayImages[currentImageIndex]);
                  e.currentTarget.src = defaultImage;
                }}
              />
              
              {/* 閉じるボタン */}
              <button
                onClick={() => setCurrentImageIndex(-1)}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* ナビゲーションボタン（複数画像がある場合） */}
              {displayImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-3 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-3 transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
              
              {/* 画像インジケーター */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {displayImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentImageIndex ? "bg-white" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* 問い合わせフォーム */}
        {!isPreview && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">お問い合わせ</h2>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">お名前 *</Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      value={contactForm.name}
                      onChange={handleContactChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">メールアドレス *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={handleContactChange}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">電話番号</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={contactForm.phone}
                    onChange={handleContactChange}
                  />
                </div>
                <div>
                  <Label htmlFor="message">お問い合わせ内容 *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    value={contactForm.message}
                    onChange={handleContactChange}
                    placeholder="レッスンの空き状況や料金について、体験レッスンの希望など詳しくお書きください。"
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? "送信中..." : "お問い合わせを送信"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ClassroomDetail;
