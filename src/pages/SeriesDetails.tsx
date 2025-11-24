import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Heart, Play, Calendar, X } from "lucide-react";
import { useParams, Navigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdBlocker } from "@/hooks/useAdBlocker";
import { useAdPlayback } from "@/hooks/useAdPlayback";
import { useAdSystem } from "@/hooks/useAdSystem";
import { AdPopup } from "@/components/AdPopup";
import { IncompleteAdsPopup } from "@/components/IncompleteAdsPopup";

interface Series {
  id: string;
  title: string;
  poster_url: string | null;
  synopsis: string | null;
  embed_url: string | null;
  tmdb_id: number;
  seasons: number;
}

interface Episode {
  episode_number: number;
  name: string;
}

interface Season {
  season_number: number;
  episode_count: number;
  episodes: Episode[];
}

const SeriesDetails = () => {
  const { id } = useParams();
  const [series, setSeries] = useState<Series | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  
  // Ativar bloqueador de anúncios e popups
  useAdBlocker();

  // Sistema de anúncios
  const { showAdPopup, currentAdUrl, startPlayback, pausePlayback, handleAdWatched, adSettings } = useAdPlayback();
  const { 
    adPreference,
    needsToCompleteAds,
    getAdsRemainingCount,
    adUrls: systemAdUrls,
    adSettings: systemAdSettings,
    watchFiveAds
  } = useAdSystem();
  const [showIncompleteAdsPopup, setShowIncompleteAdsPopup] = useState(false);

  // Pausar/retomar player quando pop-up abre/fecha
  useEffect(() => {
    if (showAdPopup && showPlayer) {
      pausePlayback();
      // Tenta pausar players conhecidos via postMessage
      if (iframeRef.current) {
        try {
          iframeRef.current.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
          iframeRef.current.contentWindow?.postMessage(JSON.stringify({ method: 'pause' }), '*');
        } catch (e) {
          console.log('Não foi possível pausar via postMessage');
        }
      }
    } else if (!showAdPopup && showPlayer) {
      startPlayback();
    }
  }, [showAdPopup, showPlayer]);

  useEffect(() => {
    fetchSeries();
  }, [id]);

  useEffect(() => {
    if (series) {
      fetchSeasonData();
    }
  }, [series]);

  const fetchSeries = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('media_items')
        .select('*')
        .eq('id', id)
        .eq('type', 'series')
        .eq('published', true)
        .single();

      if (error) throw error;
      
      setSeries(data);
      
      if (data) {
        const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
        setIsFavorite(
          favorites.some((fav: any) => fav.id === data.id && fav.type === "series")
        );
      }
    } catch (error) {
      console.error('Error fetching series:', error);
      setSeries(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSeasonData = async () => {
    if (!series) return;
    
    try {
      const tmdbApiKey = import.meta.env.VITE_TMDB_API_KEY || '15d2ea6d0dc1d476efbca3eba2b9bbfb';
      const seasonsData: Season[] = [];
      
      for (let seasonNum = 1; seasonNum <= series.seasons; seasonNum++) {
        const response = await fetch(
          `https://api.themoviedb.org/3/tv/${series.tmdb_id}/season/${seasonNum}?api_key=${tmdbApiKey}&language=pt-BR`
        );
        
        if (response.ok) {
          const data = await response.json();
          seasonsData.push({
            season_number: seasonNum,
            episode_count: data.episodes?.length || 0,
            episodes: data.episodes?.map((ep: any) => ({
              episode_number: ep.episode_number,
              name: ep.name
            })) || []
          });
        }
      }
      
      setSeasons(seasonsData);
    } catch (error) {
      console.error('Error fetching season data:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary">Carregando...</div>
      </div>
    );
  }

  if (!series) {
    return <Navigate to="/series" />;
  }

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    const itemIndex = favorites.findIndex(
      (fav: any) => fav.id === series.id && fav.type === "series"
    );

    if (itemIndex >= 0) {
      favorites.splice(itemIndex, 1);
    } else {
      favorites.push({
        id: series.id,
        title: series.title,
        cover: series.poster_url,
        type: "series",
      });
    }

    localStorage.setItem("favorites", JSON.stringify(favorites));
    setIsFavorite(!isFavorite);
  };
  
  const getEmbedUrl = () => {
    if (!series) return null;
    return `https://primevicio.lat/embed/tv/${series.tmdb_id}/${selectedSeason}/${selectedEpisode}`;
  };

  const getCurrentSeason = () => {
    return seasons.find(s => s.season_number === selectedSeason);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-14 sm:pt-16">
        <div className="relative h-[40vh] sm:h-[50vh] lg:h-[60vh] w-full overflow-hidden">
          <img
            src={series.poster_url || '/placeholder.svg'}
            alt={series.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        </div>

        <div className="container mx-auto px-3 sm:px-4 lg:px-6 -mt-24 sm:-mt-32 lg:-mt-40 relative z-10">
          <div className="flex flex-col md:flex-row gap-4 sm:gap-6 lg:gap-8">
            <div className="flex-shrink-0 mx-auto md:mx-0">
              <img
                src={series.poster_url || '/placeholder.svg'}
                alt={series.title}
                className="w-40 sm:w-48 md:w-56 lg:w-64 rounded-lg shadow-2xl"
              />
            </div>

            <div className="flex-1 space-y-4 sm:space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-center md:text-left">{series.title}</h1>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <span className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar className="h-4 w-4" />
                    TMDB ID: {series.tmdb_id}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {series.seasons} {series.seasons === 1 ? "Temporada" : "Temporadas"}
                  </span>
                </div>
              </div>

              <div>
                <h2 className="text-lg sm:text-xl font-semibold mb-2 text-center md:text-left">Sinopse</h2>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base text-center md:text-left">
                  {series.synopsis || 'Nenhuma sinopse disponível.'}
                </p>
              </div>
              
              {seasons.length > 0 && (
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-center md:text-left">Selecionar Temporada</h2>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                      {seasons.map((season) => (
                        <Button
                          key={season.season_number}
                          variant={selectedSeason === season.season_number ? "default" : "outline"}
                          onClick={() => {
                            setSelectedSeason(season.season_number);
                            setSelectedEpisode(1);
                            setShowPlayer(false);
                          }}
                          className="min-w-[70px] sm:min-w-[80px] text-xs sm:text-sm h-8 sm:h-10"
                        >
                          T{season.season_number}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {getCurrentSeason() && (
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-center md:text-left">Selecionar Episódio</h2>
                      <div className="flex flex-wrap gap-2 max-h-40 sm:max-h-48 overflow-y-auto justify-center md:justify-start">
                        {getCurrentSeason()?.episodes.map((episode) => (
                          <Button
                            key={episode.episode_number}
                            variant={selectedEpisode === episode.episode_number ? "default" : "outline"}
                            onClick={() => {
                              setSelectedEpisode(episode.episode_number);
                              setShowPlayer(false);
                            }}
                            className="min-w-[60px] sm:min-w-[70px] text-xs sm:text-sm h-8 sm:h-10"
                            title={episode.name}
                          >
                            E{episode.episode_number}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Button 
                  size="lg" 
                  className="gap-2 bg-primary hover:bg-primary/90 text-black font-semibold w-full sm:w-auto"
                  onClick={() => {
                    // Verificar se precisa completar anúncios primeiro
                    if (needsToCompleteAds()) {
                      setShowIncompleteAdsPopup(true);
                    } else {
                      setShowPlayer(true);
                      startPlayback();
                    }
                  }}
                >
                  <Play className="h-5 w-5" />
                  Assistir T{selectedSeason}E{selectedEpisode}
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={toggleFavorite}
                  className="gap-2 w-full sm:w-auto"
                >
                  <Heart
                    className={`h-5 w-5 ${
                      isFavorite ? "fill-primary text-primary" : ""
                    }`}
                  />
                  <span className="hidden sm:inline">{isFavorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}</span>
                  <span className="sm:hidden">{isFavorite ? "Remover" : "Favoritar"}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="h-12 sm:h-20" />
      </main>

      {showPlayer && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2 sm:p-4">
          <div className="relative w-full max-w-7xl aspect-video">
            <Button
              variant="secondary"
              size="icon"
              className="absolute -top-10 sm:-top-12 right-0 z-10 h-8 w-8 sm:h-10 sm:w-10"
              onClick={() => {
                setShowPlayer(false);
                pausePlayback();
              }}
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <iframe
              ref={iframeRef}
              src={getEmbedUrl() || ''}
              className="w-full h-full rounded-md sm:rounded-lg"
              style={{ display: showAdPopup ? 'none' : 'block' }}
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              sandbox="allow-same-origin allow-scripts allow-forms"
            />
            {showAdPopup && (
              <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/80 rounded-md sm:rounded-lg">
                <p className="text-white text-lg">Player pausado durante anúncio...</p>
              </div>
            )}
          </div>
        </div>
      )}

      <AdPopup 
        open={showAdPopup} 
        adUrl={currentAdUrl} 
        onAdWatched={handleAdWatched}
        adPreference={adPreference}
        intervalMinutes={adSettings?.interval_minutes || 40}
        freeTimeHours={adSettings?.free_time_hours || 24}
      />

      <IncompleteAdsPopup
        open={showIncompleteAdsPopup}
        adsRemaining={getAdsRemainingCount()}
        totalRequired={systemAdSettings?.ads_required_for_free_time || 5}
        adUrls={systemAdUrls}
        onComplete={async () => {
          await watchFiveAds(systemAdSettings?.ads_required_for_free_time || 5);
          setShowIncompleteAdsPopup(false);
          toast.success('Parabéns! Você ganhou 24h sem anúncios!');
        }}
        onClose={() => setShowIncompleteAdsPopup(false)}
      />
    </div>
  );
};

export default SeriesDetails;
