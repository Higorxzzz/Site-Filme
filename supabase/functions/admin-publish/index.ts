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

    const { itemId, published } = await req.json();

    if (!itemId) {
      return new Response(JSON.stringify({ error: 'itemId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get item to check status
    const { data: item, error: fetchError } = await supabase
      .from('media_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (fetchError) throw fetchError;

    // Only allow publish if check status is 'ok'
    if (published && item.last_check_status !== 'ok') {
      return new Response(JSON.stringify({ 
        error: 'Cannot publish: Item must have successful PrimeVicio check first' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update publish status
    const { data: updatedItem, error: updateError } = await supabase
      .from('media_items')
      .update({ published })
      .eq('id', itemId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log action
    await supabase.rpc('log_admin_action', {
      p_action: published ? 'publish' : 'unpublish',
      p_item_id: itemId,
      p_status: 'success',
      p_message: `${published ? 'Published' : 'Unpublished'}: ${item.title}`
    });

    return new Response(JSON.stringify(updatedItem), {
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
