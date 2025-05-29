// @ts-nocheck - Edge Function (Deno環境) 専用
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

serve(async (req) => {
  try {
    console.log("Webhook received, processing...");
    
    // 環境変数チェック（デバッグ用）
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    console.log("Environment check:", {
      hasStripeKey: !!stripeSecretKey,
      hasWebhookSecret: !!webhookSecret,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRole: !!serviceRoleKey
    });

    // ★ 修正1: stripe-signature ヘッダーを小文字で取得
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("Missing stripe-signature header");
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    if (!webhookSecret) {
      console.error("Missing STRIPE_WEBHOOK_SECRET environment variable");
      return new Response("Missing webhook secret", { status: 500 });
    }

    // ★ 修正2: Deno環境用に適切な形式で生のバイト列を取得
    const rawBodyArrayBuffer = await req.arrayBuffer();
    const rawBody = new Uint8Array(rawBodyArrayBuffer);
    console.log("Raw body length:", rawBody.byteLength);

    let event: Stripe.Event;
    try {
      // ★ 修正3: Deno環境では非同期版を使用
      event = await stripe.webhooks.constructEventAsync(
        rawBody,
        signature,
        webhookSecret
      );
      console.log("Webhook signature verified successfully, event type:", event.type);
    } catch (err) {
      console.error("Webhook署名検証失敗:", err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // ★ 修正4: 冪等性チェック - 正しいカラム名を使用
    const { data: existingEvent, error: selectError } = await supabase
      .from("processed_stripe_events")
      .select("id")
      .eq("stripe_event_id", event.id)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error("Processed event check error:", selectError);
      return new Response("Internal Server Error during event check", { status: 500 });
    }

    if (existingEvent) {
      console.log(`Event ${event.id} already processed.`);
      return new Response(JSON.stringify({ received: true, processed: true, message: "Event already processed" }), { status: 200 });
    }

    console.log(`Processing new event: ${event.id} (${event.type})`);

    let session; // スコープを上げる

    switch (event.type) {
      case "checkout.session.completed": {
        console.log("Processing checkout.session.completed");
        session = event.data.object as Stripe.Checkout.Session;
        
        if (!session.subscription) {
          console.error("No subscription found in checkout session");
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        
        console.log("Retrieved subscription:", subscription.id);

        // ★ 修正5: user_id の存在確認
        const userId = session.metadata?.user_id;
        if (!userId) {
          console.error("No user_id found in session metadata");
          // user_id なしでも処理を続行（後で手動で紐付け可能）
        }

        const { error: subscriptionError } = await supabase.from("subscriptions").upsert({
          user_id: userId,
          stripe_customer_id: session.customer,
          stripe_subscription_id: subscription.id,
          status: "active",
          amount: 500, // 月額¥500固定
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        });

        if (subscriptionError) {
          console.error("Subscription upsert error:", subscriptionError);
          throw new Error(`Subscription upsert failed: ${subscriptionError.message}`);
        }

        const { error: paymentError } = await supabase.from("payment_history").insert({
          user_id: userId,
          stripe_payment_intent_id: session.payment_intent,
          amount: 500,
          currency: "jpy",
          status: "succeeded",
        });

        if (paymentError) {
          console.error("Payment history insert error:", paymentError);
          throw new Error(`Payment history insert failed: ${paymentError.message}`);
        }

        console.log("サブスクリプション作成完了:", subscription.id);
        break;
      }

      case "invoice.payment_succeeded": {
        console.log("Processing invoice.payment_succeeded");
        const invoice = event.data.object as Stripe.Invoice;
        
        if (!invoice.subscription) {
          console.log("Invoice not related to subscription, skipping");
          break;
        }

          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
          
        const { error: updateError } = await supabase.from("subscriptions")
            .update({
              status: "active",
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);

        if (updateError) {
          console.error("Subscription update error:", updateError);
          throw new Error(`Subscription update failed: ${updateError.message}`);
        }

        // user_id を取得
        const userIdFromSubscription = subscription.metadata?.user_id;
        const userIdFromSession = session?.metadata?.user_id;
        const userId = userIdFromSubscription || userIdFromSession;

        const { error: paymentError } = await supabase.from("payment_history").insert({
          user_id: userId,
          stripe_payment_intent_id: invoice.payment_intent as string,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: "succeeded",
        });

        if (paymentError) {
          console.error("Payment history insert error:", paymentError);
          throw new Error(`Payment history insert failed: ${paymentError.message}`);
        }

        console.log("継続支払い処理完了:", subscription.id);
        break;
      }

      case "customer.subscription.deleted": {
        console.log("Processing customer.subscription.deleted");
        const subscription = event.data.object as Stripe.Subscription;
        
        const { data: updatedSubscriptionData, error: updateError } = await supabase.from("subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id)
          .select("user_id")
          .single();

        if (updateError) {
          console.error("Subscription cancellation update error:", updateError);
          throw new Error(`Subscription cancellation failed: ${updateError.message}`);
        }
        
        if (updatedSubscriptionData?.user_id) {
          const { error: classroomError } = await supabase.from("classrooms")
            .update({ published: false, updated_at: new Date().toISOString() })
            .eq("user_id", updatedSubscriptionData.user_id);

          if (classroomError) {
            console.error("Classroom unpublish error:", classroomError);
          }
        }

        console.log("サブスクリプション削除処理完了:", subscription.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // ★ 修正6: 正しいカラム名でイベント記録
    const { error: insertEventError } = await supabase
      .from("processed_stripe_events")
      .insert({ 
        stripe_event_id: event.id,
        event_type: event.type
      });

    if (insertEventError) {
      console.error("Failed to record processed event:", insertEventError);
      throw new Error(`Failed to record event: ${insertEventError.message}`);
    }

    console.log(`Event ${event.id} processed successfully`);
    return new Response(JSON.stringify({ received: true, processed: true }), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Webhook処理エラー:", error.message);
    console.error("Error stack:", error.stack);
    return new Response(`Webhook handler error: ${error.message}`, { status: 500 });
  }
});
