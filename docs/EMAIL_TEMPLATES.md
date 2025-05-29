# Piano Search - 日本語メールテンプレート

## Confirm Signup（新規登録確認）テンプレート

**Subject:** Piano Search - メールアドレスの確認

**HTML Content:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Piano Search - メールアドレスの確認</title>
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin-bottom: 10px;">🎹 Piano Search</h1>
        <p style="color: #666; font-size: 18px;">ピアノ教室検索サービス</p>
    </div>
    
    <div style="background-color: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
        <h2 style="color: #1e40af; margin-bottom: 20px;">メールアドレスの確認</h2>
        
        <p style="margin-bottom: 20px;">Piano Searchにご登録いただき、ありがとうございます！</p>
        
        <p style="margin-bottom: 20px;">アカウントを有効化するため、以下のボタンをクリックしてメールアドレスを確認してください：</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ .ConfirmationURL }}" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                メールアドレスを確認する
            </a>
        </div>
        
        <p style="margin-bottom: 20px; color: #666; font-size: 14px;">
            ボタンが機能しない場合は、以下のリンクをコピーしてブラウザに貼り付けてください：<br>
            <a href="{{ .ConfirmationURL }}" style="color: #2563eb; word-break: break-all;">{{ .ConfirmationURL }}</a>
        </p>
        
        <p style="margin-bottom: 20px; color: #666; font-size: 14px;">
            または、以下の6桁の確認コードを入力してください：<br>
            <strong style="font-size: 20px; color: #2563eb; letter-spacing: 3px;">{{ .Token }}</strong>
        </p>
    </div>
    
    <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>⚠️ 重要：</strong> このメールに心当たりがない場合は、このメールを無視してください。第三者がお客様のメールアドレスを誤って入力した可能性があります。
        </p>
    </div>
    
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #666; font-size: 14px; margin-bottom: 10px;">
            このメールは Piano Search から自動送信されました。
        </p>
        <p style="color: #666; font-size: 12px; margin-bottom: 0;">
            © 2025 Piano Search. All rights reserved.
        </p>
    </div>
</body>
</html>
```

## Reset Password（パスワードリセット）テンプレート

**Subject:** Piano Search - パスワードリセット

**HTML Content:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Piano Search - パスワードリセット</title>
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin-bottom: 10px;">🎹 Piano Search</h1>
        <p style="color: #666; font-size: 18px;">ピアノ教室検索サービス</p>
    </div>
    
    <div style="background-color: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
        <h2 style="color: #dc2626; margin-bottom: 20px;">🔐 パスワードリセット</h2>
        
        <p style="margin-bottom: 20px;">{{ .Email }} 様</p>
        
        <p style="margin-bottom: 20px;">Piano Searchアカウントのパスワードリセットがリクエストされました。</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ .ConfirmationURL }}" 
               style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                新しいパスワードを設定する
            </a>
        </div>
        
        <p style="margin-bottom: 20px; color: #666; font-size: 14px;">
            このリンクは24時間有効です。期限切れの場合は、再度パスワードリセットをリクエストしてください。
        </p>
    </div>
    
    <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>⚠️ 重要：</strong> パスワードリセットをリクエストしていない場合は、このメールを無視してください。お客様のアカウントは安全に保護されています。
        </p>
    </div>
    
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #666; font-size: 14px; margin-bottom: 10px;">
            このメールは Piano Search から自動送信されました。
        </p>
        <p style="color: #666; font-size: 12px; margin-bottom: 0;">
            © 2025 Piano Search. All rights reserved.
        </p>
    </div>
</body>
</html>
```

## Magic Link（マジックリンク）テンプレート

**Subject:** Piano Search - ログインリンク

**HTML Content:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Piano Search - ログインリンク</title>
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin-bottom: 10px;">🎹 Piano Search</h1>
        <p style="color: #666; font-size: 18px;">ピアノ教室検索サービス</p>
    </div>
    
    <div style="background-color: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
        <h2 style="color: #059669; margin-bottom: 20px;">✨ ログインリンク</h2>
        
        <p style="margin-bottom: 20px;">{{ .Email }} 様</p>
        
        <p style="margin-bottom: 20px;">Piano Searchへのログインリンクです。以下のボタンをクリックして簡単にログインできます：</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ .ConfirmationURL }}" 
               style="background-color: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Piano Searchにログイン
            </a>
        </div>
        
        <p style="margin-bottom: 20px; color: #666; font-size: 14px;">
            このリンクは1時間有効です。セキュリティのため、使用後は無効になります。
        </p>
    </div>
    
    <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>⚠️ 重要：</strong> このログインリンクをリクエストしていない場合は、このメールを無視してください。
        </p>
    </div>
    
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #666; font-size: 14px; margin-bottom: 10px;">
            このメールは Piano Search から自動送信されました。
        </p>
        <p style="color: #666; font-size: 12px; margin-bottom: 0;">
            © 2025 Piano Search. All rights reserved.
        </p>
    </div>
</body>
</html>
```

## 設定方法

1. Supabaseダッシュボード → Authentication → Email Templates
2. 各テンプレートを選択して上記HTMLをコピペ
3. Subjectも忘れずに日本語に変更
4. 保存して完了

## 注意点

- `{{ .ConfirmationURL }}` `{{ .Token }}` `{{ .Email }}` などの変数は必ず保持する
- 本番環境では画像も正常に表示される
- プレビューで画像が壊れて見えても問題なし 