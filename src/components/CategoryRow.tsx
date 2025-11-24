import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { MediaCard } from "./MediaCard";
import { useRef, useState, useEffect } from "react";
import { Movie, Series } from "@/data/mockData";
import { Button } from "./ui/button";

interface CategoryRowProps {
  title: string;
  items: (Movie | Series)[];
  type: "movie" | "series";
  onSeeMore?: () => void;
}

export const CategoryRow = ({ title, items, type, onSeeMore }: CategoryRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(false);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      const newScrollLeft =
        direction === "left"
          ? scrollRef.current.scrollLeft - scrollAmount
          : scrollRef.current.scrollLeft + scrollAmount;

      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftButton(scrollLeft > 0);
      setShowRightButton(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    // Atualiza as setas após renderização inicial e quando itens mudam
    const updateButtons = () => {
      handleScroll();
    };

    // Delay para garantir que o conteúdo foi renderizado
    const timer = setTimeout(updateButtons, 100);

    // Atualiza quando a janela é redimensionada
    window.addEventListener('resize', updateButtons);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateButtons);
    };
  }, [items]);

  return (
    <div className="py-4 sm:py-6">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">{title}</h2>
          {onSeeMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSeeMore}
              className="gap-1 sm:gap-2 text-primary hover:text-primary/80 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
            >
              Ver mais
              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="relative group lg:px-6">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-3 sm:pb-4 px-3 sm:px-4 lg:px-0 snap-x snap-mandatory"
        >
            {items.map((item) => (
              <div key={item.id} className="flex-none w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px] snap-start">
                <MediaCard
                  id={item.id}
                  title={item.title}
                  cover={item.cover}
                  rating={item.rating}
                  year={item.year}
                  type={type}
                />
              </div>
            ))}
        </div>
        
        {showLeftButton && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-2 sm:left-4 lg:left-2 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-2.5 bg-background/60 backdrop-blur-sm rounded-full opacity-90 hover:opacity-100 hover:bg-background/80 transition-all duration-300 hover:scale-110 border border-border/50"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-foreground" />
          </button>
        )}

        {showRightButton && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-2 sm:right-4 lg:right-2 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-2.5 bg-background/60 backdrop-blur-sm rounded-full opacity-90 hover:opacity-100 hover:bg-background/80 transition-all duration-300 hover:scale-110 border border-border/50"
            aria-label="Próximo"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-foreground" />
          </button>
        )}
      </div>
    </div>
  );
};
