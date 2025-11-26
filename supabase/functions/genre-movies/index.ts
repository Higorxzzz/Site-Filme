import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

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
    const genreId = url.searchParams.get('genreId');
    
    if (!genreId) {
      return new Response(
        JSON.stringify({ error: 'Genre ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tmdbApiKey = Deno.env.get('TMDB_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!tmdbApiKey || !supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all published media items from database
    const { data: mediaItems, error: dbError } = await supabase
      .from('media_items')
      .select('*')
      .eq('published', true);

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    if (!mediaItems || mediaItems.length === 0) {
      return new Response(
        JSON.stringify({ movies: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch genre information from TMDB for each item
    const moviesWithGenres = await Promise.all(
      mediaItems.map(async (item: any) => {
        try {
          const tmdbUrl = item.type === 'movie'
            ? `https://api.themoviedb.org/3/movie/${item.tmdb_id}?api_key=${tmdbApiKey}&language=pt-BR`
            : `https://api.themoviedb.org/3/tv/${item.tmdb_id}?api_key=${tmdbApiKey}&language=pt-BR`;

          const response = await fetch(tmdbUrl);
          if (!response.ok) return null;

          const tmdbData = await response.json();
          const genres = tmdbData.genres?.map((g: any) => g.id) || [];

          // Check if item has the requested genre
          if (!genres.includes(parseInt(genreId))) return null;

          return {
            id: item.id,
            title: item.title,
            poster_url: item.poster_url,
            cover: item.poster_url || '/placeholder.svg',
            type: item.type,
            synopsis: item.synopsis,
            year: new Date().getFullYear(),
            rating: 0,
          };
        } catch (error) {
          console.error(`Error fetching TMDB data for item ${item.id}:`, error);
          return null;
        }
      })
    );

    // Filter out null values and limit to 20 items
    const filteredMovies = moviesWithGenres
      .filter((item) => item !== null)
      .slice(0, 20);

    return new Response(
      JSON.stringify({ movies: filteredMovies }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in genre-movies function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
