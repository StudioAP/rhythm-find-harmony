# Supabase SMTP設定完璧でもメール送信失敗の謎 - 詳細技術調査レポート

## 📋 問題概要

**環境**: React + Vite + TypeScript + Supabase + Resend  
**症状**: Supabase Auth経由のメール送信が失敗するが、**Resend API直接送信は完全成功**  
**謎**: 全く同じAPIキー・ドメインで、直接送信は成功、SMTP経由は失敗

---

## 🔍 現在の設定状況（完全確認済み）

### ✅ Supabase SMTP設定（完璧）
**Authentication → Settings → Email**

| 項目 | 設定値 | 状態 |
|------|--------|------|
| **Host** | `smtp.resend.com` | ✅ 正しい |
| **Port** | `587` | ✅ 正しい |
| **Username** | `resend` | ✅ 正しい |
| **Password** | `re_JB4VwPjw_Fi9RfT5J9B5kyA4iV25wA8cc` | ✅ 有効なAPIキー |
| **Sender Name** | `ピアノ教室・リトミック教室検索.com` | ✅ 設定済み |
| **Sender Email** | `info@piaryth.org` | ✅ 認証済みドメイン |

**重要**: 設定保存は確実に実行済み

### ✅ Resend MCP設定（完全動作）
```json
{
  "resend": {
    "type": "command",
    "command": "node /Users/akipinnote/Downloads/2025-05-25Lovable/mcp-send-email/build/index.js --key=re_JB4VwPjw_Fi9RfT5J9B5kyA4iV25wA8cc --sender=info@piaryth.org"
  }
}
```

---

## 🧪 詳細テスト結果

### **テスト1: Resend MCP直接送信（✅ 完全成功）**
```
日時: 2025-06-02 20:32
宛先: piano.rythmique.find@gmail.com
件名: "Resend Direct Test #2"
送信者: info@piaryth.org
結果: ✅ 2分で受信確認
メールID: ffb65c6f-be73-420e-bc99-4ec450c1a9cc
```

**受信メール詳細:**
```
送信者表示: info@piaryth.org
受信時刻: 20:34 (送信から2分後)
内容: 完全受信、フォーマット正常
スパム判定: なし（受信トレイに正常配信）
```

### **テスト2: Supabase Auth認証メール（❌ 失敗）**
```
日時: 2025-06-02 20:32 (同時刻)
宛先: piano.rythmique.find@gmail.com  
Supabase API: 200 OK（ユーザー作成成功）
ユーザーID: bb52d420-2f10-43ad-bbc4-83265f920cf7
結果: ❌ メール未受信
```

**Supabase API レスポンス:**
```javascript
data.user: {
  id: 'bb52d420-2f10-43ad-bbc4-83265f920cf7',
  email: 'piano.rythmique.find@gmail.com',
  created_at: '2025-06-02T11:32:59.159468519Z',
  email_confirmed_at: undefined,  // ← 未確認
  updated_at: '2025-06-02T11:32:59.159468519Z'
}
Time difference: 10ms（新規ユーザー確認）
```

---

## 📊 ログ分析結果

### **Supabase Auth Service ログ**
```
期間: 2025-06-02 11:00-20:35
結果: 空（ログエントリなし）
```

**問題**: メール送信試行のログが一切記録されていない

### **Resend Activity ログ**
```
✅ MCP送信1: 2025-06-02 20:10頃 - Status: Processed
✅ MCP送信2: 2025-06-02 20:32頃 - Status: Processed  
❌ SMTP送信: 記録なし（全期間）
```

**重要な発見**: Resend側にSMTP経由での送信試行記録が一切ない

---

## 🤔 技術的分析

### **1. SMTP接続の可能性**
```
✅ Resend SMTP サーバー: smtp.resend.com:587 (正常)
✅ APIキー認証: 有効（MCP経由で確認済み）
✅ ドメイン認証: info@piaryth.org (送信可能確認済み)
❓ Supabase → Resend SMTP接続: 不明
```

### **2. ネットワーク・接続問題**
```
可能性1: Supabase サーバーからResendへのSMTP接続失敗
可能性2: SMTP認証でのAPIキー形式問題
可能性3: Supabaseの内部メールキュー問題
可能性4: TLS/SSL接続問題
```

### **3. 設定の微細な問題**
```
確認済み: ホスト名、ポート、ユーザー名
確認済み: APIキー（MCP動作で証明）
確認済み: 送信者アドレス
未確認: Supabase内部での設定解釈
```

---

## 🔧 実施済み対策

### **✅ 完了済み修正**
1. **API Key設定**: 以前は未設定 → 現在は正しく設定済み
2. **Sender Email**: `no-reply@pianosearch.com` → `info@piaryth.org`
3. **Sender Name**: `Piano Search` → `ピアノ教室・リトミック教室検索.com`
4. **設定保存**: 複数回実行・確認済み

### **✅ 検証済み事項**
1. **Resend API権限**: 送信権限あり（MCP経由確認）
2. **ドメイン認証**: `info@piaryth.org` 完全動作
3. **Gmail受信**: 正常（スパムフィルタなし）
4. **API制限**: 未達（無料枠内）

---

## 🛠️ 環境詳細

### **Supabase プロジェクト**
```
Project ID: gftbjdazuhjcvqvssyiu
Organization: swnyfcxygtcdmjwoaknp  
Region: ap-northeast-1
Status: ACTIVE_HEALTHY
Subscription: 無料プラン
```

### **Resend設定**
```
API Key: re_JB4VwPjw_Fi9RfT5J9B5kyA4iV25wA8cc
Domain: piaryth.org (認証状況要確認)
送信制限: 100通/日（無料プラン）
使用状況: 数通のみ（制限内）
```

### **開発環境**
```
フロントエンド: React + Vite + TypeScript
認証ライブラリ: @supabase/supabase-js
デプロイ: Cloudflare Pages
ローカル開発: http://localhost:3000
```

---

## 🎯 想定される原因仮説

### **仮説1: Supabase SMTP内部処理問題**
```
症状: API 200 OK だがメール送信処理が内部で失敗
原因: Supabase側のSMTPクライアント実装問題
対策: 別のEmail Provider試行、またはSupabaseサポート問い合わせ
```

### **仮説2: ResendのSMTP vs API認証差異**
```
症状: API認証は成功、SMTP認証は失敗  
原因: SMTPでのAPIキー使用時の認証方式違い
対策: ResendのSMTP専用認証情報確認
```

### **仮説3: Supabase設定の内部キャッシュ問題**
```
症状: 設定変更が内部的に反映されていない
原因: Supabase内部での設定キャッシュ
対策: プロジェクト再起動、または時間をおいて再試行
```

### **仮説4: TLS/暗号化接続問題**
```
症状: SMTP TLS接続が失敗
原因: Supabase → Resend間のTLS negotiation失敗
対策: 異なるポート設定（25, 465, 2587）試行
```

---

## 📋 未確認・調査必要事項

### **🔍 Resend側確認**
1. **ドメイン認証状況**: `piaryth.org` の詳細ステータス
2. **SMTP認証ログ**: 失敗した認証試行があるか
3. **API vs SMTP権限**: 同一APIキーでの権限差異
4. **SMTP制限**: API制限とは別のSMTP制限

### **🔍 Supabase側確認**
1. **内部ログ**: より詳細なAuth service ログ
2. **SMTP接続試行**: 内部でのSMTP接続記録
3. **設定反映状況**: 変更した設定の実際の反映状況
4. **代替設定**: 他のEmail Provider（SendGrid等）での動作

### **🔍 ネットワーク調査**
1. **接続性テスト**: Supabase → smtp.resend.com:587
2. **DNS解決**: Supabase環境でのDNS解決状況
3. **ファイアウォール**: 送信方向SMTP接続制限

---

## 💡 提案される解決策

### **即座に試行可能な対策**
1. **異なるSMTPポート設定**: 25, 465, 2587
2. **ResendのSMTP認証情報再生成**: 新しいAPIキー生成・設定
3. **Supabaseプロジェクトの設定リセット**: 全Email設定を一旦クリア→再設定
4. **代替Email Provider**: SendGrid、Mailgun等でのテスト

### **技術的調査方法**
1. **Resend Dashboard詳細分析**: SMTP接続試行ログの確認
2. **Supabaseサポート問い合わせ**: SMTP接続の内部ログ確認
3. **ネットワーク診断**: telnet等でのSMTP接続テスト
4. **設定比較**: 他の成功事例との設定比較

### **代替実装検討**
1. **Edge Functions実装**: Supabase Auth bypassing、直接Resend API使用
2. **Webhook実装**: 認証後に別途メール送信処理
3. **フロントエンド実装**: クライアント側からの直接API送信

---

## 🚨 緊急度・影響度

### **ビジネス影響**
- **高**: 新規ユーザー登録が完了できない
- **ユーザー体験**: 混乱（メール送信表示だが未着）
- **登録率**: 0%（確認メール必須のため）

### **技術的重要性**
- **謎の問題**: 設定は完璧だが動作しない希少ケース
- **学習価値**: SupabaseとResendの統合問題の貴重な事例
- **解決緊急度**: 高（サービス機能停止状態）

---

## 📞 サポート問い合わせ推奨事項

### **Supabaseサポート**
```
件名: SMTP Email送信が設定完璧でも失敗する問題
プロジェクトID: gftbjdazuhjcvqvssyiu
問題: 正しいSMTP設定でもメール送信されず、Auth serviceログも空
```

### **Resendサポート** 
```
件名: SMTP経由での送信試行記録が一切ないが、API直接送信は成功
APIキー: re_JB4VwPjw_Fi9RfT5J9B5kyA4iV25wA8cc
問題: 同一キーでAPI成功、SMTP失敗
```

**この問題は設定ミスではなく、より深いレベルでの接続・認証・処理問題の可能性が高いです。** 