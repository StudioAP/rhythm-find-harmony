
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const Terms = () => {
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
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold text-center mb-8">利用規約</h1>
          
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-8">
                <section>
                  <h2 className="text-xl font-bold mb-4">第1条（適用）</h2>
                  <p className="text-gray-600 leading-relaxed">
                    この利用規約（以下「本規約」）は、Piano Search（以下「当サービス」）がこのウェブサイト上で提供するサービス（以下「本サービス」）の利用条件を定めるものです。登録ユーザーの皆さま（以下「ユーザー」）には、本規約に従って本サービスをご利用いただきます。
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-bold mb-4">第2条（利用登録）</h2>
                  <p className="text-gray-600 leading-relaxed">
                    本サービスにおいて、登録希望者が当サービスの定める方法によって利用登録を申請し、当サービスがこれを承認することによって、利用登録が完了するものとします。
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-bold mb-4">第3条（ユーザーIDおよびパスワードの管理）</h2>
                  <p className="text-gray-600 leading-relaxed">
                    ユーザーは、自己の責任において、本サービスのユーザーIDおよびパスワードを適切に管理するものとします。ユーザーは、いかなる場合にも、ユーザーIDおよびパスワードを第三者に譲渡または貸与し、もしくは第三者と共用することはできません。
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-bold mb-4">第4条（料金および支払方法）</h2>
                  <p className="text-gray-600 leading-relaxed">
                    教室掲載サービスの利用料金は月額500円（税込）とします。料金は毎月前払いとし、当サービスが指定する決済方法によりお支払いいただきます。
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-bold mb-4">第5条（禁止事項）</h2>
                  <div className="text-gray-600 leading-relaxed">
                    <p className="mb-2">ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>法令または公序良俗に違反する行為</li>
                      <li>犯罪行為に関連する行為</li>
                      <li>虚偽の情報を登録する行為</li>
                      <li>他のユーザーまたは第三者の知的財産権、肖像権、プライバシー、名誉その他の権利または利益を侵害する行為</li>
                      <li>本サービスの運営を妨害するおそれのある行為</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-bold mb-4">第6条（本サービスの提供の停止等）</h2>
                  <p className="text-gray-600 leading-relaxed">
                    当サービスは、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-bold mb-4">第7条（免責事項）</h2>
                  <p className="text-gray-600 leading-relaxed">
                    当サービスは、本サービスに事実上または法律上の瑕疵がないことを明示的にも黙示的にも保証しておりません。当サービスは、本サービスに起因してユーザーに生じたあらゆる損害について一切の責任を負いません。
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-bold mb-4">第8条（規約の変更）</h2>
                  <p className="text-gray-600 leading-relaxed">
                    当サービスは、ユーザーに通知することなく、いつでも本規約を変更することができるものとします。変更後の利用規約は、本ウェブサイトに掲載された時点から効力を生じるものとします。
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

export default Terms;
