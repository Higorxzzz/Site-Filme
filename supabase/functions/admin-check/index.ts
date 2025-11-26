import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { itemId } = await req.json();

    if (!itemId) {
      return new Response(JSON.stringify({ error: 'itemId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get item from database
    const { data: item, error: fetchError } = await supabase
      .from('media_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (fetchError) throw fetchError;

    // Check cache first (but skip if previous check was not_found to allow retry)
    const cacheKey = `primevicio_${item.type}_${item.tmdb_id}`;
    const { data: cachedData } = await supabase
      .from('api_cache')
      .select('data, expires_at')
      .eq('cache_key', cacheKey)
      .single();

    // Only use cache if it's valid AND the status was 'ok'
    if (cachedData && new Date(cachedData.expires_at) > new Date()) {
      const cacheStatus = cachedData.data?.status;
      if (cacheStatus === 'ok') {
        console.log(`Using valid cache for ${item.type} ${item.tmdb_id}`);
        return new Response(JSON.stringify(cachedData.data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        console.log(`Skipping cache with status '${cacheStatus}' - will recheck`);
      }
    }

    // Check PrimeVicio
    let primeVicioUrl: string;
    let embedUrl: string;
    
    if (item.type === 'movie') {
      primeVicioUrl = `https://primevicio.lat/api/stream/movies/${item.tmdb_id}`;
      embedUrl = `https://primevicio.lat/embed/movie/${item.tmdb_id}`;
    } else {
      // For series, check first episode of first season
      primeVicioUrl = `https://primevicio.lat/api/stream/series/${item.tmdb_id}/1/1`;
      embedUrl = `https://primevicio.lat/embed/tv/${item.tmdb_id}/1/1`;
    }

    let checkStatus: string;
    let checkMessage: string;
    let finalEmbedUrl: string | null = null;

    try {
      const primeVicioResponse = await fetch(primeVicioUrl);
      
      if (primeVicioResponse.ok) {
        // If response is OK (200-299), consider the content available
        checkStatus = 'ok';
        checkMessage = 'Disponível no PrimeVicio';
        finalEmbedUrl = embedUrl;
        
        console.log(`Check successful for ${item.type} ${item.tmdb_id}`);
      } else if (primeVicioResponse.status === 404) {
        checkStatus = 'not_found';
        checkMessage = 'Conteúdo não encontrado no PrimeVicio';
      } else {
        checkStatus = 'error';
        checkMessage = `PrimeVicio retornou status ${primeVicioResponse.status}`;
      }
    } catch (error) {
      checkStatus = 'error';
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      checkMessage = `Erro ao verificar PrimeVicio: ${errorMsg}`;
      console.error('Check error:', errorMsg);
    }

    // Update item in database
    const { error: updateError } = await supabase
      .from('media_items')
      .update({
        last_check_status: checkStatus,
        last_check_message: checkMessage,
        last_check_date: new Date().toISOString(),
        embed_url: finalEmbedUrl
      })
      .eq('id', itemId);

    if (updateError) throw updateError;

    // Cache the result
    const resultData = {
      status: checkStatus,
      message: checkMessage,
      embedUrl: finalEmbedUrl,
      httpStatus: checkStatus === 'ok' ? 200 : (checkStatus === 'not_found' ? 404 : 500)
    };

    await supabase
      .from('api_cache')
      .upsert({
        cache_key: cacheKey,
        data: resultData,
        expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6 hours
      });

    // Log action
    await supabase.rpc('log_admin_action', {
      p_action: 'check',
      p_item_id: itemId,
      p_status: checkStatus,
      p_message: checkMessage
    });

    return new Response(JSON.stringify(resultData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
