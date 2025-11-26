import { Link, useLocation, useNavigate } from "react-router-dom";
import { Heart, User, LogOut, Shield, Settings, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SearchAutocomplete } from "./SearchAutocomplete";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useVip } from "@/hooks/useVip";

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export const Header = ({ onSearch }: HeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isVip } = useVip();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Erro ao fazer logout");
    } else {
      toast.success("Logout realizado com sucesso");
      navigate("/");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-blur border-b border-border/50">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 h-14 sm:h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg sm:text-2xl font-bold">
              Prime<span className="text-primary">Vício</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/") ? "text-primary" : "text-foreground/80"
              }`}
            >
              Início
            </Link>
            <Link
              to="/movies"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/movies") ? "text-primary" : "text-foreground/80"
              }`}
            >
              Filmes
            </Link>
            <Link
              to="/series"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/series") ? "text-primary" : "text-foreground/80"
              }`}
            >
              Séries
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="w-full max-w-[200px] sm:max-w-xs md:block">
            <SearchAutocomplete onSearch={onSearch} />
          </div>

          <Link to="/favorites" className="p-2 hover:text-primary transition-colors">
            <Heart className="h-5 w-5" />
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem disabled>
                  <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/vip")}>
                  <Crown className={`mr-2 h-4 w-4 ${isVip ? 'text-primary' : ''}`} />
                  Plano VIP
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/admin")}>
                  <Shield className="mr-2 h-4 w-4" />
                  Painel Admin
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")} className="hidden sm:inline-flex">
              Entrar
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
