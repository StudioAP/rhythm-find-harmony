import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";

const About = () => {
  return (
    <Layout title="Piano Searchについて">
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>私たちのミッション</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  Piano Searchは、音楽を学びたい人と質の高いピアノ教室・リトミック教室を繋ぐプラットフォームです。
                  音楽教育を通じて、より豊かな人生を送るお手伝いをしたいと考えています。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>サービスの特徴</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold mb-2">簡単検索</h3>
                    <p className="text-gray-600">
                      エリア、年齢、特徴から、あなたにぴったりの教室を簡単に見つけることができます。
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">信頼できる情報</h3>
                    <p className="text-gray-600">
                      教室の詳細情報、レッスン内容、料金など、必要な情報を分かりやすく掲載しています。
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">教室運営者をサポート</h3>
                    <p className="text-gray-600">
                      月額500円の手頃な料金で、教室の情報を掲載し、新しい生徒との出会いをサポートします。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>会社概要</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><span className="font-bold">サービス名：</span>Piano Search</p>
                  <p><span className="font-bold">設立：</span>2025年</p>
                  <p><span className="font-bold">事業内容：</span>ピアノ教室・リトミック教室検索プラットフォームの運営</p>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button asChild>
                <Link to="/search">教室を探す</Link>
              </Button>
            </div>
          </div>
    </Layout>
  );
};

export default About;
