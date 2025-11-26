import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Play, Info } from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface FeaturedMovie {
  id: string;
  title: string;
  synopsis: string | null;
  poster_url: string | null;
  cover: string;
  rating: number;
  year: number;
  duration: string;
  genre: string[];
}

// Função para embaralhar arrays
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const HeroCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [featuredMovies, setFeaturedMovies] = useState<FeaturedMovie[]>([]);

  useEffect(() => {
    fetchFeaturedMovies();
  }, []);

  useEffect(() => {
    if (featuredMovies.length === 0) return;

    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
        setIsTransitioning(false);
      }, 500);
    }, 6000);

    return () => clearInterval(timer);
  }, [featuredMovies.length]);

  const fetchFeaturedMovies = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('media_items')
        .select('*')
        .eq('published', true)
        .eq('type', 'movie');

      if (error) throw error;

      if (data && data.length > 0) {
        const mappedMovies: FeaturedMovie[] = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          synopsis: item.synopsis || 'Sem descrição disponível.',
          poster_url: item.poster_url,
          cover: item.poster_url || '/placeholder.svg',
          rating: 0,
          year: new Date().getFullYear(),
          duration: '120 min',
          genre: ['Drama', 'Ação']
        }));

        // Embaralha e pega até 5 filmes
        const shuffled = shuffleArray(mappedMovies);
        setFeaturedMovies(shuffled.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching featured movies:', error);
    }
  };

  const goToPrevious = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + featuredMovies.length) % featuredMovies.length);
      setIsTransitioning(false);
    }, 500);
  };

  const goToNext = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
      setIsTransitioning(false);
    }, 500);
  };

  const current = featuredMovies[currentIndex];

  if (featuredMovies.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full overflow-hidden bg-background py-6 md:py-8 lg:py-12">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col-reverse lg:grid lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-center max-w-7xl mx-auto">
          {/* Informações - embaixo em mobile, esquerda em desktop */}
          <div className={`space-y-3 md:space-y-4 lg:space-y-6 z-10 transition-all duration-1000 text-center lg:text-left ${
            isTransitioning ? "opacity-0 translate-y-4 lg:translate-y-0 lg:translate-x-[-50px]" : "opacity-100 translate-y-0 lg:translate-x-0"
          }`}>
            <h1 className="text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground leading-tight">
              {current.title}
            </h1>
            <p className="text-sm md:text-base lg:text-lg text-muted-foreground line-clamp-3 md:line-clamp-4 leading-relaxed">
              {current.synopsis}
            </p>
            
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 md:gap-3 text-xs md:text-sm">
              <span className="flex items-center gap-1.5 md:gap-2 px-2.5 py-1.5 md:px-4 md:py-2 bg-primary rounded-lg text-primary-foreground font-semibold shadow-lg">
                ★ {current.rating}
              </span>
              <span className="text-foreground font-medium">{current.year}</span>
              <span className="text-foreground">{current.duration}</span>
              <span className="text-muted-foreground hidden sm:inline">{current.genre.slice(0, 3).join(" • ")}</span>
            </div>

            <div className="flex justify-center lg:justify-start gap-2 md:gap-3 pt-2">
              <Button 
                size="lg" 
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xl text-sm md:text-base"
              >
                <Play className="h-4 w-4 md:h-5 md:w-5 fill-current" />
                <span className="hidden sm:inline">Assistir Agora</span>
                <span className="sm:hidden">Assistir</span>
              </Button>
              <Link to={`/movie/${current.id}`}>
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="gap-2 font-semibold shadow-xl text-sm md:text-base"
                >
                  <Info className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden sm:inline">Mais Informações</span>
                  <span className="sm:hidden">Info</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Capa do filme - acima em mobile, direita em desktop (formato 9:16) */}
          <div className="relative w-full max-w-[180px] sm:max-w-[240px] lg:max-w-[280px] mx-auto">
            <div className="relative w-full" style={{ aspectRatio: '9/16' }}>
              {featuredMovies.map((movie, index) => (
                <div
                  key={movie.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === currentIndex ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <img
                    src={movie.cover}
                    alt={movie.title}
                    className={`w-full h-full object-cover rounded-xl shadow-2xl transition-transform duration-[8000ms] ${
                      index === currentIndex && !isTransitioning ? "scale-105" : "scale-100"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between items-center px-2 md:px-4 z-20 pointer-events-none">
        <button
          onClick={goToPrevious}
          className="p-2 md:p-2.5 rounded-full bg-background/80 backdrop-blur-md hover:bg-background transition-all duration-300 hover:scale-110 border border-border pointer-events-auto"
        >
          <ChevronLeft className="h-4 w-4 md:h-6 md:w-6 text-foreground" />
        </button>

        <button
          onClick={goToNext}
          className="p-2 md:p-2.5 rounded-full bg-background/80 backdrop-blur-md hover:bg-background transition-all duration-300 hover:scale-110 border border-border pointer-events-auto"
        >
          <ChevronRight className="h-4 w-4 md:h-6 md:w-6 text-foreground" />
        </button>
      </div>

      {/* Indicadores */}
      <div className="absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {featuredMovies.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setIsTransitioning(true);
              setTimeout(() => {
                setCurrentIndex(index);
                setIsTransitioning(false);
              }, 500);
            }}
            className={`h-1 rounded-full transition-all duration-300 ${
              index === currentIndex ? "w-8 md:w-10 bg-primary shadow-lg shadow-primary/50" : "w-4 md:w-6 bg-muted hover:bg-muted-foreground/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
