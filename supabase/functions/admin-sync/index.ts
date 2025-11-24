import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

    // Get all unpublished items or items that haven't been checked recently
    const { data: items, error: fetchError } = await supabase
      .from('media_items')
      .select('*')
      .or('published.eq.false,last_check_date.is.null')
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    const results = {
      checked: 0,
      published: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[]
    };

    for (const item of items || []) {
      try {
        // Rate limiting - wait 500ms between requests
        await delay(500);

        let primeVicioUrl: string;
        if (item.type === 'movie') {
          primeVicioUrl = `https://primevicio.lat/api/stream/movies/${item.tmdb_id}`;
        } else {
          primeVicioUrl = `https://primevicio.lat/api/stream/series/${item.tmdb_id}/1/1`;
        }

        let checkStatus: string;
        let checkMessage: string;
        let embedUrl: string | null = null;

        try {
          const primeVicioResponse = await fetch(primeVicioUrl);
          results.checked++;

          if (primeVicioResponse.ok) {
            checkStatus = 'ok';
            checkMessage = 'Available on PrimeVicio';
            embedUrl = primeVicioUrl;

            // Auto-publish if check is successful
            await supabase
              .from('media_items')
              .update({
                published: true,
                last_check_status: checkStatus,
                last_check_message: checkMessage,
                last_check_date: new Date().toISOString(),
                embed_url: embedUrl
              })
              .eq('id', item.id);

            results.published++;

            results.details.push({
              id: item.id,
              title: item.title,
              status: 'published',
              message: 'Successfully checked and published'
            });

            // Log action
            await supabase.rpc('log_admin_action', {
              p_action: 'sync_publish',
              p_item_id: item.id,
              p_status: 'success',
              p_message: `Auto-published: ${item.title}`
            });

          } else if (primeVicioResponse.status === 404) {
            checkStatus = 'not_found';
            checkMessage = 'Not found on PrimeVicio';
            results.failed++;

            await supabase
              .from('media_items')
              .update({
                last_check_status: checkStatus,
                last_check_message: checkMessage,
                last_check_date: new Date().toISOString()
              })
              .eq('id', item.id);

            results.details.push({
              id: item.id,
              title: item.title,
              status: 'not_found',
              message: 'Not available on PrimeVicio'
            });

          } else {
            checkStatus = 'error';
            checkMessage = `PrimeVicio returned status ${primeVicioResponse.status}`;
            results.failed++;

            await supabase
              .from('media_items')
              .update({
                last_check_status: checkStatus,
                last_check_message: checkMessage,
                last_check_date: new Date().toISOString()
              })
              .eq('id', item.id);

            results.details.push({
              id: item.id,
              title: item.title,
              status: 'error',
              message: checkMessage
            });
          }
        } catch (error) {
          results.failed++;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          results.details.push({
            id: item.id,
            title: item.title,
            status: 'error',
            message: errorMsg
          });
        }

      } catch (error) {
        console.error(`Error processing item ${item.id}:`, error);
        results.failed++;
      }
    }

    // Log sync action
    await supabase.rpc('log_admin_action', {
      p_action: 'sync_batch',
      p_item_id: null,
      p_status: 'success',
      p_message: `Checked: ${results.checked}, Published: ${results.published}, Failed: ${results.failed}`
    });

    return new Response(JSON.stringify(results), {
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
