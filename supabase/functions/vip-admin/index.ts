import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      throw new Error('Forbidden: Admin access required');
    }

    const { action, userId, testPaymentEnabled, vipDurationDays, vipPrice } = await req.json();

    // Handle different admin actions
    if (action === 'toggle_test_payment') {
      const { error: updateError } = await supabase
        .from('vip_settings')
        .update({ test_payment_enabled: testPaymentEnabled })
        .eq('id', (await supabase.from('vip_settings').select('id').single()).data?.id);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update_vip_duration') {
      if (!vipDurationDays || vipDurationDays < 1) {
        throw new Error('Invalid VIP duration');
      }

      const { error: updateError } = await supabase
        .from('vip_settings')
        .update({ vip_duration_days: vipDurationDays })
        .eq('id', (await supabase.from('vip_settings').select('id').single()).data?.id);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update_vip_price') {
      if (!vipPrice || vipPrice < 0.01) {
        throw new Error('Invalid VIP price');
      }

      const { error: updateError } = await supabase
        .from('vip_settings')
        .update({ vip_price: vipPrice })
        .eq('id', (await supabase.from('vip_settings').select('id').single()).data?.id);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'remove_vip') {
      if (!userId) throw new Error('User ID is required');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          is_vip: false,
          vip_expires_at: null
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Log the action
      await supabase
        .from('vip_logs')
        .insert({
          user_id: userId,
          action: 'remove_vip_by_admin',
          details: { admin_id: user.id }
        });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'list_vip_users') {
      const { data: vipUsers, error: listError } = await supabase
        .from('profiles')
        .select('id, email, is_vip, vip_expires_at, vip_created_at')
        .eq('is_vip', true)
        .order('vip_created_at', { ascending: false });

      if (listError) throw listError;

      return new Response(
        JSON.stringify({ users: vipUsers }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in vip-admin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});