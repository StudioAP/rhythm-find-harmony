import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // フォームの基本的なバリデーション
      if (!name || !email || !subject || !message) {
        toast({
          title: "入力エラー",
          description: "すべての項目を入力してください。",
          variant: "destructive",
        });
        return;
      }

      // 管理者へのお問い合わせメール送信
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-general-contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          senderName: name,
          senderEmail: email,
          subject: subject,
          message: message,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "お問い合わせを受け付けました",
          description: result.message || "確認次第、お返事いたします。",
        });

        // フォームをリセット
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
      } else {
        toast({
          title: "エラーが発生しました",
          description: result.message || "しばらく時間をおいて再度お試しください。",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('お問い合わせ送信エラー:', error);
      toast({
        title: "エラーが発生しました",
        description: "しばらく時間をおいて再度お試しください。",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">
            <Link to="/">Piano Search</Link>
          </h1>
          <div className="space-x-2">
            <Button variant="outline" asChild>
              <Link to="/login">ログイン</Link>
            </Button>
            <Button asChild>
              <Link to="/classroom/register">教室を掲載する</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="text-4xl font-bold text-center mb-8">お問い合わせ</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>お問い合わせフォーム</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">お名前 *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="山田太郎"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">メールアドレス *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">件名 *</Label>
                  <Input
                    id="subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="お問い合わせの件名"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">お問い合わせ内容 *</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="お問い合わせ内容をご記入ください"
                    rows={6}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "送信中..." : "お問い合わせを送信"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>よくあるお問い合わせ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold mb-2">教室の掲載について</h3>
                  <p className="text-gray-600 text-sm">
                    教室の掲載をご希望の方は、<Link to="/classroom/register" className="text-primary underline">教室掲載ページ</Link>からお申し込みください。
                  </p>
                </div>
                <div>
                  <h3 className="font-bold mb-2">料金について</h3>
                  <p className="text-gray-600 text-sm">
                    教室掲載の料金は月額500円（税込）です。詳細は利用規約をご確認ください。
                  </p>
                </div>
                <div>
                  <h3 className="font-bold mb-2">技術的なトラブル</h3>
                  <p className="text-gray-600 text-sm">
                    サイトの不具合や操作方法でご不明な点がございましたら、上記フォームよりお問い合わせください。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-8">
            <Button variant="outline" asChild>
              <Link to="/">トップページに戻る</Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500">© 2025 Piano Search. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link to="/about" className="text-gray-500 hover:text-primary">About</Link>
              <Link to="/terms" className="text-gray-500 hover:text-primary">利用規約</Link>
              <Link to="/privacy" className="text-gray-500 hover:text-primary">プライバシーポリシー</Link>
              <Link to="/contact" className="text-gray-500 hover:text-primary">お問い合わせ</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
