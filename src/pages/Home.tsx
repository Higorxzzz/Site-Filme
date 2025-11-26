import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { HeroCarousel } from "@/components/HeroCarousel";
import { CategoryRow } from "@/components/CategoryRow";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface MediaItem {
  id: string;
  title: string;
  poster_url: string | null;
  cover: string;
  type: 'movie' | 'series';
  synopsis: string | null;
  year?: number;
  rating?: number;
  genres?: string[];
}

interface GenreCategory {
  title: string;
  genreId: number;
  items: MediaItem[];
}

const GENRE_CATEGORIES = [
  { title: "Ação", genreId: 28 },
  { title: "Aventura", genreId: 12 },
  { title: "Comédia", genreId: 35 },
  { title: "Terror", genreId: 27 },
  { title: "Drama", genreId: 18 },
  { title: "Ficção Científica", genreId: 878 },
  { title: "Romance", genreId: 10749 },
  { title: "Animação", genreId: 16 },
  { title: "Documentário", genreId: 99 },
];

// Função para embaralhar arrays
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const Home = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [series, setSeries] = useState<MediaItem[]>([]);
  const [genreCategories, setGenreCategories] = useState<GenreCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublishedItems();
    fetchGenreCategories();
  }, []);

  const fetchPublishedItems = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('media_items')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Map poster_url to cover and add default values
        const mappedData = data.map((item: any) => ({
          ...item,
          cover: item.poster_url || '/placeholder.svg',
          year: new Date().getFullYear(), // Default to current year
          rating: 0 // Default rating
        }));

        const moviesList = mappedData.filter((item: any) => item.type === 'movie');
        const seriesList = mappedData.filter((item: any) => item.type === 'series');
        
        setMovies(moviesList);
        setSeries(seriesList);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGenreCategories = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      const categoriesData = await Promise.all(
        GENRE_CATEGORIES.map(async (category) => {
          try {
            const response = await fetch(
              `${supabaseUrl}/functions/v1/genre-movies?genreId=${category.genreId}`
            );
            
            if (!response.ok) {
              console.error(`Failed to fetch ${category.title}:`, response.status);
              return {
                title: category.title,
                genreId: category.genreId,
                items: [],
              };
            }
            
            const data = await response.json();
            const items: MediaItem[] = data.movies || [];

            return {
              title: category.title,
              genreId: category.genreId,
              items: shuffleArray(items), // Embaralha os filmes dentro da categoria
            };
          } catch (error) {
            console.error(`Error fetching ${category.title}:`, error);
            return {
              title: category.title,
              genreId: category.genreId,
              items: [],
            };
          }
        })
      );

      // Embaralha a ordem das categorias
      setGenreCategories(shuffleArray(categoriesData));
    } catch (error) {
      console.error('Error fetching genre categories:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-14 sm:pt-16">
        <HeroCarousel />

        <div className="space-y-4 sm:space-y-6 lg:space-y-8 py-4 sm:py-6 lg:py-8">
          {movies.length > 0 && (
            <CategoryRow
              title="Filmes"
              items={movies as any}
              type="movie"
              onSeeMore={() => navigate('/movies')}
            />
          )}
          
          {series.length > 0 && (
            <CategoryRow
              title="Séries"
              items={series as any}
              type="series"
              onSeeMore={() => navigate('/series')}
            />
          )}

          {genreCategories.map((category) => (
            category.items.length > 0 && (
              <CategoryRow
                key={category.genreId}
                title={category.title}
                items={category.items as any}
                type="movie"
                onSeeMore={() => navigate(`/movies?genre=${category.genreId}`)}
              />
            )
          ))}

          {movies.length === 0 && series.length === 0 && genreCategories.length === 0 && (
            <div className="container mx-auto px-3 sm:px-4 text-center py-12 sm:py-16 lg:py-20">
              <p className="text-muted-foreground text-base sm:text-lg">
                Nenhum conteúdo publicado ainda.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;
