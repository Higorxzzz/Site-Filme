import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, Shuffle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GenreFilterProps {
  availableGenres: { id: number; name: string }[];
  selectedGenres: number[];
  onGenreToggle: (genreId: number) => void;
  onClearFilters: () => void;
  onShuffle: () => void;
}

export function GenreFilter({
  availableGenres,
  selectedGenres,
  onGenreToggle,
  onClearFilters,
  onShuffle,
}: GenreFilterProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex gap-2 sm:gap-3 items-center mb-4 sm:mb-6 flex-wrap">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2 text-xs sm:text-sm h-8 sm:h-10">
            <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Filtros</span>
            {selectedGenres.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {selectedGenres.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] sm:w-80 max-h-[60vh] sm:max-h-96 overflow-y-auto" align="start">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Gêneros</h4>
              {selectedGenres.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="h-auto p-1 text-xs"
                >
                  Limpar
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {availableGenres.map((genre) => (
                <div key={genre.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`genre-${genre.id}`}
                    checked={selectedGenres.includes(genre.id)}
                    onCheckedChange={() => onGenreToggle(genre.id)}
                  />
                  <label
                    htmlFor={`genre-${genre.id}`}
                    className="text-xs sm:text-sm cursor-pointer flex-1"
                  >
                    {genre.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Button variant="outline" onClick={onShuffle} className="gap-2 text-xs sm:text-sm h-8 sm:h-10">
        <Shuffle className="h-3 w-3 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">Embaralhar</span>
      </Button>
    </div>
  );
}
