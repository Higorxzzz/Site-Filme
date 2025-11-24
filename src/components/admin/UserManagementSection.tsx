import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Shield, ShieldOff, Crown, Users, UserMinus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  email: string;
  created_at: string;
  is_vip: boolean;
  vip_expires_at: string | null;
  is_admin: boolean;


}

export const UserManagementSection = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingUser, setProcessingUser] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'list' })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch users');
      }

      setUsers(result.users || []);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (userId: string) => {
    setProcessingUser(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'toggle_admin', userId })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to toggle admin');
      }

      toast.success("Status de admin atualizado");
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar admin");
    } finally {
      setProcessingUser(null);
    }
  };

  const handleGrantVip = async (userId: string) => {
    setProcessingUser(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action: 'grant_vip', userId })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to grant VIP');
      }

      toast.success("VIP concedido com sucesso");
      await fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Erro ao conceder VIP");
    } finally {
      setProcessingUser(null);
    }
  };



  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle>Gerenciar Usuários</CardTitle>
        <CardDescription>
          Gerencie permissões de admin e status VIP de todos os usuários
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>VIP Expira</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((userItem) => (
                <TableRow key={userItem.id}>
                  <TableCell className="font-medium">{userItem.email}</TableCell>
                  <TableCell>
                    {new Date(userItem.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {userItem.is_admin && (
                        <Badge variant="secondary" className="gap-1">
                          <Shield className="h-3 w-3" />
                          Admin
                        </Badge>
                      )}
                      {userItem.is_vip && (
                        <Badge variant="default" className="gap-1">
                          <Crown className="h-3 w-3" />
                          VIP
                        </Badge>
                      )}

                    </div>
                  </TableCell>
                  <TableCell>
                    {userItem.is_vip && userItem.vip_expires_at
                      ? new Date(userItem.vip_expires_at).toLocaleDateString('pt-BR')
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end flex-wrap">
                      <Button
                        variant={userItem.is_admin ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => handleToggleAdmin(userItem.id)}
                        disabled={processingUser === userItem.id}
                      >
                        {processingUser === userItem.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : userItem.is_admin ? (
                          <>
                            <ShieldOff className="h-4 w-4 mr-1" />
                            Remover Admin
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4 mr-1" />
                            Tornar Admin
                          </>
                        )}
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleGrantVip(userItem.id)}
                        disabled={processingUser === userItem.id}
                      >
                        {processingUser === userItem.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Crown className="h-4 w-4 mr-1" />
                            Conceder VIP
                          </>
                        )}
                      </Button>

                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
