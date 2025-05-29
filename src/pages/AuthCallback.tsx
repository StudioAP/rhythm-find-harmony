import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URLからhash parametersを取得
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        if (error) {
          console.error('Auth callback error:', error, errorDescription);
          toast({
            title: "認証エラー",
            description: errorDescription || "認証に失敗しました。",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }

        if (accessToken) {
          // セッションが正常に設定されているか確認
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Session error:', sessionError);
            toast({
              title: "セッションエラー", 
              description: "セッションの確認に失敗しました。",
              variant: "destructive",
            });
            navigate("/auth");
            return;
          }

          if (session) {
            toast({
              title: "メール確認完了",
              description: "アカウントが有効化されました。ダッシュボードに移動します。",
            });
            navigate("/dashboard");
          } else {
            toast({
              title: "認証状態確認中",
              description: "しばらくお待ちください...",
            });
            // 少し待ってからダッシュボードに移動
            setTimeout(() => navigate("/dashboard"), 2000);
          }
        } else {
          // アクセストークンがない場合は認証ページに戻る
          navigate("/auth");
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        toast({
          title: "予期しないエラー",
          description: "認証処理中にエラーが発生しました。",
          variant: "destructive",
        });
        navigate("/auth");
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">認証を確認しています...</p>
      </div>
    </div>
  );
};

export default AuthCallback; 