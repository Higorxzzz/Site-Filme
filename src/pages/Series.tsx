import { Header } from "@/components/Header";
import { MediaCard } from "@/components/MediaCard";
import { GenreFilter } from "@/components/GenreFilter";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface Series {
  id: string;
  title: string;
  poster_url: string | null;
  cover: string;
  type: 'series';
  synopsis: string | null;
  year?: number;
  rating?: number;
  tmdb_id: number;
  genres?: number[];
}

const Series = () => {
  const [searchParams] = useSearchParams();
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [displayedSeries, setDisplayedSeries] = useState(20);
  const [availableGenres, setAvailableGenres] = useState<{ id: number; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchSeries();
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

  const fetchSeries = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/media-with-genres?type=series`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch series');
      }

      const data = await response.json();
      setSeries(data.items || []);
      setAvailableGenres(data.genres || []);
    } catch (error) {
      console.error('Error fetching series:', error);
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
    setSeries((prev) => [...prev].sort(() => Math.random() - 0.5));
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredSeries =
    selectedGenres.length > 0
      ? series.filter((show) => show.genres?.some((g) => selectedGenres.includes(g)))
      : series;

  const searchFilteredSeries = searchQuery.trim()
    ? filteredSeries.filter((show) =>
        show.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredSeries;

  const visibleSeries = searchFilteredSeries.slice(0, displayedSeries);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 500
      ) {
        setDisplayedSeries((prev) => Math.min(prev + 20, searchFilteredSeries.length));
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [searchFilteredSeries.length]);

  useEffect(() => {
    setDisplayedSeries(20);
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
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 sm:mb-8 text-center sm:text-left">Séries</h1>

          {series.length > 0 ? (
            <>
              <GenreFilter
                availableGenres={availableGenres}
                selectedGenres={selectedGenres}
                onGenreToggle={handleGenreToggle}
                onClearFilters={handleClearFilters}
                onShuffle={handleShuffle}
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
                {visibleSeries.map((show) => (
                  <MediaCard
                    key={show.id}
                    id={show.id}
                    title={show.title}
                    cover={show.cover}
                    rating={show.rating}
                    year={show.year}
                    type="series"
                  />
                ))}
              </div>

              {displayedSeries < searchFilteredSeries.length && (
                <div className="text-center mt-6 sm:mt-8">
                  <p className="text-sm sm:text-base text-muted-foreground">Carregando mais séries...</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 sm:py-20">
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
                {searchQuery ? 'Nenhuma série encontrada com esse termo de busca.' : 'Nenhuma série publicada ainda.'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Series;
