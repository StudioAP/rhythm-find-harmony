import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// Supabase Admin Clientの初期化
const supabaseAdmin = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null;

if (!supabaseAdmin) {
  console.error("Supabase Admin Clientの初期化に失敗しました。SUPABASE_URLとSUPABASE_SERVICE_ROLE_KEYの環境変数を確認してください。");
}

interface ContactFormData {
  classroomName: string
  classroomEmail: string
  senderName: string
  senderEmail: string
  senderPhone?: string
  message: string
}

Deno.serve(async (req: Request): Promise<Response> => {
  console.log('REV 2025-06-01-FINAL-MONITORING');
  console.log('▼ REQUEST at', new Date().toISOString());
  console.log('REQUEST METHOD:', req.method);
  console.log('REQUEST URL:', req.url);

  // CORSヘッダーを設定
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  // OPTIONSリクエストの処理
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request - returning CORS headers');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      console.log('Non-POST method rejected:', req.method);
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

    console.log('About to read request body...');
    const requestBody = await req.text();
    console.log('Request body received, length:', requestBody.length);
    console.log('Request body preview:', requestBody.slice(0, 200));
    
    let parsedData;
    try {
      parsedData = JSON.parse(requestBody);
      console.log('JSON parsing successful');
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'JSONの解析に失敗しました。'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { classroomName, classroomEmail, senderName, senderEmail, senderPhone, message }: ContactFormData = parsedData;

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

    console.log('Sending contact email to classroom owner:', { classroomName, classroomEmail, senderName, senderEmail })

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
            お問い合わせ主（${senderName} 様: ${senderEmail}）に直接ご返信ください。
          </p>
        </div>
      </div>
    `

    // 教室運営者へのメール送信（タイムアウト付き）
    console.log('About to call Resend API...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('Aborting Resend API call due to timeout (10 seconds)');
      controller.abort();
    }, 10000); // 10秒でタイムアウト

    let classroomEmailResponse;
    try {
      classroomEmailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Piano Search Contact <onboarding@resend.dev>',
          to: [classroomEmail],
          reply_to: senderEmail,
          subject: `【ピアノサーチ】${classroomName} へのお問い合わせがありました（${senderName} 様より）`,
          html: toClassroomHtml,
        }),
        signal: controller.signal
      });
      console.log('Resend API call completed, status:', classroomEmailResponse.status);

      // 運用監視：メールログDB保存
      if (supabaseAdmin) {
        const logData = {
          id: crypto.randomUUID(),
          to_email: classroomEmail, // to はSQL予約語の可能性があるため変更
          status: classroomEmailResponse.status,
          ts: new Date().toISOString(),
          sender_email: senderEmail,
          classroom_name: classroomName,
          resend_response_text: classroomEmailResponse.ok ? null : await classroomEmailResponse.clone().text() // エラー時のみレスポンス本文を保存
        };
        try {
          const { error: logError } = await supabaseAdmin.from('mail_logs').insert(logData);
          if (logError) {
            console.error('Failed to insert mail_log:', logError);
            // ログ保存失敗はメール送信成功/失敗に影響させない
          } else {
            console.log('Mail log inserted successfully:', logData.id);
          }
        } catch (dbError) {
          console.error('Error inserting mail_log (catch block):', dbError);
        }
      } else {
        console.warn("Supabase Admin Clientが初期化されていないため、メールログは保存されません。");
      }

    } catch (fetchError) {
      console.error('Resend API call failed:', fetchError);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('Request was aborted due to timeout');
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!classroomEmailResponse.ok) {
      const classroomErrorText = await classroomEmailResponse.text() // clone()は不要、一度text()を読む
      console.error('Failed to send email to classroom owner:', {
        status: classroomEmailResponse.status,
        error: classroomErrorText, // errorではなくerrorTextやresponseTextが適切
      })
      // 運用監視：Logflareアラート用
      console.error('ALERT', {tag:'edge-fn', fn:'send-contact-email', status:classroomEmailResponse.status, error_detail: classroomErrorText});

      return new Response(
        JSON.stringify({
          success: false,
          message: '教室運営者へのメール送信に失敗しました。しばらく時間をおいて再度お試しください。'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Email sent successfully, preparing response...');

    // お問い合わせ送信成功のレスポンス
    // フロントエンド側で「お問い合わせありがとうございました...」というメッセージを表示することを想定
    return new Response(
      JSON.stringify({
        success: true,
        message: 'お問い合わせを送信しました。' 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in send-contact-email function:', error)
    // 運用監視：Logflareアラート用 (予期せぬエラー)
    console.error('ALERT', {tag:'edge-fn', fn:'send-contact-email', status:500, error_detail: error instanceof Error ? error.message : String(error)});
    return new Response(
      JSON.stringify({
        success: false,
        message: 'メールの送信処理中に予期せぬエラーが発生しました。'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})