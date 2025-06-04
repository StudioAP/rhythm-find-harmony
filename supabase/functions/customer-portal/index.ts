// Edge Function (Deno環境) 専用
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("Customer Portal Function STarted - ABE TEST"); // ABE TEST
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Customer Portal: リクエスト処理開始");
    
    // すべての受信ヘッダーをログに出力
    const allHeaders: { [key: string]: string } = {};
    req.headers.forEach((value, key) => {
      allHeaders[key] = value;
    });
    console.log("Customer Portal: 受信ヘッダー一覧:", JSON.stringify(allHeaders));
    
    // リクエストボディを読み取り
    let requestBody = {};
    try {
      const bodyText = await req.text();
      if (bodyText) {
        requestBody = JSON.parse(bodyText);
        console.log("Customer Portal: リクエストボディ受信", requestBody);
      }
    } catch (parseError) {
      console.log("Customer Portal: ボディ解析スキップ（空または無効なJSON）");
    }
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      // Authorizationヘッダーがない場合、他のヘッダーも確認（デバッグ用）
      console.error("Customer Portal: Authorizationヘッダーが見つかりません。apikeyヘッダー:", req.headers.get("apikey"));
      console.error("Customer Portal: Authorizationヘッダーが見つかりません。x-client-infoヘッダー:", req.headers.get("x-client-info"));
      throw new Error("認証ヘッダーがありません");
    }
    console.log("Customer Portal: 認証ヘッダー受信");
    
    const token = authHeader.replace("Bearer ", "");
    
    // 環境変数取得とデバッグログ
    const supabaseUrlFromEnv = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKeyFromEnv = Deno.env.get('SUPABASE_ANON_KEY');
    console.log("Customer Portal: SUPABASE_URL from env:", supabaseUrlFromEnv ? supabaseUrlFromEnv.substring(0, 20) + "..." : "NOT FOUND");
    console.log("Customer Portal: SUPABASE_ANON_KEY from env:", supabaseAnonKeyFromEnv ? supabaseAnonKeyFromEnv.substring(0, 20) + "..." : "NOT FOUND");

    const supabaseServiceRoleKeyFromEnv = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    console.log("Customer Portal: SUPABASE_SERVICE_ROLE_KEY from env:", supabaseServiceRoleKeyFromEnv ? supabaseServiceRoleKeyFromEnv.substring(0, 20) + "..." : "NOT FOUND");

    const stripeSecretKeyProd = Deno.env.get("STRIPE_SECRET_KEY_PROD");
    const stripeSecretKeyTest = Deno.env.get("STRIPE_SECRET_KEY_TEST");
    console.log("Customer Portal: STRIPE_SECRET_KEY_PROD from env:", stripeSecretKeyProd ? stripeSecretKeyProd.substring(0, 8) + "..." : "NOT FOUND");
    console.log("Customer Portal: STRIPE_SECRET_KEY_TEST from env:", stripeSecretKeyTest ? stripeSecretKeyTest.substring(0, 8) + "..." : "NOT FOUND");

    let stripeSecretKey: string | undefined;
    if (stripeSecretKeyProd && stripeSecretKeyProd.startsWith("sk_live_")) {
      stripeSecretKey = stripeSecretKeyProd;
    } else if (stripeSecretKeyTest && stripeSecretKeyTest.startsWith("sk_test_")) {
      stripeSecretKey = stripeSecretKeyTest;
    } else {
      stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    }
    
    console.log("Customer Portal: Selected Stripe Key type:", stripeSecretKey === stripeSecretKeyProd ? "PROD" : stripeSecretKey === stripeSecretKeyTest ? "TEST" : "Fallback/Direct");
    
    console.log("Customer Portal: 環境変数確認", {
      stripeSecretKeyAvailable: !!stripeSecretKey
    });

    if (!stripeSecretKey) {
      throw new Error("必要な環境変数が設定されていません");
    }

    // Supabase初期化（Context7公式推奨：ANON_KEY使用）
    const supabaseClient = createClient(
      supabaseUrlFromEnv ?? '',
      supabaseAnonKeyFromEnv ?? ''
    );
    console.log("Customer Portal: Supabase初期化完了");

    // 認証確認（Context7公式パターン：getUser()に直接トークンを渡す）
    const { data, error: userError } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (userError || !user) {
      console.error("認証エラー詳細:", userError);
      console.error("認証エラー: ユーザーが見つかりません or userErrorあり");
      throw new Error("認証が無効です");
    }
    console.log("Customer Portal: ユーザー認証成功", user.id);

    // ★★★ RLSバイパスのため、SERVICE_ROLE_KEYで新しいクライアントを作成 ★★★
    if (!supabaseServiceRoleKeyFromEnv) {
      console.error("Customer Portal: SUPABASE_SERVICE_ROLE_KEY が見つかりません。RLSバイパス不可。");
      throw new Error("サーバー内部エラー: 必要な認証情報が不足しています。");
    }
    const supabaseAdminClient = createClient(
      supabaseUrlFromEnv ?? '',
      supabaseServiceRoleKeyFromEnv
    );
    console.log("Customer Portal: Admin Supabaseクライアント初期化完了");

    // Stripe初期化
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-04-30.basil",
    });
    console.log("Customer Portal: Stripe初期化完了");

    // サブスクリプション情報を取得 (SERVICE_ROLE_KEYクライアントを使用)
    const { data: subscription, error: subscriptionError } = await supabaseAdminClient
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    console.log("Customer Portal: サブスクリプション取得結果 (Admin Client)", { subscription, subscriptionError });

    if (subscriptionError) {
      console.error("サブスクリプション取得エラー:", subscriptionError);
      if (subscriptionError.code === 'PGRST116') {
        throw new Error("アクティブなサブスクリプションが見つかりません。まずサブスクリプションを開始してください。");
      }
      throw new Error(`サブスクリプションの取得に失敗しました: ${subscriptionError.message}`);
    }

    if (!subscription) {
      throw new Error("アクティブなサブスクリプションが見つかりません。まずサブスクリプションを開始してください。");
    }

    if (!subscription.stripe_customer_id) {
      throw new Error("Stripeカスタマー情報が設定されていません。サポートにお問い合わせください。");
    }

    console.log("Customer Portal: Stripeカスタマー確認", subscription.stripe_customer_id);

    // Stripe Customer Portal セッション作成
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${req.headers.get("origin") || "http://localhost:3000"}/dashboard`,
    });

    console.log("Customer Portal: セッション作成完了", session.url);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    console.error("ERROR CATCH BLOCK - ABE TEST:", error); // ABE TEST
    console.error("Customer Portal作成エラー詳細:", error);
    const errorMessage = error instanceof Error ? error.message : "不明なエラー";
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: "Customer Portal セッションの作成に失敗しました"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
