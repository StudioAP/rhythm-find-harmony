import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";

const Auth = () => {
  // ログイン用の状態
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");
  
  // 新規登録用の状態
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [name, setName] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();

  // ログイン済みの場合はダッシュボードにリダイレクト（認証状態確定後のみ）
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  // タブ切り替え時にエラーをクリア
  const handleTabChange = () => {
    setError("");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    console.log("Attempting to sign in with:", signinEmail, signinPassword);

    const { error } = await signIn(signinEmail, signinPassword);
    
    if (error) {
      setError(
        error.message === "Invalid login credentials" 
          ? "メールアドレスまたはパスワードが正しくありません"
          : "ログインに失敗しました。もう一度お試しください。"
      );
    } else {
      toast({
        title: "ログイン成功",
        description: "ダッシュボードに移動します",
      });
      navigate("/dashboard");
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    console.log("Attempting to sign up with:", signupEmail, signupPassword, name);

    try {
      // supabase.auth.signUp を呼び出し、data も受け取るように変更
      const { data, error } = await signUp(signupEmail, signupPassword, name);

      // ★★★★★ デバッグ用に追加: data と error の内容をコンソールに出力 ★★★★★
      console.log("Supabase signUp response:", { data, error });
      console.log("Detailed data.session:", data?.session);
      console.log("Detailed data.user:", data?.user);
      console.log("data.session exists?", !!data?.session);
      console.log("data.user exists?", !!data?.user);
      // data.user の詳細なタイムスタンプ情報を確認
      if (data?.user) {
        console.log("data.user.created_at:", data.user.created_at);
        console.log("data.user.email_confirmed_at:", data.user.email_confirmed_at);
        console.log("data.user.updated_at:", data.user.updated_at);
        console.log("data.user.last_sign_in_at:", data.user.last_sign_in_at);
        // 現在時刻と created_at を比較して、既存ユーザーかどうか判定
        const now = new Date();
        const createdAt = new Date(data.user.created_at);
        const timeDiff = now.getTime() - createdAt.getTime();
        console.log("Time difference (ms):", timeDiff);
        console.log("Is likely existing user (created more than 5 seconds ago)?", timeDiff > 5000);
      }
      // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

      // --- 1) Supabaseが明確なエラー（400/429等）を返した場合 ---
      if (error) {
        if (error.status === 400 && /already registered/i.test(error.message)) {
          setError("このメールアドレスは既に登録されています");
        } else if (error.status === 400 && /Password should be/i.test(error.message)) {
          setError("パスワードは6文字以上で入力してください");
        } else if (error.status === 400 && /is invalid/i.test(error.message)) {
          setError("メールアドレスの形式が正しくありません。");
        } else if (error.status === 429) {
          setError("リクエストが多すぎます。しばらく時間をおいて再度お試しください。");
        } else {
          console.error("Supabase signUp error:", error);
          setError(`新規登録に失敗しました (エラー: ${error.message})`);
        }
        return;
      }

      // --- 2) error === null だが session が存在する場合 → 既存ユーザーにログイン成功 ---
      if (data?.session) {
        console.log("User already exists and was signed in with matching password:", data.session.user.email);
        setError("このメールアドレスは既に登録されています。自動的にログインしました。");
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
        return;
      }

      // --- 3) error === null かつ session === null の場合 → 純粋な新規登録成功 ---
      if (data?.user && !data?.session) {
        toast({
          title: "確認メールを送信しました",
          description: "アカウントを有効にするため、メールをご確認ください。\n※5分以内に届かない場合はスパムフォルダをご確認ください。\n※問題が解決しない場合は「ピアノ教室・リトミック教室検索.com」（info@piaryth.org）までお問い合わせください。",
          duration: 8000,
        });
        // フォームクリア
        setSignupEmail('');
        setSignupPassword('');
        setName('');
      } else {
        // 通常ここには到達しないはずだが、念のためフォールバック
        console.warn("SignUp completed without error, but session and user state is unexpected:", data);
        setError("新規登録処理中に予期せぬ状態になりました。お手数ですが、再度お試しください。");
      }

    } catch (err) {
      // ネットワークエラーや、supabase.auth.signUp呼び出し前の予期せぬエラー
      console.error("Network or unexpected signUp error:", err);
      setError("ネットワークエラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout showHeader={false} showBreadcrumb={false} className="bg-gray-50 min-h-screen flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-bold text-gray-900 mb-8">
                      ピアノ教室・リトミック教室検索.com
        </h2>
      </div>

      <Card className="sm:mx-auto sm:w-full sm:max-w-md">
        <Tabs defaultValue="signin" className="w-full" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">ログイン</TabsTrigger>
            <TabsTrigger value="signup">新規登録</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin">
            <CardHeader>
              <CardTitle>ログイン</CardTitle>
              <CardDescription>
                アカウント情報を入力してログインしてください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-4">
                {error && (
                  <Alert>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="signin-email">メールアドレス</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={signinEmail}
                    onChange={(e) => setSigninEmail(e.target.value)}
                    required
                    placeholder="your-email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">パスワード</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={signinPassword}
                    onChange={(e) => setSigninPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "ログイン中..." : "ログイン"}
                </Button>
              </form>
            </CardContent>
          </TabsContent>

          <TabsContent value="signup">
            <CardHeader>
              <CardTitle>新規登録</CardTitle>
              <CardDescription>
                新しいアカウントを作成してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp} className="space-y-4">
                {error && (
                  <Alert>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="signup-name">お名前</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="山田 太郎"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">メールアドレス</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    placeholder="your-email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">パスワード</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    placeholder="6文字以上"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "登録中..." : "新規登録"}
                </Button>
              </form>
            </CardContent>
          </TabsContent>
        </Tabs>
        
        <CardFooter className="flex justify-center">
          <Button variant="link" onClick={() => navigate("/")}>
            トップページに戻る
          </Button>
        </CardFooter>
      </Card>
    </Layout>
  );
};

export default Auth;
