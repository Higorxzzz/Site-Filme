import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface AdPopupProps {
  open: boolean;
  adUrl: string;
  onAdWatched: () => void;
  adPreference?: 'five_at_once' | 'one_per_40min';
  intervalMinutes?: number;
  freeTimeHours?: number;
}

export const AdPopup = ({ 
  open, 
  adUrl, 
  onAdWatched, 
  adPreference = 'one_per_40min',
  intervalMinutes = 40,
  freeTimeHours = 24
}: AdPopupProps) => {
  const handleWatchAd = () => {
    window.open(adUrl, '_blank');
    onAdWatched();
  };

  const getMessage = () => {
    if (adPreference === 'five_at_once') {
      return `Após assistir aos anúncios, você terá ${freeTimeHours}h livres sem interrupções.`;
    }
    return `Abra o anúncio para continuar assistindo. Próximo anúncio daqui a ${intervalMinutes} minutos.`;
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[400px]" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Momento do anúncio</DialogTitle>
          <DialogDescription>
            Assista a um anúncio para continuar
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            {getMessage()}
          </p>

          <Button onClick={handleWatchAd} className="w-full">
            <ExternalLink className="mr-2 h-4 w-4" />
            Abrir anúncio
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
