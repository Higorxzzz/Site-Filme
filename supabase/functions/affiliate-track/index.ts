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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, affiliateCode, userId, conversionType, amount } = await req.json();

    console.log('📊 Affiliate track action:', action, { affiliateCode, userId, conversionType, amount });

    // Registrar clique
    if (action === 'click') {
      const { error } = await supabase
        .from('affiliate_clicks')
        .insert({
          affiliate_code: affiliateCode,
          ip_address: req.headers.get('x-forwarded-for') || 'unknown',
          user_agent: req.headers.get('user-agent') || 'unknown'
        });

      if (error) {
        console.error('❌ Erro ao registrar clique:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log('✅ Clique registrado com sucesso');
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Registrar cadastro e adicionar referred_by
    if (action === 'signup') {
      // Verificar se o código existe
      const { data: affiliate, error: affiliateError } = await supabase
        .from('profiles')
        .select('id, affiliate_code')
        .eq('affiliate_code', affiliateCode)
        .eq('is_affiliate', true)
        .maybeSingle();

      if (affiliateError || !affiliate) {
        console.error('❌ Código de afiliado inválido:', affiliateCode);
        return new Response(JSON.stringify({ error: 'Código de afiliado inválido' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Atualizar o perfil do novo usuário com referred_by
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ referred_by: affiliateCode })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Erro ao atualizar referred_by:', updateError);
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Registrar na tabela de referências
      const { error: referralError } = await supabase
        .from('affiliate_referrals')
        .insert({
          affiliate_id: affiliate.id,
          referred_user_id: userId
        });

      if (referralError) {
        console.error('❌ Erro ao registrar referência:', referralError);
        return new Response(JSON.stringify({ error: referralError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log('✅ Cadastro registrado com sucesso para afiliado:', affiliate.id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Registrar conversão (anúncios ou VIP)
    if (action === 'conversion') {
      // Buscar o afiliado que indicou o usuário
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('referred_by')
        .eq('id', userId)
        .maybeSingle();

      if (!userProfile?.referred_by) {
        console.log('ℹ️ Usuário não foi indicado por nenhum afiliado');
        return new Response(JSON.stringify({ success: true, message: 'Sem afiliado' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Buscar o ID do afiliado
      const { data: affiliate } = await supabase
        .from('profiles')
        .select('id, affiliate_balance')
        .eq('affiliate_code', userProfile.referred_by)
        .maybeSingle();

      if (!affiliate) {
        console.error('❌ Afiliado não encontrado');
        return new Response(JSON.stringify({ error: 'Afiliado não encontrado' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Registrar conversão
      const { error: conversionError } = await supabase
        .from('affiliate_conversions')
        .insert({
          affiliate_id: affiliate.id,
          user_id: userId,
          conversion_type: conversionType,
          amount: amount
        });

      if (conversionError) {
        console.error('❌ Erro ao registrar conversão:', conversionError);
        return new Response(JSON.stringify({ error: conversionError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Atualizar saldo do afiliado
      const newBalance = (affiliate.affiliate_balance || 0) + amount;
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ affiliate_balance: newBalance })
        .eq('id', affiliate.id);

      if (balanceError) {
        console.error('❌ Erro ao atualizar saldo:', balanceError);
        return new Response(JSON.stringify({ error: balanceError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log('✅ Conversão registrada:', { conversionType, amount, newBalance });
      return new Response(JSON.stringify({ success: true, newBalance }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Erro no affiliate-track:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});