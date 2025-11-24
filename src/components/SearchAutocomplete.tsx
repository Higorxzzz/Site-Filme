import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "./ui/input";
import { useNavigate } from "react-router-dom";

interface MediaItem {
  id: string;
  title: string;
  type: 'movie' | 'series';
  poster_url: string | null;
}

interface SearchAutocompleteProps {
  onSearch?: (query: string) => void;
}

export const SearchAutocomplete = ({ onSearch }: SearchAutocompleteProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchMedia = async () => {
      if (searchQuery.trim().length < 2) {
        setResults([]);
        setShowResults(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-media?query=${encodeURIComponent(searchQuery)}`
        );

        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
          setShowResults(true);
        }
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchMedia, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSelectItem = (item: MediaItem) => {
    setShowResults(false);
    setSearchQuery("");
    if (item.type === 'movie') {
      navigate(`/movie/${item.id}`);
    } else {
      navigate(`/series/${item.id}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery);
      }
      setShowResults(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
      <Input
        type="text"
        placeholder="Buscar..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => searchQuery.trim().length >= 2 && setShowResults(true)}
        className="pl-8 sm:pl-9 pr-3 sm:pr-4 bg-secondary/50 border-border/50 text-sm h-9 sm:h-10"
      />
      
      {loading && (
        <Loader2 className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
      )}

      {showResults && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full min-w-[280px] sm:min-w-[320px] bg-background border border-border rounded-md shadow-xl max-h-[60vh] sm:max-h-96 overflow-y-auto z-50">
          {results.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelectItem(item)}
              className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-secondary/50 transition-colors text-left border-b border-border/30 last:border-b-0"
            >
              <img
                src={item.poster_url || '/placeholder.svg'}
                alt={item.title}
                className="w-10 h-14 sm:w-10 sm:h-14 object-cover rounded flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {item.type === 'movie' ? 'Filme' : 'Série'}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && !loading && searchQuery.trim().length >= 2 && results.length === 0 && (
        <div className="absolute top-full mt-2 w-full min-w-[280px] bg-background border border-border rounded-md shadow-lg p-3 sm:p-4 z-50">
          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            Nenhum resultado encontrado
          </p>
        </div>
      )}
    </div>
  );
};
