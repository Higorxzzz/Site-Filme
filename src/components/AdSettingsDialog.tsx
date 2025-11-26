import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAdSystem } from "@/hooks/useAdSystem";
import { useVip } from "@/hooks/useVip";
import { toast } from "@/hooks/use-toast";
import { ExternalLink, Clock, Crown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AdSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AdSettingsDialog = ({ open, onOpenChange }: AdSettingsDialogProps) => {
  const { isVip, vipExpiresAt } = useVip();
  const { 
    adPreference, 
    adUrls, 
    adSettings,
    updateAdPreference, 
    watchFiveAds,
    getRemainingAdFreeTime,
    isAdFree 
  } = useAdSystem();
  
  const [selectedPreference, setSelectedPreference] = useState<'five_at_once' | 'one_per_40min'>(adPreference);
  const [adsWatched, setAdsWatched] = useState(0);
  const [isWatchingAds, setIsWatchingAds] = useState(false);

  // Atualiza quando o dialog abre ou quando a preferência muda
  useEffect(() => {
    if (open) {
      console.log('📂 Dialog aberto, preferência carregada:', adPreference);
      setSelectedPreference(adPreference);
    }
  }, [open, adPreference]);

  const handleSavePreference = async () => {
    console.log('🔄 Salvando preferência selecionada:', selectedPreference);
    
    if (selectedPreference === adPreference) {
      console.log('ℹ️ Preferência não mudou, fechando dialog');
      onOpenChange(false);
      return;
    }
    
    const { error } = await updateAdPreference(selectedPreference);
    
    if (error) {
      console.error('❌ Erro ao salvar:', error);
      toast({
        title: "Erro ao salvar preferência",
        description: error,
        variant: "destructive",
      });
    } else {
      console.log('✅ Preferência salva com sucesso');
      toast({
        title: "Preferência salva",
        description: "Sua preferência de anúncios foi atualizada com sucesso.",
      });
      onOpenChange(false);
    }
  };

  const handleWatchAd = async () => {
    const requiredAds = adSettings?.ads_required_for_free_time || 5;
    if (adsWatched >= requiredAds) return;

    const adUrl = adUrls[adsWatched % adUrls.length];
    if (adUrl) {
      window.open(adUrl.url, '_blank');
      const newCount = adsWatched + 1;
      setAdsWatched(newCount);

      if (newCount >= requiredAds) {
        console.log('🎯 Todos os anúncios assistidos, concedendo tempo livre');
        const result = await watchFiveAds(requiredAds);
        if (!result.error) {
          const freeTimeHours = adSettings?.free_time_hours || 24;
          console.log(`✅ Tempo livre concedido: ${freeTimeHours}h`);
          toast({
            title: "Parabéns!",
            description: `Você ganhou ${freeTimeHours} horas sem anúncios!`,
          });
          setIsWatchingAds(false);
          setAdsWatched(0);
          // Fecha o dialog após concluir
          onOpenChange(false);
        } else {
          console.error('❌ Erro ao conceder tempo livre:', result.error);
        }
      }
    }
  };

  const requiredAdsCount = adSettings?.ads_required_for_free_time || 5;
  const freeTimeHours = adSettings?.free_time_hours || 24;

  const remainingTime = getRemainingAdFreeTime();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configurações de Anúncios</DialogTitle>
          <DialogDescription>
            {isVip ? "Você é um membro VIP - sem anúncios!" : "Configure como deseja lidar com os anúncios durante a reprodução."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isVip && vipExpiresAt ? (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center gap-3">
              <Crown className="h-6 w-6 text-primary" />
              <div>
                <p className="font-semibold text-sm">Você é VIP!</p>
                <p className="text-xs text-muted-foreground">
                  Seu VIP expira em: {format(new Date(vipExpiresAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          ) : isAdFree() && remainingTime && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-sm">Você está livre de anúncios!</p>
                <p className="text-xs text-muted-foreground">
                  Tempo restante: {remainingTime.hours}h {remainingTime.minutes}min
                </p>
              </div>
            </div>
          )}

          {!isVip && (
            <RadioGroup value={selectedPreference} onValueChange={(value: any) => setSelectedPreference(value)}>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="five_at_once" id="five_at_once" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="five_at_once" className="cursor-pointer">
                      <span className="font-semibold">Assistir {requiredAdsCount} anúncios de uma vez</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        Clique {requiredAdsCount} vezes e ganhe {freeTimeHours}h sem anúncios
                      </p>
                    </Label>
                  </div>
                </div>

                <div className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="one_per_40min" id="one_per_40min" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="one_per_40min" className="cursor-pointer">
                      <span className="font-semibold">1 anúncio a cada {adSettings?.interval_minutes || 40} minutos</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        Um pop-up aparecerá durante a reprodução
                      </p>
                    </Label>
                  </div>
                </div>
              </div>
            </RadioGroup>
          )}

          {!isVip && selectedPreference === 'five_at_once' && (
            <div className="border-t pt-4 space-y-3">
              <Button 
                onClick={() => setIsWatchingAds(true)}
                variant="default"
                className="w-full"
                disabled={isAdFree()}
              >
                {isAdFree() ? "Você já está livre de anúncios" : "Começar a assistir anúncios"}
              </Button>

              {isWatchingAds && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-accent/50 rounded-lg p-4">
                    <span className="text-sm font-medium">
                      Progresso: {adsWatched} de {requiredAdsCount} anúncios assistidos
                    </span>
                  </div>
                  
                  <Button
                    onClick={handleWatchAd}
                    variant="outline"
                    className="w-full"
                    disabled={adsWatched >= requiredAdsCount}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {adsWatched >= requiredAdsCount ? "Completo!" : `Assistir anúncio ${adsWatched + 1}`}
                  </Button>
                </div>
              )}
            </div>
          )}

          {!isVip && (
            <Button onClick={handleSavePreference} className="w-full">
              Salvar Preferência
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
