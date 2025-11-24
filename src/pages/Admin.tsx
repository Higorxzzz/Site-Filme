import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, PlusCircle, RefreshCw, Trash2, Film, Tv, CheckCircle2, XCircle, LogOut, BarChart3, Settings, Crown, Users } from "lucide-react";
import { ItemsTable } from "@/components/admin/ItemsTable";
import { AddItemDialog } from "@/components/admin/AddItemDialog";
import { AdSettingsSection } from "@/components/admin/AdSettingsSection";
import { VipManagementSection } from "@/components/admin/VipManagementSection";
import { UserManagementSection } from "@/components/admin/UserManagementSection";

const Admin = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalItems: 0,
    published: 0,
    movies: 0,
    series: 0
  });

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Faça login para acessar o painel.");
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchItems();
      fetchLogs();
    }
  }, [user, currentPage]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-items?page=${currentPage}`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch items');
      }

      setItems(result.items || []);
      setTotalPages(result.pagination?.totalPages || 1);

      // Calculate stats
      const allItems = result.items || [];
      setStats({
        totalItems: allItems.length,
        published: allItems.filter((i: any) => i.published).length,
        movies: allItems.filter((i: any) => i.type === 'movie').length,
        series: allItems.filter((i: any) => i.type === 'series').length
      });
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar items");
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-logs?limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        }
      );

      const result = await response.json();

      if (response.ok) {
        setLogs(result || []);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-sync`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to sync');
      }

      toast.success(`Sincronização completa: ${result.checked} checados, ${result.published} publicados, ${result.failed} falharam`);
      fetchItems();
      fetchLogs();
    } catch (error: any) {
      toast.error(error.message || "Erro ao sincronizar");
    } finally {
      setSyncing(false);
    }
  };

  const handleClearCache = async () => {
    setClearing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-cache`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to clear cache');
      }

      toast.success("Cache limpo com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao limpar cache");
    } finally {
      setClearing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Admin Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Painel Administrativo</h1>
              <p className="text-xs text-muted-foreground">Gerenciar Filmes e Séries</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">{user.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold">{stats.totalItems}</p>
                <BarChart3 className="h-8 w-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Publicados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold">{stats.published}</p>
                <CheckCircle2 className="h-8 w-8 text-green-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Filmes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold">{stats.movies}</p>
                <Film className="h-8 w-8 text-blue-500/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Séries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold">{stats.series}</p>
                <Tv className="h-8 w-8 text-purple-500/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleClearCache} disabled={clearing}>
              {clearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Limpar Cache
            </Button>
            <Button variant="outline" onClick={handleSync} disabled={syncing}>
              {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Sincronizar
            </Button>
          </div>
          <Button onClick={() => setAddDialogOpen(true)} size="lg">
            <PlusCircle className="mr-2 h-5 w-5" />
            Adicionar Item
          </Button>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="items" className="w-full">
          <TabsList className="grid w-full max-w-3xl grid-cols-5 mb-6">
            <TabsTrigger value="items" className="gap-2">
              <Film className="h-4 w-4" />
              Items de Mídia
            </TabsTrigger>
            <TabsTrigger value="ad-settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Config. Anúncios
            </TabsTrigger>
            <TabsTrigger value="vip" className="gap-2">
              <Crown className="h-4 w-4" />
              VIP
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle>Gerenciar Items de Mídia</CardTitle>
                <CardDescription>
                  Adicione, verifique e publique filmes e séries na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <ItemsTable items={items} onRefresh={fetchItems} />
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-4">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          Anterior
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Página {currentPage} de {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Próxima
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ad-settings">
            <AdSettingsSection />
          </TabsContent>

          <TabsContent value="vip">
            <VipManagementSection />
          </TabsContent>

          <TabsContent value="users">
            <UserManagementSection />
          </TabsContent>

          <TabsContent value="logs">
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle>Logs de Atividade</CardTitle>
                <CardDescription>
                  Histórico completo de ações administrativas no sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {logs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum log encontrado
                    </p>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="flex items-start justify-between border-b pb-2 last:border-0">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {log.action}
                            {log.media_items?.title && ` - ${log.media_items.title}`}
                          </p>
                          {log.message && (
                            <p className="text-xs text-muted-foreground">{log.message}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString('pt-BR')}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded ${
                            log.status === 'success' ? 'bg-green-100 text-green-800' :
                            log.status === 'error' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {log.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <AddItemDialog 
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={fetchItems}
      />
    </div>
  );
};

export default Admin;
