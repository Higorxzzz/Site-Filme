import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAffiliateTracking } from "@/hooks/useAffiliateTracking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const { getStoredRefCode, clearStoredRefCode } = useAffiliateTracking();

  // Redireciona se usuário já está logado
  useEffect(() => {
    if (!authLoading && user) {
      navigate(redirectTo);
    }
  }, [user, authLoading, navigate, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);

    // Buscar código de referência do localStorage ou cookie
    const refCode = getStoredRefCode();
    console.log('🔍 Código de referência ao criar conta:', refCode);

    const { data, error } = await signUp(email, password);

    if (error) {
      toast.error("Erro ao criar conta: " + error.message);
      setLoading(false);
      return;
    }

    // Se houver código de referência, processar via edge function
    if (refCode && data?.user) {
      try {
        console.log(`💾 Tentando registrar signup com ref=${refCode} para usuário ${data.user.id}`);
        
        // Aguardar um pouco para garantir que o perfil foi criado pelo trigger
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Chamar edge function para registrar o signup
        const { data: trackData, error: trackError } = await supabase.functions.invoke('affiliate-track', {
          body: {
            action: 'signup',
            affiliateCode: refCode,
            userId: data.user.id
          }
        });

        if (trackError) {
          console.error('❌ Erro ao registrar signup:', trackError);
        } else {
          console.log('✅ Signup registrado com sucesso:', trackData);
          
          // Verificar se foi realmente salvo
          const { data: verifyProfile } = await supabase
            .from('profiles')
            .select('referred_by')
            .eq('id', data.user.id)
            .single();
          
          console.log('🔍 Verificação final - referred_by no banco:', verifyProfile?.referred_by);
        }

        // Limpar o código armazenado após processar
        clearStoredRefCode();
        console.log('🗑️ Código de referência limpo do storage');
      } catch (error) {
        console.error('❌ Erro ao processar indicação:', error);
      }
    } else {
      console.log('ℹ️ Nenhum código de referência encontrado no signup');
    }

    toast.success("Conta criada com sucesso!");
    navigate(redirectTo);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Cadastro</CardTitle>
          <CardDescription>Crie sua conta para acessar o sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Conta
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Já tem uma conta?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Faça login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
