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

    // Check if test payment is enabled
    const { data: settings, error: settingsError } = await supabase
      .from('vip_settings')
      .select('test_payment_enabled, vip_duration_days')
      .single();

    if (settingsError) {
      console.error('Error fetching VIP settings:', settingsError);
      throw new Error('Error fetching VIP settings');
    }

    if (!settings.test_payment_enabled) {
      return new Response(
        JSON.stringify({ error: 'Payment system not available' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Activate VIP using configured duration
    const vipDurationDays = settings.vip_duration_days || 30;
    const vipExpiresAt = new Date();
    vipExpiresAt.setDate(vipExpiresAt.getDate() + vipDurationDays);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        is_vip: true,
        vip_expires_at: vipExpiresAt.toISOString(),
        vip_created_at: new Date().toISOString(),
        vip_updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      throw new Error('Error activating VIP');
    }

    // Log the action
    await supabase
      .from('vip_logs')
      .insert({
        user_id: user.id,
        action: 'activate_vip',
        details: {
          method: 'test_payment',
          expires_at: vipExpiresAt.toISOString()
        }
      });

    // Registrar comissão para afiliado (VIP)
    try {
      const { data: vipSettings } = await supabase
        .from('vip_settings')
        .select('vip_price')
        .maybeSingle();

      const { data: affiliateSettings } = await supabase
        .from('affiliate_settings')
        .select('vip_commission_percentage')
        .maybeSingle();

      if (vipSettings && affiliateSettings) {
        const commissionAmount = (vipSettings.vip_price * affiliateSettings.vip_commission_percentage) / 100;
        
        await supabase.functions.invoke('affiliate-track', {
          body: {
            action: 'conversion',
            userId: user.id,
            conversionType: 'vip_subscription',
            amount: commissionAmount
          }
        });
      }
    } catch (error) {
      console.error('❌ Erro ao registrar comissão VIP:', error);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        vip_expires_at: vipExpiresAt.toISOString() 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in vip-activate:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});