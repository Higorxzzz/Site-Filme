import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useVip } from "@/hooks/useVip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Check, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const VipPlan = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isVip, vipExpiresAt, loading: vipLoading, testPaymentEnabled, vipDurationDays, vipPrice, activateVip } = useVip();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || vipLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const benefits = [
    `Sem anúncios por ${vipDurationDays} dias`,
    "Acesso ilimitado a todos os filmes e séries",
    "Qualidade de streaming premium",
    "Suporte prioritário",
    "Experiência sem interrupções"
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
              <Crown className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Plano VIP</h1>
            <p className="text-xl text-muted-foreground">
              Aproveite uma experiência premium sem anúncios
            </p>
          </div>

          {isVip ? (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Crown className="w-6 h-6 text-primary" />
                      Você é VIP!
                    </CardTitle>
                    <CardDescription className="text-lg mt-2">
                      Aproveite sua experiência premium
                    </CardDescription>
                  </div>
                  <Badge variant="default" className="text-lg px-4 py-2">
                    Ativo
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {vipExpiresAt && (
                  <div className="flex items-center gap-2 text-muted-foreground mb-6">
                    <Calendar className="w-5 h-5" />
                    <span>
                      Expira em: {format(new Date(vipExpiresAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>

                {testPaymentEnabled && (
                  <Button 
                    onClick={activateVip} 
                    className="w-full"
                    size="lg"
                  >
                    Renovar VIP por {vipDurationDays} dias
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Assine o Plano VIP</CardTitle>
                <CardDescription className="text-lg">
                  R$ {vipPrice.toFixed(2).replace('.', ',')} / mês
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-8">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>

                {testPaymentEnabled ? (
                  <Button 
                    onClick={activateVip} 
                    className="w-full"
                    size="lg"
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    Assinar VIP (Teste - Grátis)
                  </Button>
                ) : (
                  <div className="text-center p-6 bg-muted rounded-lg">
                    <p className="text-muted-foreground">
                      O sistema de pagamento está sendo configurado.
                      <br />
                      Em breve você poderá assinar o plano VIP.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default VipPlan;