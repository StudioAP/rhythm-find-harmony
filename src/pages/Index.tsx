
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Piano Search</h1>
          <div className="space-x-2">
            <Button variant="outline" asChild>
              <Link to="/login">ログイン</Link>
            </Button>
            <Button asChild>
              <Link to="/register">教室を掲載する</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">理想のピアノ教室・リトミック教室を見つけよう</h2>
          <p className="text-xl text-gray-600 mb-8">
            あなたにぴったりの教室がきっと見つかります
          </p>
          
          {/* Search Box */}
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2">
              <Input 
                placeholder="エリアまたはキーワードで検索" 
                className="bg-white text-lg h-12"
              />
              <Button size="lg" className="h-12">
                <Search className="mr-2" />
                検索
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">教室を探す</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-2">エリアから探す</h3>
                <p className="text-gray-600 mb-4">
                  お住まいの地域や通いやすいエリアから教室を検索できます
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/search?type=area">エリアで探す</Link>
                </Button>
              </CardContent>
            </Card>
            
            {/* Feature 2 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-2">年齢から探す</h3>
                <p className="text-gray-600 mb-4">
                  お子様の年齢や大人向けなど、対象年齢で教室を絞り込めます
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/search?type=age">年齢で探す</Link>
                </Button>
              </CardContent>
            </Card>
            
            {/* Feature 3 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <h3 className="text-xl font-bold mb-2">特徴から探す</h3>
                <p className="text-gray-600 mb-4">
                  レッスン内容や教室の特徴からあなたに合った教室を見つけられます
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/search?type=feature">特徴で探す</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA for School Owners */}
      <section className="bg-primary/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">教室を運営されている方へ</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            あなたの教室をPiano Searchに掲載しませんか？<br />
            月額たった500円で、新しい生徒との出会いをサポートします
          </p>
          <Button size="lg" asChild>
            <Link to="/register">教室情報を掲載する</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-8 mt-auto">
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

export default Index;
