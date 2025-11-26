import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save } from "lucide-react";

interface AdSettings {
  id: string;
  interval_minutes: number;
  ads_required_for_free_time: number;
  free_time_hours: number;
  redirect_url: string;
}

export const AdSettingsSection = () => {
  const [settings, setSettings] = useState<AdSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [intervalMinutes, setIntervalMinutes] = useState<number>(40);
  const [adsRequired, setAdsRequired] = useState<number>(5);
  const [freeTimeHours, setFreeTimeHours] = useState<number>(24);
  const [redirectUrl, setRedirectUrl] = useState<string>("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ad_settings')
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setSettings(data);
        setIntervalMinutes(data.interval_minutes);
        setAdsRequired(data.ads_required_for_free_time);
        setFreeTimeHours(data.free_time_hours);
        setRedirectUrl(data.redirect_url);
      }
    } catch (error) {
      console.error('Error loading ad settings:', error);
      toast({
        title: "Erro ao carregar configurações",
        description: "Não foi possível carregar as configurações de anúncios.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (intervalMinutes < 1 || adsRequired < 1 || freeTimeHours < 1) {
      toast({
        title: "Valores inválidos",
        description: "Todos os valores devem ser maiores que zero.",
        variant: "destructive",
      });
      return;
    }

    if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
      toast({
        title: "URL inválida",
        description: "A URL de redirecionamento deve começar com http:// ou https://",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('ad-config', {
        body: {
          action: 'update',
          interval_minutes: intervalMinutes,
          ads_required_for_free_time: adsRequired,
          free_time_hours: freeTimeHours,
          redirect_url: redirectUrl,
        },
      });

      if (error) {
        throw new Error(error.message || 'Erro ao salvar configurações');
      }

      toast({
        title: "Configurações salvas",
        description: "As configurações de anúncios foram atualizadas com sucesso.",
      });

      loadSettings();
    } catch (error: any) {
      console.error('Error saving ad settings:', error);
      toast({
        title: "Erro ao salvar configurações",
        description: error.message || "Não foi possível salvar as configurações. Verifique sua conexão e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Anúncios</CardTitle>
          <CardDescription>Configure as regras do sistema de anúncios</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Anúncios</CardTitle>
        <CardDescription>Configure as regras do sistema de anúncios e redirecionamentos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="interval">Intervalo entre anúncios (minutos)</Label>
            <Input
              id="interval"
              type="number"
              min="1"
              value={intervalMinutes}
              onChange={(e) => setIntervalMinutes(parseInt(e.target.value) || 0)}
              placeholder="Ex: 40"
            />
            <p className="text-xs text-muted-foreground">
              Tempo em minutos entre cada anúncio durante a reprodução
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adsRequired">Quantidade de anúncios necessários</Label>
            <Input
              id="adsRequired"
              type="number"
              min="1"
              value={adsRequired}
              onChange={(e) => setAdsRequired(parseInt(e.target.value) || 0)}
              placeholder="Ex: 5"
            />
            <p className="text-xs text-muted-foreground">
              Quantos anúncios o usuário precisa assistir de uma vez
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="freeTime">Tempo livre de anúncios (horas)</Label>
            <Input
              id="freeTime"
              type="number"
              min="1"
              value={freeTimeHours}
              onChange={(e) => setFreeTimeHours(parseInt(e.target.value) || 0)}
              placeholder="Ex: 24"
            />
            <p className="text-xs text-muted-foreground">
              Tempo em horas que o usuário ficará sem anúncios
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="redirectUrl">URL de redirecionamento</Label>
            <Input
              id="redirectUrl"
              type="url"
              value={redirectUrl}
              onChange={(e) => setRedirectUrl(e.target.value)}
              placeholder="https://site-de-anuncio.com"
            />
            <p className="text-xs text-muted-foreground">
              URL para onde os usuários serão redirecionados
            </p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full sm:w-auto"
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
