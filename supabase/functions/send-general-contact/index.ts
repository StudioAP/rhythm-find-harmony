// Deno Edge Function環境用 - TypeScriptエラーは実行時には問題ありません
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface GeneralContactFormData {
  senderName: string
  senderEmail: string
  subject: string
  message: string
}

serve(async (req) => {
  // CORSヘッダーを設定
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  // OPTIONSリクエストの処理
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders })
    }

    const { senderName, senderEmail, subject, message }: GeneralContactFormData = await req.json()

    // 必須フィールドの検証
    if (!senderName || !senderEmail || !subject || !message) {
      return new Response('Missing required fields', { status: 400, headers: corsHeaders })
    }

    // 管理者へのメール内容
    const toAdminHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">【ピアノサーチ】お問い合わせがありました</h2>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #666; margin-bottom: 15px;">お問い合わせ内容</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 120px;">件名:</td>
              <td style="padding: 8px 0;">${subject}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">お名前:</td>
              <td style="padding: 8px 0;">${senderName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">メールアドレス:</td>
              <td style="padding: 8px 0;">${senderEmail}</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h3 style="color: #666; margin-bottom: 15px;">お問い合わせ内容:</h3>
          <p style="line-height: 1.6; white-space: pre-line;">${message}</p>
        </div>
        
        <div style="margin-top: 30px; padding: 15px; background-color: #e8f4f8; border-radius: 8px;">
          <p style="margin: 0; font-size: 14px; color: #666;">
            このメールは <strong>ピアノサーチ</strong> のお問い合わせフォームから自動送信されました。<br>
            お問い合わせいただいた方に直接ご返信ください。
          </p>
        </div>
      </div>
    `

    // 送信者への確認メール内容
    const toSenderHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">【ピアノサーチ】お問い合わせを受け付けました</h2>
        
        <p>${senderName} 様</p>
        
        <p>下記の内容でお問い合わせを受け付けました。<br>
        確認次第、ご返信いたします。</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #666; margin-bottom: 15px;">お問い合わせ内容</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 120px;">件名:</td>
              <td style="padding: 8px 0;">${subject}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">お名前:</td>
              <td style="padding: 8px 0;">${senderName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">メールアドレス:</td>
              <td style="padding: 8px 0;">${senderEmail}</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h3 style="color: #666; margin-bottom: 15px;">お問い合わせ内容:</h3>
          <p style="line-height: 1.6; white-space: pre-line;">${message}</p>
        </div>
        
        <div style="margin-top: 30px; padding: 15px; background-color: #e8f4f8; border-radius: 8px;">
          <p style="margin: 0; font-size: 14px; color: #666;">
            このメールは <strong>ピアノサーチ</strong> から自動送信されました。<br>
            ご不明点がございましたら、お気軽にお問い合わせください。
          </p>
        </div>
      </div>
    `

    // 管理者へのメール送信
    const adminEmailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Piano Search <onboarding@resend.dev>',
        to: ['piano.rythmique.find@gmail.com'],
        reply_to: senderEmail,
        subject: `【ピアノサーチ】${subject}`,
        html: toAdminHtml,
      }),
    })

    // 送信者への確認メール送信
    const senderEmailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Piano Search <onboarding@resend.dev>',
        to: [senderEmail],
        subject: '【ピアノサーチ】お問い合わせを受け付けました',
        html: toSenderHtml,
      }),
    })

    if (!adminEmailResponse.ok || !senderEmailResponse.ok) {
      console.error('Email sending failed:', {
        adminResponse: adminEmailResponse.status,
        senderResponse: senderEmailResponse.status
      })
      return new Response('Failed to send email', { status: 500, headers: corsHeaders })
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'お問い合わせを送信しました。確認メールをご確認ください。'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in send-general-contact function:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        message: 'メールの送信に失敗しました。しばらく時間をおいて再度お試しください。'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 