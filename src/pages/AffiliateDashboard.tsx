import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, DollarSign, Users, TrendingUp, Calendar } from "lucide-react";
import { Header } from "@/components/Header";

export default function AffiliateDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [affiliateCode, setAffiliateCode] = useState("");
  const [balance, setBalance] = useState(0);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);
  const [dailyAdsConversions, setDailyAdsConversions] = useState(0);
  const [perAdConversions, setPerAdConversions] = useState(0);
  const [vipConversions, setVipConversions] = useState(0);
  const [referredUsers, setReferredUsers] = useState<Array<{
    id: string;
    email: string | null;
    created_at: string | null;
    is_vip: boolean | null;
    vip_expires_at: string | null;
  }>>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    if (user) {
      checkAffiliateStatus();
    }
  }, [user, authLoading, navigate]);

  const checkAffiliateStatus = async () => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("is_affiliate, affiliate_code, affiliate_balance")
        .eq("id", user?.id)
        .single();

      if (error) throw error;

      if (!profile?.is_affiliate) {
        toast.error("Você não é um afiliado");
        navigate("/");
        return;
      }

      setIsAffiliate(true);
      setAffiliateCode(profile.affiliate_code || "");
      setBalance(profile.affiliate_balance || 0);

      await loadStats();
    } catch (error) {
      console.error("Error checking affiliate status:", error);
      toast.error("Erro ao verificar status de afiliado");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;

    try {
      // Primeiro, buscar o código de afiliado do usuário atual
      const { data: profile } = await supabase
        .from('profiles')
        .select('affiliate_code')
        .eq('id', user.id)
        .single();

      const currentAffiliateCode = profile?.affiliate_code || affiliateCode;
      
      if (!currentAffiliateCode) {
        console.log('❌ Nenhum código de afiliado encontrado');
        return;
      }

      console.log('📊 Carregando stats para afiliado:', user.id, 'código:', currentAffiliateCode);

      // Buscar total de cliques
      const { count: clicksCount } = await supabase
        .from('affiliate_clicks')
        .select('*', { count: 'exact', head: true })
        .eq('affiliate_code', currentAffiliateCode);

      console.log('🖱️ Total de cliques:', clicksCount);

      // Buscar total de cadastros usando referred_by
      const { data: referredProfiles, count: referralsCount, error: referralsError } = await supabase
        .from('profiles')
        .select('id, email, created_at, is_vip, vip_expires_at', { count: 'exact' })
        .eq('referred_by', currentAffiliateCode);

      if (referralsError) {
        console.error('❌ Erro ao buscar indicados:', referralsError);
      } else {
        console.log('👥 Total de cadastros (referred_by):', referralsCount);
        console.log('📋 Usuários indicados:', referredProfiles);
        setReferredUsers(referredProfiles || []);
        setTotalReferrals(referralsCount || 0);
      }

      // Buscar conversões
      const { data: conversions } = await supabase
        .from('affiliate_conversions')
        .select('*')
        .eq('affiliate_id', user.id);

      if (conversions) {
        // Calcular ganhos do mês
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyConversionsData = conversions.filter(c => 
          new Date(c.created_at) >= firstDayOfMonth
        );
        const monthlyTotal = monthlyConversionsData.reduce((sum, c) => sum + (c.amount || 0), 0);
        setMonthlyEarnings(monthlyTotal);

        // Separar por tipo
        const dailyAds = conversions.filter(c => c.conversion_type === 'daily_ads');
        const perAd = conversions.filter(c => c.conversion_type === 'per_ad');
        const vip = conversions.filter(c => c.conversion_type === 'vip_subscription');

        setDailyAdsConversions(dailyAds.reduce((sum, c) => sum + (c.amount || 0), 0));
        setPerAdConversions(perAd.reduce((sum, c) => sum + (c.amount || 0), 0));
        setVipConversions(vip.reduce((sum, c) => sum + (c.amount || 0), 0));

        console.log('Conversões carregadas:', {
          dailyAds: dailyAds.length,
          perAd: perAd.length,
          vip: vip.length
        });
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const copyAffiliateLink = () => {
    const link = `${window.location.origin}/signup?ref=${affiliateCode}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado para a área de transferência!");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAffiliate) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard de Afiliado</h1>
          <p className="text-muted-foreground">Acompanhe seus ganhos e conversões</p>
        </div>

        {/* Affiliate Link */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Seu Link de Afiliado</CardTitle>
            <CardDescription>Compartilhe este link para ganhar comissões</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <input
                type="text"
                value={`${window.location.origin}/signup?ref=${affiliateCode}`}
                readOnly
                className="flex-1 px-3 py-2 bg-secondary rounded-md text-sm"
              />
              <Button onClick={copyAffiliateLink} variant="outline">
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Código: <span className="font-mono font-semibold">{affiliateCode}</span>
            </p>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {balance.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ganhos do Mês</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {monthlyEarnings.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Indicações</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReferrals}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversões VIP</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vipConversions.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Conversions Breakdown */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Conversões por Tipo</CardTitle>
            <CardDescription>Detalhamento dos seus ganhos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Anúncios Diários (5 por dia)</span>
                <span className="font-semibold">R$ {dailyAdsConversions.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Anúncios por 40min</span>
                <span className="font-semibold">R$ {perAdConversions.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Assinaturas VIP</span>
                <span className="font-semibold">R$ {vipConversions.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referred Users Table */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Usuários Indicados</CardTitle>
            <CardDescription>Lista de todos os usuários que você indicou</CardDescription>
          </CardHeader>
          <CardContent>
            {referredUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum usuário indicado ainda
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-sm">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Data de Cadastro</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referredUsers.map((user) => (
                      <tr key={user.id} className="border-b last:border-0">
                        <td className="py-3 px-4 text-sm">{user.email || 'Email não disponível'}</td>
                        <td className="py-3 px-4 text-sm">
                          {user.created_at 
                            ? new Date(user.created_at).toLocaleDateString('pt-BR')
                            : 'Data não disponível'}
                        </td>
                        <td className="py-3 px-4">
                          {user.is_vip && user.vip_expires_at && new Date(user.vip_expires_at) > new Date() ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              VIP
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                              Ativo
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Button */}
        <Card>
          <CardHeader>
            <CardTitle>Solicitar Saque</CardTitle>
            <CardDescription>
              Saldo disponível: R$ {balance.toFixed(2)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate("/affiliate/withdraw")}
              disabled={balance < 20}
              className="w-full sm:w-auto"
            >
              Solicitar Saque
            </Button>
            {balance < 20 && (
              <p className="text-sm text-muted-foreground mt-2">
                Saldo mínimo para saque: R$ 20,00
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
