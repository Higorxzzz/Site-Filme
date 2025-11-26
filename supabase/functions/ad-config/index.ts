import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('ad-config function called:', req.method);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Supabase client created');

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.log('No auth header');
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    console.log('User:', user?.id, 'Auth error:', authError);

    if (authError || !user) {
      console.log('Auth failed');
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse body for POST requests
    let body = null;
    let action = 'get';
    
    try {
      if (req.method === 'POST') {
        body = await req.json();
        action = body?.action || 'get';
        console.log('POST request - Body:', body);
        console.log('Action determined:', action);
      } else {
        console.log('GET request - using default action: get');
      }
    } catch (e) {
      console.error('Error parsing body:', e);
      action = 'get';
    }

    console.log('Final action:', action);

    if (action === 'get') {
      console.log('Executing GET action');
      // Buscar configurações
      const { data, error } = await supabase
        .from('ad_settings')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching ad settings:', error);
        return new Response(
          JSON.stringify({ error: 'Erro ao buscar configurações' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Settings fetched successfully');
      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update') {
      console.log('Executing UPDATE action');
      
      // Verificar se é admin
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      console.log('Roles check:', roles, 'Error:', rolesError);

      if (!roles) {
        console.log('User is not admin');
        return new Response(
          JSON.stringify({ error: 'Apenas administradores podem alterar as configurações' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Body received:', body);
      
      const { interval_minutes, ads_required_for_free_time, free_time_hours, redirect_url } = body;

      // Validar dados
      if (interval_minutes < 1 || ads_required_for_free_time < 1 || free_time_hours < 1) {
        return new Response(
          JSON.stringify({ error: 'Todos os valores devem ser maiores que zero' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!redirect_url || !redirect_url.startsWith('http')) {
        return new Response(
          JSON.stringify({ error: 'URL de redirecionamento inválida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Buscar o registro existente
      const { data: existingSettings } = await supabase
        .from('ad_settings')
        .select('id')
        .single();

      if (!existingSettings) {
        return new Response(
          JSON.stringify({ error: 'Configurações não encontradas' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Atualizar configurações
      const { data, error } = await supabase
        .from('ad_settings')
        .update({
          interval_minutes,
          ads_required_for_free_time,
          free_time_hours,
          redirect_url,
        })
        .eq('id', existingSettings.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating ad settings:', error);
        return new Response(
          JSON.stringify({ error: 'Erro ao atualizar configurações' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Se chegou aqui, ação desconhecida
    console.error('Unknown action:', action);
    return new Response(
      JSON.stringify({ error: `Ação desconhecida: ${action}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
