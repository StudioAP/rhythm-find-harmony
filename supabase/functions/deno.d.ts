// Deno型定義 - Edge Functions用
declare namespace Deno {
  export namespace env {
    export function get(key: string): string | undefined;
  }
}

// Denoモジュール型定義
declare module "https://deno.land/std@0.190.0/http/server.ts" {
  export function serve(handler: (request: Request) => Response | Promise<Response>): void;
}

declare module "https://esm.sh/stripe@14.21.0" {
  import Stripe from "stripe";
  export default Stripe;
}

declare module "https://esm.sh/@supabase/supabase-js@2.45.0" {
  export { createClient } from "@supabase/supabase-js";
} 