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

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    // Extract itemId from URL path
    // Expected paths: /admin-items or /admin-items/{itemId}
    const itemId = pathParts[pathParts.length - 1] !== 'admin-items' 
      ? pathParts[pathParts.length - 1] 
      : null;

    // GET - List items with pagination
    if (req.method === 'GET' && !itemId) {
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = 20;
      const offset = (page - 1) * limit;

      const { data: items, error, count } = await supabase
        .from('media_items')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return new Response(JSON.stringify({ 
        items, 
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST - Create new item from TMDB ID
    if (req.method === 'POST') {
      const { tmdb_id, type } = await req.json();

      if (!tmdb_id || !type) {
        return new Response(JSON.stringify({ error: 'tmdb_id and type are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch metadata from TMDB
      const tmdbApiKey = Deno.env.get('TMDB_API_KEY');
      const tmdbUrl = type === 'movie' 
        ? `https://api.themoviedb.org/3/movie/${tmdb_id}?api_key=${tmdbApiKey}&language=pt-BR`
        : `https://api.themoviedb.org/3/tv/${tmdb_id}?api_key=${tmdbApiKey}&language=pt-BR`;

      const tmdbResponse = await fetch(tmdbUrl);
      if (!tmdbResponse.ok) {
        return new Response(JSON.stringify({ error: 'Failed to fetch from TMDB' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const tmdbData = await tmdbResponse.json();

      const itemData = {
        tmdb_id: parseInt(tmdb_id),
        type,
        title: tmdbData.title || tmdbData.name,
        poster_url: tmdbData.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}` : null,
        synopsis: tmdbData.overview,
        seasons: type === 'series' ? tmdbData.number_of_seasons : 1,
        published: false,
        last_check_status: 'pending'
      };

      const { data: item, error } = await supabase
        .from('media_items')
        .insert(itemData)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique violation
          return new Response(JSON.stringify({ error: 'Item already exists' }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        throw error;
      }

      // Log action
      await supabase.rpc('log_admin_action', {
        p_action: 'create',
        p_item_id: item.id,
        p_status: 'success',
        p_message: `Created ${type}: ${item.title}`
      });

      return new Response(JSON.stringify(item), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // PUT - Update item
    if (req.method === 'PUT' && itemId) {
      const updates = await req.json();

      const { data: item, error } = await supabase
        .from('media_items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;

      // Log action
      await supabase.rpc('log_admin_action', {
        p_action: 'update',
        p_item_id: itemId,
        p_status: 'success',
        p_message: `Updated item: ${item.title}`
      });

      return new Response(JSON.stringify(item), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE - Remove item
    if (req.method === 'DELETE' && itemId) {
      const { error } = await supabase
        .from('media_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      // Log action
      await supabase.rpc('log_admin_action', {
        p_action: 'delete',
        p_item_id: itemId,
        p_status: 'success',
        p_message: 'Deleted item'
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
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
