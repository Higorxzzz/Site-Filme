import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useAdSystem } from "@/hooks/useAdSystem";
import { useVip } from "@/hooks/useVip";
import { LogOut, Clock, ExternalLink, Crown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { isVip, vipExpiresAt, loading: vipLoading } = useVip();
  const { 
    getRemainingAdFreeTime, 
    isAdFree, 
    adPreference, 
    loading: adSystemLoading, 
    adSettings,
    adUrls,
    adsWatchedCount,
    updateAdPreference,
    incrementAdsWatched,
    watchFiveAds
  } = useAdSystem();
  
  const handlePreferenceChange = async (newPreference: 'five_at_once' | 'one_per_40min') => {
    console.log('🔄 Salvando preferência:', newPreference);
    const { error } = await updateAdPreference(newPreference);
    
    if (error) {
      console.error('❌ Erro ao salvar:', error);
      toast({
        title: "Erro ao salvar preferência",
        description: error,
        variant: "destructive",
      });
    } else {
      console.log('✅ Preferência salva automaticamente');
      toast({
        title: "Preferência salva",
        description: "Sua preferência de anúncios foi atualizada.",
      });
    }
  };

  const handleWatchAd = async () => {
    const requiredAds = adSettings?.ads_required_for_free_time || 5;
    if (adsWatchedCount >= requiredAds) return;

    const adUrl = adUrls[adsWatchedCount % adUrls.length];
    if (adUrl) {
      window.open(adUrl.url, '_blank');
      const result = await incrementAdsWatched();

      if (result.error) {
        console.error('❌ Erro ao salvar progresso:', result.error);
        toast({
          title: "Erro",
          description: "Não foi possível salvar o progresso",
          variant: "destructive",
        });
        return;
      }

      const newCount = result.newCount || 0;
      if (newCount >= requiredAds) {
        console.log('🎯 Todos os anúncios assistidos, concedendo tempo livre');
        const watchResult = await watchFiveAds(requiredAds);
        if (!watchResult.error) {
          const freeTimeHours = adSettings?.free_time_hours || 24;
          console.log(`✅ Tempo livre concedido: ${freeTimeHours}h`);
          toast({
            title: "Parabéns!",
            description: `Você ganhou ${freeTimeHours} horas sem anúncios!`,
          });
        } else {
          console.error('❌ Erro ao conceder tempo livre:', watchResult.error);
        }
      }
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      toast({
        title: "Logout realizado",
        description: "Você saiu da sua conta com sucesso.",
      });
      navigate("/login");
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      // Salva a URL atual para redirecionar após login
      navigate(`/login?redirect=${encodeURIComponent('/profile')}`);
    }
  }, [user, loading, navigate]);

  // Mostra loading enquanto verifica a sessão ou carrega preferências
  if (loading || adSystemLoading || vipLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const remainingTime = getRemainingAdFreeTime();
  const requiredAdsCount = adSettings?.ads_required_for_free_time || 5;
  const freeTimeHours = adSettings?.free_time_hours || 24;
  const intervalMinutes = adSettings?.interval_minutes || 40;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 mt-20">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Perfil do Usuário</CardTitle>
              <CardDescription>Gerencie suas informações e preferências</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações de Anúncios</CardTitle>
              <CardDescription>
                {isVip ? "Você é um membro VIP - sem anúncios!" : "Configure como você prefere lidar com anúncios"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
              ) : isAdFree() && remainingTime ? (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold text-sm">Você está livre de anúncios!</p>
                    <p className="text-xs text-muted-foreground">
                      Tempo restante: {remainingTime.hours}h {remainingTime.minutes}min
                    </p>
                  </div>
                </div>
              ) : null}

              {!isVip && (
                <div className="space-y-4">
                  <RadioGroup 
                    value={adPreference} 
                    onValueChange={(value) => handlePreferenceChange(value as 'five_at_once' | 'one_per_40min')}
                    className="space-y-3"
                  >
                    <div className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="five_at_once" id="five_at_once" className="mt-1" />
                      <Label htmlFor="five_at_once" className="flex-1 cursor-pointer">
                        <div className="font-medium">Assistir {requiredAdsCount} anúncios de uma vez</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Assista {requiredAdsCount} anúncios agora e ganhe {freeTimeHours}h sem interrupções
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="one_per_40min" id="one_per_40min" className="mt-1" />
                      <Label htmlFor="one_per_40min" className="flex-1 cursor-pointer">
                        <div className="font-medium">Assistir 1 anúncio a cada {intervalMinutes} minutos</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Um anúncio curto aparecerá durante a reprodução
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

                  {adPreference === 'five_at_once' && !isAdFree() && (
                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-medium">{adsWatchedCount} de {requiredAdsCount}</span>
                        </div>
                        <Progress value={(adsWatchedCount / requiredAdsCount) * 100} className="h-2" />
                      </div>

                      <Button 
                        onClick={handleWatchAd}
                        disabled={adsWatchedCount >= requiredAdsCount}
                        className="w-full"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        {adsWatchedCount >= requiredAdsCount 
                          ? 'Todos os anúncios assistidos!' 
                          : `Assistir anúncio ${adsWatchedCount + 1} de ${requiredAdsCount}`
                        }
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ações da Conta</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={handleSignOut} variant="destructive" className="w-full">
                <LogOut className="mr-2 h-4 w-4" />
                Sair da conta
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
