import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface ContactFormData {
  classroomName: string
  classroomEmail: string
  senderName: string
  senderEmail: string
  senderPhone?: string
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
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'POSTメソッドのみ許可されています。'
        }),
        { 
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { classroomName, classroomEmail, senderName, senderEmail, senderPhone, message }: ContactFormData = await req.json()

    // 必須フィールドの検証
    if (!classroomName || !classroomEmail || !senderName || !senderEmail || !message) {
      console.error('Missing required fields:', { classroomName, classroomEmail, senderName, senderEmail, message })
      return new Response(
        JSON.stringify({ 
          success: false,
          message: '必須フィールドが不足しています。'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // API キーの確認
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set')
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'メール送信の設定に問題があります。'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Sending email with data:', { classroomName, classroomEmail, senderName, senderEmail })

    // 教室運営者へのメール内容
    const toClassroomHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">【ピアノサーチ】お問い合わせがありました</h2>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #666; margin-bottom: 15px;">お問い合わせ内容</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 120px;">教室名:</td>
              <td style="padding: 8px 0;">${classroomName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">お名前:</td>
              <td style="padding: 8px 0;">${senderName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">メールアドレス:</td>
              <td style="padding: 8px 0;">${senderEmail}</td>
            </tr>
            ${senderPhone ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">電話番号:</td>
              <td style="padding: 8px 0;">${senderPhone}</td>
            </tr>
            ` : ''}
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
        教室からのご連絡をしばらくお待ちください。</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #666; margin-bottom: 15px;">お問い合わせ内容</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 120px;">教室名:</td>
              <td style="padding: 8px 0;">${classroomName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">お名前:</td>
              <td style="padding: 8px 0;">${senderName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">メールアドレス:</td>
              <td style="padding: 8px 0;">${senderEmail}</td>
            </tr>
            ${senderPhone ? `
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">電話番号:</td>
              <td style="padding: 8px 0;">${senderPhone}</td>
            </tr>
            ` : ''}
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

    // 教室運営者へのメール送信
    const classroomEmailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Piano Search <onboarding@resend.dev>',
        to: [classroomEmail],
        reply_to: senderEmail,
        subject: `【ピアノサーチ】${classroomName}へのお問い合わせ`,
        html: toClassroomHtml,
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

    if (!classroomEmailResponse.ok || !senderEmailResponse.ok) {
      // 詳細なエラー情報を取得
      const classroomError = !classroomEmailResponse.ok ? await classroomEmailResponse.text() : null
      const senderError = !senderEmailResponse.ok ? await senderEmailResponse.text() : null
      
      console.error('Email sending failed:', {
        classroomResponse: classroomEmailResponse.status,
        senderResponse: senderEmailResponse.status,
        classroomError,
        senderError
      })
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
    console.error('Error in send-contact-email function:', error)
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