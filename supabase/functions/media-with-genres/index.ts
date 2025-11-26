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
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'movie';

    const tmdbApiKey = Deno.env.get('TMDB_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!tmdbApiKey || !supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch published media items
    const { data: mediaItems, error: dbError } = await supabase
      .from('media_items')
      .select('*')
      .eq('published', true)
      .eq('type', type)
      .order('created_at', { ascending: false });

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    if (!mediaItems || mediaItems.length === 0) {
      return new Response(
        JSON.stringify({ items: [], genres: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch genre information from TMDB for each item
    const itemsWithGenres = await Promise.all(
      mediaItems.map(async (item: any) => {
        try {
          const tmdbUrl = item.type === 'movie'
            ? `https://api.themoviedb.org/3/movie/${item.tmdb_id}?api_key=${tmdbApiKey}&language=pt-BR`
            : `https://api.themoviedb.org/3/tv/${item.tmdb_id}?api_key=${tmdbApiKey}&language=pt-BR`;

          const response = await fetch(tmdbUrl);
          if (!response.ok) return { ...item, genres: [] };

          const tmdbData = await response.json();
          const genres = tmdbData.genres?.map((g: any) => g.id) || [];

          return {
            id: item.id,
            title: item.title,
            poster_url: item.poster_url,
            cover: item.poster_url || '/placeholder.svg',
            type: item.type,
            synopsis: item.synopsis,
            tmdb_id: item.tmdb_id,
            year: new Date().getFullYear(),
            rating: 0,
            genres,
          };
        } catch (error) {
          console.error(`Error fetching TMDB data for item ${item.id}:`, error);
          return { ...item, genres: [], cover: item.poster_url || '/placeholder.svg' };
        }
      })
    );

    // Extract unique genres
    const genreMap = new Map<number, string>();
    const allGenres = [
      { id: 28, name: "Ação" },
      { id: 12, name: "Aventura" },
      { id: 35, name: "Comédia" },
      { id: 27, name: "Terror" },
      { id: 18, name: "Drama" },
      { id: 878, name: "Ficção Científica" },
      { id: 10749, name: "Romance" },
      { id: 16, name: "Animação" },
      { id: 99, name: "Documentário" },
    ];

    itemsWithGenres.forEach((item) => {
      item.genres?.forEach((genreId: number) => {
        const genreInfo = allGenres.find((g) => g.id === genreId);
        if (genreInfo) {
          genreMap.set(genreInfo.id, genreInfo.name);
        }
      });
    });

    const genres = Array.from(genreMap.entries()).map(([id, name]) => ({ id, name }));

    return new Response(
      JSON.stringify({ items: itemsWithGenres, genres }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
