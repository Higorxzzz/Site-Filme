import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Crown, Trash2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const VipManagementSection = () => {
  const [testPaymentEnabled, setTestPaymentEnabled] = useState(false);
  const [vipDurationDays, setVipDurationDays] = useState(30);
  const [vipPrice, setVipPrice] = useState(19.90);
  const [vipUsers, setVipUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [savingDuration, setSavingDuration] = useState(false);
  const [savingPrice, setSavingPrice] = useState(false);

  useEffect(() => {
    loadVipSettings();
    loadVipUsers();
  }, []);

  const loadVipSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('vip_settings')
        .select('test_payment_enabled, vip_duration_days, vip_price')
        .single();

      if (error) throw error;
      setTestPaymentEnabled(data.test_payment_enabled);
      setVipDurationDays(data.vip_duration_days);
      setVipPrice(data.vip_price);
    } catch (error) {
      console.error('Error loading VIP settings:', error);
    }
  };

  const loadVipUsers = async () => {
    setRefreshing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('vip-admin', {
        body: { action: 'list_vip_users' },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (response.error) throw response.error;
      setVipUsers(response.data.users || []);
    } catch (error) {
      console.error('Error loading VIP users:', error);
      toast.error('Erro ao carregar usuários VIP');
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleTestPayment = async (checked: boolean) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('vip-admin', {
        body: { 
          action: 'toggle_test_payment', 
          testPaymentEnabled: checked 
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (response.error) throw response.error;

      setTestPaymentEnabled(checked);
      toast.success(checked ? 'Pagamento de teste ativado' : 'Pagamento de teste desativado');
    } catch (error) {
      console.error('Error toggling test payment:', error);
      toast.error('Erro ao alterar configuração');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDuration = async () => {
    if (vipDurationDays < 1) {
      toast.error('A duração deve ser no mínimo 1 dia');
      return;
    }

    setSavingDuration(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('vip-admin', {
        body: { 
          action: 'update_vip_duration', 
          vipDurationDays 
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (response.error) throw response.error;

      toast.success('Duração do VIP atualizada com sucesso');
    } catch (error) {
      console.error('Error updating VIP duration:', error);
      toast.error('Erro ao atualizar duração do VIP');
    } finally {
      setSavingDuration(false);
    }
  };

  const handleSavePrice = async () => {
    if (vipPrice < 0.01) {
      toast.error('O preço deve ser maior que zero');
      return;
    }

    setSavingPrice(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('vip-admin', {
        body: { 
          action: 'update_vip_price', 
          vipPrice 
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (response.error) throw response.error;

      toast.success('Preço do VIP atualizado com sucesso');
    } catch (error) {
      console.error('Error updating VIP price:', error);
      toast.error('Erro ao atualizar preço do VIP');
    } finally {
      setSavingPrice(false);
    }
  };

  const handleRemoveVip = async (userId: string, userEmail: string) => {
    if (!confirm(`Tem certeza que deseja remover o VIP de ${userEmail}?`)) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('vip-admin', {
        body: { 
          action: 'remove_vip', 
          userId 
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (response.error) throw response.error;

      toast.success('VIP removido com sucesso');
      loadVipUsers();
    } catch (error) {
      console.error('Error removing VIP:', error);
      toast.error('Erro ao remover VIP');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              Gerenciamento VIP
            </CardTitle>
            <CardDescription>
              Configure o sistema de pagamento e gerencie usuários VIP
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadVipUsers}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Payment Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="test-payment">Pagamento de Teste</Label>
            <p className="text-sm text-muted-foreground">
              Quando ativado, os pagamentos são aprovados automaticamente
            </p>
          </div>
          <Switch
            id="test-payment"
            checked={testPaymentEnabled}
            onCheckedChange={handleToggleTestPayment}
            disabled={loading}
          />
        </div>

        {/* VIP Duration Field */}
        <div className="p-4 border rounded-lg space-y-4">
          <div className="space-y-1">
            <Label htmlFor="vip-duration">Duração do VIP (dias)</Label>
            <p className="text-sm text-muted-foreground">
              Quantos dias o VIP ficará ativo após a ativação
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              id="vip-duration"
              type="number"
              min="1"
              value={vipDurationDays}
              onChange={(e) => setVipDurationDays(parseInt(e.target.value) || 1)}
              className="max-w-[200px]"
            />
            <Button 
              onClick={handleSaveDuration}
              disabled={savingDuration}
            >
              {savingDuration ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>

        {/* VIP Price Field */}
        <div className="p-4 border rounded-lg space-y-4">
          <div className="space-y-1">
            <Label htmlFor="vip-price">Preço do VIP (R$)</Label>
            <p className="text-sm text-muted-foreground">
              Valor mensal do plano VIP
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              id="vip-price"
              type="number"
              min="0.01"
              step="0.01"
              value={vipPrice}
              onChange={(e) => setVipPrice(parseFloat(e.target.value) || 0.01)}
              className="max-w-[200px]"
            />
            <Button 
              onClick={handleSavePrice}
              disabled={savingPrice}
            >
              {savingPrice ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>

        {/* VIP Users List */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Usuários VIP ({vipUsers.length})</h3>
          
          {vipUsers.length === 0 ? (
            <div className="text-center p-8 border rounded-lg border-dashed">
              <Crown className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Nenhum usuário VIP no momento</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vipUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{user.email}</p>
                      <Badge variant="default" className="text-xs">
                        VIP
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Expira em: {format(new Date(user.vip_expires_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveVip(user.id, user.email)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remover VIP
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};