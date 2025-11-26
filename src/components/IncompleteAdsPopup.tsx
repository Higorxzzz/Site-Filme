import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdSystem } from "@/hooks/useAdSystem";

interface IncompleteAdsPopupProps {
  open: boolean;
  adsRemaining: number;
  totalRequired: number;
  adUrls: { id: string; url: string }[];
  onComplete: () => void;
  onClose: () => void;
}

export const IncompleteAdsPopup = ({ 
  open, 
  adsRemaining,
  totalRequired,
  adUrls,
  onComplete,
  onClose
}: IncompleteAdsPopupProps) => {
  const navigate = useNavigate();
  const { adsWatchedCount, incrementAdsWatched, watchFiveAds } = useAdSystem();

  const handleWatchAd = async () => {
    if (adsWatchedCount < totalRequired && adUrls.length > 0) {
      const adIndex = adsWatchedCount % adUrls.length;
      window.open(adUrls[adIndex].url, '_blank');
      
      const result = await incrementAdsWatched();
      
      if (!result.error && result.newCount && result.newCount >= totalRequired) {
        // Completou todos os anúncios
        await watchFiveAds(totalRequired);
        onComplete();
      }
    }
  };

  const handleChangePreference = () => {
    onClose();
    navigate('/profile');
  };

  const adsLeft = totalRequired - adsWatchedCount;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            Anúncios obrigatórios pendentes
          </DialogTitle>
          <DialogDescription>
            Complete os anúncios para liberar acesso sem interrupções
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-foreground mb-2">
              Você ainda não completou os <span className="font-semibold">{totalRequired} anúncios necessários</span> para liberar 24h sem anúncios.
            </p>
            <p className="text-sm text-muted-foreground">
              Conclua os anúncios ou altere sua preferência no perfil.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progresso:</span>
              <span className="text-sm text-muted-foreground">
                {adsWatchedCount} de {totalRequired} anúncios
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(adsWatchedCount / totalRequired) * 100}%` }}
              />
            </div>
            {adsLeft > 0 && (
              <p className="text-xs text-muted-foreground">
                Faltam {adsLeft} anúncios
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Button 
              onClick={handleWatchAd} 
              className="w-full"
              disabled={adsWatchedCount >= totalRequired}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              {adsLeft > 0 ? `Assistir anúncio (${adsLeft} restantes)` : 'Todos os anúncios assistidos'}
            </Button>

            <Button 
              onClick={handleChangePreference} 
              variant="outline"
              className="w-full"
            >
              Trocar de opção
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
