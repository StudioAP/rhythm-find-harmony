
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
    );
  } catch (err) {
    console.error("Webhook署名検証失敗:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        
        // サブスクリプション情報をSupabaseに保存
        await supabase.from("subscriptions").upsert({
          user_id: session.metadata?.user_id,
          stripe_customer_id: session.customer,
          stripe_subscription_id: subscription.id,
          status: "active",
          plan_type: session.metadata?.plan_type || "monthly",
          amount: subscription.items.data[0].price.unit_amount || 0,
          currency: "jpy",
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        });

        // 決済履歴に記録
        await supabase.from("payment_history").insert({
          user_id: session.metadata?.user_id,
          stripe_payment_intent_id: session.payment_intent,
          amount: session.amount_total || 0,
          currency: "jpy",
          status: "succeeded",
          description: `${session.metadata?.plan_type}プランの決済完了`,
        });

        console.log("サブスクリプション作成完了:", subscription.id);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
          
          // サブスクリプション情報を更新
          await supabase.from("subscriptions")
            .update({
              status: "active",
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // サブスクリプションを無効化
        await supabase.from("subscriptions")
          .update({
            status: "canceled",
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        // 関連する教室を非公開に
        const { data: subscriptionData } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (subscriptionData) {
          await supabase.from("classrooms")
            .update({ published: false, updated_at: new Date().toISOString() })
            .eq("user_id", subscriptionData.user_id);
        }
        break;
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook処理エラー:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});
