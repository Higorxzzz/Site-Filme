import { Header } from "@/components/Header";
import { MediaCard } from "@/components/MediaCard";
import { useState, useEffect, useMemo } from "react";

const Favorites = () => {
  const [favorites, setFavorites] = useState<any[]>([]);

  const { movies, series } = useMemo(() => {
    return {
      movies: favorites.filter(item => item.type === 'movie'),
      series: favorites.filter(item => item.type === 'series')
    };
  }, [favorites]);

  useEffect(() => {
    const loadFavorites = () => {
      const stored = JSON.parse(localStorage.getItem("favorites") || "[]");
      setFavorites(stored);
    };

    loadFavorites();
    window.addEventListener("storage", loadFavorites);
    
    const interval = setInterval(loadFavorites, 1000);

    return () => {
      window.removeEventListener("storage", loadFavorites);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-8">Favoritos</h1>

          {favorites.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-muted-foreground mb-4">
                Você ainda não tem favoritos
              </p>
              <p className="text-muted-foreground">
                Adicione filmes e séries aos favoritos clicando no ícone de coração
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {movies.length > 0 && (
                <section>
                  <h2 className="text-2xl font-semibold mb-6">Filmes</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {movies.map((item) => (
                      <MediaCard
                        key={`${item.type}-${item.id}`}
                        id={item.id}
                        title={item.title}
                        cover={item.cover}
                        rating={item.rating}
                        year={item.year}
                        type={item.type}
                      />
                    ))}
                  </div>
                </section>
              )}

              {series.length > 0 && (
                <section>
                  <h2 className="text-2xl font-semibold mb-6">Séries</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {series.map((item) => (
                      <MediaCard
                        key={`${item.type}-${item.id}`}
                        id={item.id}
                        title={item.title}
                        cover={item.cover}
                        rating={item.rating}
                        year={item.year}
                        type={item.type}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Favorites;
