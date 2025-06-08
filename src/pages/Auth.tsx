import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/providers/AuthProvider";
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

  // ログイン済みの場合は管理画面にリダイレクト（認証状態確定後のみ）
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard"); // TODO: パス変更検討
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

    try {
      await signIn(signinEmail, signinPassword);
    
      toast({
        title: "ログイン成功",
        description: "管理画面に移動します", // ダッシュボード -> 管理画面
        variant: "default",
      });
      navigate("/dashboard"); // TODO: パス変更検討
    } catch (error: any) {
      setError(
        error.message === "Invalid login credentials" 
          ? "メールアドレスまたはパスワードが正しくありません"
          : "ログインに失敗しました。もう一度お試しください。"
      );
    }
    
    setIsLoading(false);
  };

  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSignupSuccess(false);

    console.log("Attempting to sign up with:", signupEmail, name);

    try {
      const result = await signUp(signupEmail, signupPassword, name);
      console.log("[DEBUG] Raw signUp result:", JSON.stringify(result, null, 2)); // 詳細なresult内容を出力

      const signUpError = result?.error;
      const userData = result?.data;

      if (signUpError) {
        console.error("[DEBUG] signUpError before throw:", signUpError);
        throw signUpError; // Explicitly throw to be caught by the catch block
      }

      // エラーがなく、ユーザーデータが存在する場合の処理
      if (userData && userData.user) {
        // identities が空配列の場合、ユーザーは既に存在し、確認済みと判断
        if (userData.user.identities && userData.user.identities.length === 0) {
          console.log("[DEBUG] User already exists and is confirmed (identities empty).");
          toast({
            title: "登録エラー",
            description: "このメールアドレスは既に使用されています。ログインするか、別のアドレスをお試しください。",
            variant: "destructive",
            duration: 7000,
          });
          setError("このメールアドレスは既に使用されています。");
          // 成功メッセージは表示しないので、ここで処理を終了
          setIsLoading(false);
          return;
        } else {
          // 新規登録成功、またはメール未確認ユーザーによる再試行（確認メール再送）
          console.log("[DEBUG] New user or unconfirmed user, proceeding with success message.");
      setSignupSuccess(true);
        toast({
            title: "アカウント登録申請を受け付けました",
            description: "確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。",
            duration: 7000,
        });
        setSignupEmail('');
        setSignupPassword('');
        setName('');
        }
      } else {
        // 通常ここには到達しないはずだが、念のためエラーケースとして処理
        console.error("[DEBUG] SignUp returned no error but no user data either.");
        throw new Error("新規登録処理中に予期せぬ応答がありました。");
      }

    } catch (error: any) {
      console.error("[DEBUG] SignUp catch block error:", error);
      console.error("[DEBUG] SignUp catch block error.message:", error?.message);
      const errorMessage = String(error.message || '').toLowerCase();

      // catch ブロックでは、throw されたエラーや予期せぬエラーを処理
      if (errorMessage.includes("user already registered")) { // これはsignUpErrorが実際にこのメッセージを持つ場合
        toast({
          title: "登録エラー",
          description: "このメールアドレスは既に使用されています。ログインするか、別のメールアドレスでお試しください。",
          variant: "destructive",
          duration: 7000,
        });
        setError("このメールアドレスは既に使用されています。"); 
      } else if (errorMessage.includes("email link signin rate exceeded")) {
        toast({
          title: "登録エラー",
          description: "短期間に複数回の試行がありました。しばらく時間をおいてから再度お試しください。",
          variant: "destructive",
          duration: 7000,
        });
        setError("試行回数が上限を超えました。時間をおいてください。");
      } else if (errorMessage.includes("password should be at least 6 characters")) {
        toast({
          title: "登録エラー",
          description: "パスワードは6文字以上で入力してください。",
          variant: "destructive",
        });
        setError("パスワードは6文字以上で入力してください。");
      } else {
        toast({
          title: "登録エラー",
          description: error.message || "新規登録に失敗しました。入力内容をご確認の上、もう一度お試しください。", // エラーメッセージをそのまま使う
          variant: "destructive",
        });
        setError(error.message || "新規登録に失敗しました。お手数ですが、再度お試しください。");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout showHeader={false} showBreadcrumb={false} className="bg-gray-50 min-h-screen flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-bold text-gray-900 mb-8">
                      ピアノ教室・リトミック教室検索.org
        </h2>
      </div>

      <Card className="sm:mx-auto sm:w-full sm:max-w-md">
        <Tabs defaultValue="signin" className="w-full" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin" data-testid="login-tab">ログイン</TabsTrigger>
            <TabsTrigger value="signup" data-testid="signup-tab">新規登録</TabsTrigger>
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
                    data-testid="login-email"
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
                    data-testid="login-password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading} data-testid="login-submit">
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
                {signupSuccess && (
                  <Alert data-testid="signup-success" className="border-green-500 bg-green-50">
                    <AlertDescription className="text-green-700">
                      アカウントが作成されました！ログインタブからログインしてください。
                    </AlertDescription>
                  </Alert>
                )}
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
                    data-testid="signup-name"
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
                    data-testid="signup-email"
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
                    placeholder="パスワード（6文字以上）"
                    data-testid="signup-password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading} data-testid="signup-submit">
                  {isLoading ? "登録中..." : "新規登録"}
                </Button>
              </form>
            </CardContent>
          </TabsContent>
        </Tabs>
        
        <CardFooter className="mt-4">
          <p className="text-sm text-gray-600 w-full text-center">
            <a href="/" className="underline hover:text-primary">
              トップページに戻る
            </a>
          </p>
        </CardFooter>
      </Card>
    </Layout>
  );
};

export default Auth;
