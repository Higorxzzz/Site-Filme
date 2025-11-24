import { Heart, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

interface MediaCardProps {
  id: string | number;
  title: string;
  cover: string;
  rating: number;
  year: number;
  type: "movie" | "series";
}

export const MediaCard = ({ id, title, cover, rating, year, type }: MediaCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    setIsFavorite(favorites.some((fav: any) => fav.id === id && fav.type === type));
  }, [id, type]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    const itemIndex = favorites.findIndex((fav: any) => fav.id === id && fav.type === type);

    if (itemIndex >= 0) {
      favorites.splice(itemIndex, 1);
    } else {
      favorites.push({ id, title, cover, rating, year, type });
    }

    localStorage.setItem("favorites", JSON.stringify(favorites));
    setIsFavorite(!isFavorite);
  };

  return (
    <Link
      to={`/${type}/${id}`}
      className="group/card relative block overflow-hidden rounded-xl"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl shadow-lg">
        <img
          src={cover}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover/card:scale-110"
        />
        
        {/* Overlay escuro com botão assistir */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-0 group-hover/card:opacity-100 transition-all duration-500 flex flex-col items-center justify-center">
          <div className="transform translate-y-4 group-hover/card:translate-y-0 transition-transform duration-500">
            <div className="flex items-center gap-2 px-6 py-3 bg-primary rounded-full text-white font-semibold text-sm mb-4 hover:scale-110 transition-transform duration-300 shadow-xl">
              <Play className="h-4 w-4 fill-current" />
              Assistir
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover/card:translate-y-0 transition-transform duration-500">
            <h3 className="text-sm font-semibold text-white mb-2 line-clamp-2">{title}</h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="px-2 py-1 bg-primary/90 rounded-md text-white font-medium">
                ★ {rating}
              </span>
              <span className="text-gray-300">{year}</span>
            </div>
          </div>
        </div>

        {/* Botão favorito */}
        <button
          onClick={toggleFavorite}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/70 backdrop-blur-sm opacity-0 group-hover/card:opacity-100 transition-all duration-300 hover:bg-black/90 hover:scale-110 z-10"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              isFavorite ? "fill-primary text-primary" : "text-white"
            }`}
          />
        </button>
      </div>
    </Link>
  );
};
