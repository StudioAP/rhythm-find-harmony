import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";

const Privacy = () => {
  return (
    <Layout title="プライバシーポリシー">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-bold mb-4">1. 個人情報の収集について</h2>
              <p className="text-gray-600 leading-relaxed">
                当サービスは、以下の場合に個人情報を収集することがあります。
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-gray-600 mt-2">
                <li>ユーザー登録時</li>
                <li>お問い合わせ時</li>
                <li>教室情報の掲載申込み時</li>
                <li>決済処理時</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">2. 収集する個人情報の種類</h2>
              <div className="text-gray-600 leading-relaxed">
                <p className="mb-2">当サービスが収集する個人情報は以下の通りです。</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>氏名</li>
                  <li>メールアドレス</li>
                  <li>電話番号</li>
                  <li>住所</li>
                  <li>決済情報</li>
                  <li>その他サービス利用に必要な情報</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">3. 個人情報の利用目的</h2>
              <div className="text-gray-600 leading-relaxed">
                <p className="mb-2">収集した個人情報は、以下の目的で利用いたします。</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>本サービスの提供・運営のため</li>
                  <li>ユーザーからのお問い合わせに回答するため</li>
                  <li>メンテナンス、重要なお知らせなど必要に応じた連絡のため</li>
                  <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため</li>
                  <li>サービス改善のための分析</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">4. 個人情報の第三者提供</h2>
              <p className="text-gray-600 leading-relaxed">
                当サービスは、法令に基づく場合を除き、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。ただし、以下の場合はこの限りではありません。
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-gray-600 mt-2">
                <li>人の生命、身体または財産の保護のために必要がある場合</li>
                <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合</li>
                <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">5. 個人情報の開示</h2>
              <p className="text-gray-600 leading-relaxed">
                当サービスは、本人から個人情報の開示を求められたときは、本人に対し、遅滞なくこれを開示します。ただし、開示することにより次のいずれかに該当する場合は、その全部または一部を開示しないこともあり、開示しない決定をした場合には、その旨を遅滞なく通知します。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">6. Cookieの使用について</h2>
              <p className="text-gray-600 leading-relaxed">
                当サービスでは、ユーザーの利便性向上のためCookieを使用することがあります。Cookieの使用を希望されない場合は、ブラウザの設定でCookieを無効にすることができます。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">7. プライバシーポリシーの変更</h2>
              <p className="text-gray-600 leading-relaxed">
                当サービスは、個人情報に関して適用される日本の法令を遵守するとともに、本ポリシーの内容を適宜見直しその改善に努めます。修正された最新のプライバシーポリシーは常に本ページにて開示されます。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">8. お問い合わせ窓口</h2>
              <p className="text-gray-600 leading-relaxed">
                本ポリシーに関するお問い合わせは、<Link to="/contact" className="text-primary underline">お問い合わせページ</Link>からご連絡ください。
              </p>
            </section>

            <p className="text-sm text-gray-500 mt-8">
              制定日：2025年1月1日<br />
              最終更新日：2025年1月1日
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="text-center mt-8">
        <Button variant="outline" asChild>
          <Link to="/">トップページに戻る</Link>
        </Button>
      </div>
    </Layout>
  );
};

export default Privacy;
