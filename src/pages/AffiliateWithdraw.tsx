import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Header } from "@/components/Header";

export default function AffiliateWithdraw() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isAffiliate, setIsAffiliate] = useState(false);
  const [balance, setBalance] = useState(0);
  const [formData, setFormData] = useState({
    pixName: "",
    pixKey: "",
    amount: ""
  });

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
        .select("is_affiliate, affiliate_balance")
        .eq("id", user?.id)
        .single();

      if (error) throw error;

      if (!profile?.is_affiliate) {
        toast.error("Você não é um afiliado");
        navigate("/");
        return;
      }

      setIsAffiliate(true);
      setBalance(profile.affiliate_balance || 0);
    } catch (error) {
      console.error("Error checking affiliate status:", error);
      toast.error("Erro ao verificar status de afiliado");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    
    if (!formData.pixName || !formData.pixKey || !formData.amount) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (amount < 20) {
      toast.error("Valor mínimo para saque é R$ 20,00");
      return;
    }

    if (amount > balance) {
      toast.error("Saldo insuficiente");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("affiliate_withdrawals")
        .insert({
          affiliate_id: user?.id,
          pix_name: formData.pixName,
          pix_key: formData.pixKey,
          amount: amount,
          status: "pendente"
        });

      if (error) throw error;

      toast.success("Solicitação de saque enviada com sucesso!");
      navigate("/affiliate/dashboard");
    } catch (error) {
      console.error("Error submitting withdrawal:", error);
      toast.error("Erro ao solicitar saque");
    } finally {
      setSubmitting(false);
    }
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
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/affiliate/dashboard")}
            className="mb-4"
          >
            ← Voltar ao Dashboard
          </Button>
          <h1 className="text-3xl font-bold mb-2">Solicitar Saque</h1>
          <p className="text-muted-foreground">
            Saldo disponível: R$ {balance.toFixed(2)}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados para Saque</CardTitle>
            <CardDescription>
              Preencha os dados da sua chave PIX. O saque será processado manualmente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pixName">Nome Completo</Label>
                <Input
                  id="pixName"
                  type="text"
                  placeholder="Seu nome completo"
                  value={formData.pixName}
                  onChange={(e) => setFormData({ ...formData, pixName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pixKey">Chave PIX</Label>
                <Input
                  id="pixKey"
                  type="text"
                  placeholder="CPF, e-mail, telefone ou chave aleatória"
                  value={formData.pixKey}
                  onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Valor do Saque (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="20"
                  max={balance}
                  placeholder="20.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Valor mínimo: R$ 20,00 | Máximo: R$ {balance.toFixed(2)}
                </p>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Informações Importantes:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• O saque será processado manualmente em até 5 dias úteis</li>
                  <li>• Você receberá uma notificação quando o pagamento for aprovado</li>
                  <li>• Certifique-se de que os dados do PIX estão corretos</li>
                </ul>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={submitting || balance < 20}
              >
                {submitting ? "Enviando..." : "Solicitar Saque"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
