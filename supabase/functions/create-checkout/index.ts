// @ts-nocheck - Edge Function (Deno環境) 専用
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
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    
    // Supabaseクライアントでユーザー認証
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("ユーザーが認証されていません");

    // 🔽 START EDIT
    const stripeSecretKeyProd = Deno.env.get("STRIPE_SECRET_KEY_PROD");
    const stripeSecretKeyTest = Deno.env.get("STRIPE_SECRET_KEY_TEST");

    let stripeSecretKey: string | undefined;
    if (stripeSecretKeyProd && stripeSecretKeyProd.startsWith("sk_live_")) {
      stripeSecretKey = stripeSecretKeyProd;
    } else if (stripeSecretKeyTest && stripeSecretKeyTest.startsWith("sk_test_")) {
      stripeSecretKey = stripeSecretKeyTest;
    } else {
      stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY"); // フォールバック
    }

    if (!stripeSecretKey) {
      throw new Error("Stripeのシークレットキーが設定されていません。");
    }

    const stripe = new Stripe(stripeSecretKey, {
    // 🔼 END EDIT
      apiVersion: "2023-10-16",
    });

    // 既存のStripe顧客を確認
    const customers = await stripe.customers.list({ 
      email: user.email, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // 月額500円固定プラン
    const planConfig = {
      amount: 500,
      interval: "month",
      productName: "ピアノ教室掲載サービス"
    };

    // Stripe Checkout セッションを作成
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: { 
              name: planConfig.productName 
            },
            unit_amount: planConfig.amount,
            recurring: { interval: planConfig.interval },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/dashboard?success=true`,
      cancel_url: `${req.headers.get("origin")}/dashboard?canceled=true`,
      metadata: {
        user_id: user.id,
        plan_type: "monthly",
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("決済セッション作成エラー:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
