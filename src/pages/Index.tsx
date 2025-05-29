import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Music, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";

const Index = () => {
  const [searchKeyword, setSearchKeyword] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    if (searchKeyword.trim()) {
      navigate(`/search?keyword=${encodeURIComponent(searchKeyword.trim())}`);
    } else {
      navigate('/search');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Layout showBreadcrumb={false} className="p-0">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">理想のピアノ教室・リトミック教室を見つけよう</h2>
          <p className="text-xl text-gray-600 mb-8">
            あなたにぴったりの教室がきっと見つかります
          </p>
          
          {/* Search Box */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="flex gap-2">
              <Input 
                placeholder="エリアまたはキーワードで検索" 
                className="bg-white text-lg h-12"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button size="lg" className="h-12" onClick={handleSearch}>
                <Search className="mr-2" />
                検索
              </Button>
            </div>
          </div>

          {/* 人気検索: ピアノ・リトミック直接リンク */}
          <div className="flex justify-center gap-4 flex-wrap">
            <Button variant="outline" size="sm" asChild className="bg-white/80 hover:bg-white">
              <Link to="/search?type=piano">
                <Music className="mr-2 h-4 w-4" />
                ピアノ教室を探す
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="bg-white/80 hover:bg-white">
              <Link to="/search?type=eurythmics">
                <Users className="mr-2 h-4 w-4" />
                リトミック教室を探す
              </Link>
            </Button>
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
            <Link to="/classroom/register">教室情報を掲載する</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
