import { Header } from "@/components/Header";
import { MediaCard } from "@/components/MediaCard";
import { GenreFilter } from "@/components/GenreFilter";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface Movie {
  id: string;
  title: string;
  poster_url: string | null;
  cover: string;
  type: 'movie';
  synopsis: string | null;
  year?: number;
  rating?: number;
  tmdb_id: number;
  genres?: number[];
}

const Movies = () => {
  const [searchParams] = useSearchParams();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [displayedMovies, setDisplayedMovies] = useState(20);
  const [availableGenres, setAvailableGenres] = useState<{ id: number; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchMovies();
  }, []);

  useEffect(() => {
    const genreParam = searchParams.get('genre');
    if (genreParam) {
      const genreId = parseInt(genreParam);
      if (!isNaN(genreId) && !selectedGenres.includes(genreId)) {
        setSelectedGenres([genreId]);
      }
    }
  }, [searchParams]);

  const fetchMovies = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/media-with-genres?type=movie`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch movies');
      }

      const data = await response.json();
      setMovies(data.items || []);
      setAvailableGenres(data.genres || []);
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenreToggle = (genreId: number) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId) ? prev.filter((id) => id !== genreId) : [...prev, genreId]
    );
  };

  const handleClearFilters = () => {
    setSelectedGenres([]);
  };

  const handleShuffle = () => {
    setMovies((prev) => [...prev].sort(() => Math.random() - 0.5));
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredMovies =
    selectedGenres.length > 0
      ? movies.filter((movie) => movie.genres?.some((g) => selectedGenres.includes(g)))
      : movies;

  const searchFilteredMovies = searchQuery.trim()
    ? filteredMovies.filter((movie) =>
        movie.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredMovies;

  const visibleMovies = searchFilteredMovies.slice(0, displayedMovies);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 500
      ) {
        setDisplayedMovies((prev) => Math.min(prev + 20, searchFilteredMovies.length));
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [searchFilteredMovies.length]);

  useEffect(() => {
    setDisplayedMovies(20);
  }, [selectedGenres]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={handleSearch} />

      <main className="pt-20 sm:pt-24 pb-6 sm:pb-12">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 text-center sm:text-left">Filmes</h1>

          {movies.length > 0 ? (
            <>
              <GenreFilter
                availableGenres={availableGenres}
                selectedGenres={selectedGenres}
                onGenreToggle={handleGenreToggle}
                onClearFilters={handleClearFilters}
                onShuffle={handleShuffle}
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
                {visibleMovies.map((movie) => (
                  <MediaCard
                    key={movie.id}
                    id={movie.id}
                    title={movie.title}
                    cover={movie.cover}
                    rating={movie.rating}
                    year={movie.year}
                    type="movie"
                  />
                ))}
              </div>

              {displayedMovies < searchFilteredMovies.length && (
                <div className="text-center mt-6 sm:mt-8">
                  <p className="text-sm sm:text-base text-muted-foreground">Carregando mais filmes...</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 sm:py-20">
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
                {searchQuery ? 'Nenhum filme encontrado com esse termo de busca.' : 'Nenhum filme publicado ainda.'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Movies;
