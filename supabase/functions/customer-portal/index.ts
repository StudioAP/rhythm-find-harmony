import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Customer Portal: リクエスト処理開始");
    
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
      throw new Error("認証ヘッダーがありません");
    }
    console.log("Customer Portal: 認証ヘッダー受信");
    
    const token = authHeader.replace("Bearer ", "");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    
    console.log("Customer Portal: 環境変数確認", {
      supabaseUrl: !!supabaseUrl,
      supabaseServiceKey: !!supabaseServiceKey, 
      stripeSecretKey: !!stripeSecretKey
    });

    if (!supabaseUrl || !supabaseServiceKey || !stripeSecretKey) {
      throw new Error("必要な環境変数が設定されていません");
    }

    // Supabase初期化
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("Customer Portal: Supabase初期化完了");

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error("認証エラー:", authError);
      throw new Error("認証が無効です");
    }
    console.log("Customer Portal: ユーザー認証成功", user.id);

    // Stripe初期化（型定義で要求されているバージョンを使用）
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-04-30.basil",
      httpClient: Stripe.createFetchHttpClient(),
    });
    console.log("Customer Portal: Stripe初期化完了");

    // サブスクリプション情報を取得
    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    console.log("Customer Portal: サブスクリプション取得結果", { subscription, subscriptionError });

    if (subscriptionError || !subscription) {
      throw new Error("アクティブなサブスクリプションの取得に失敗しました");
    }

    if (!subscription.stripe_customer_id) {
      throw new Error("Stripeカスタマーが設定されていません");
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
    console.error("Customer Portal作成エラー:", error);
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
