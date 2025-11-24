import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CheckCircle, Eye, Edit, Trash2, Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PreviewDialog } from "./PreviewDialog";
import { EmbedDialog } from "./EmbedDialog";

interface ItemsTableProps {
  items: any[];
  onRefresh: () => void;
}

export function ItemsTable({ items, onRefresh }: ItemsTableProps) {
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [checkingItem, setCheckingItem] = useState<string | null>(null);
  const [publishingItem, setPublishingItem] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [embedItem, setEmbedItem] = useState<any>(null);

  const handleCheck = async (itemId: string) => {
    setCheckingItem(itemId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-check`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ itemId })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to check item');
      }

      toast.success(result.message || "Check realizado com sucesso!");
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer check");
    } finally {
      setCheckingItem(null);
    }
  };

  const handlePublish = async (itemId: string, currentStatus: boolean) => {
    setPublishingItem(itemId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-publish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ itemId, published: !currentStatus })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to publish item');
      }

      toast.success(!currentStatus ? "Item publicado!" : "Item despublicado!");
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Erro ao publicar/despublicar");
    } finally {
      setPublishingItem(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-items/${deleteItem.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        }
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete item');
      }

      toast.success("Item deletado com sucesso!");
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Erro ao deletar item");
    } finally {
      setDeleteItem(null);
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>TMDB ID</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Último Check</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhum item encontrado
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono">{item.tmdb_id}</TableCell>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>
                    <Badge variant={item.type === 'movie' ? 'default' : 'secondary'}>
                      {item.type === 'movie' ? 'Filme' : 'Série'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.published ? 'default' : 'outline'}>
                      {item.published ? 'Publicado' : 'Não Publicado'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.last_check_status && (
                      <Badge variant={
                        item.last_check_status === 'ok' ? 'default' :
                        item.last_check_status === 'not_found' ? 'destructive' :
                        'secondary'
                      }>
                        {item.last_check_status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCheck(item.id)}
                        disabled={checkingItem === item.id}
                      >
                        {checkingItem === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPreviewItem(item)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePublish(item.id, item.published)}
                        disabled={publishingItem === item.id || (item.last_check_status !== 'ok' && !item.published)}
                      >
                        {publishingItem === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Globe className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEmbedItem(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteItem(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar "{deleteItem?.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PreviewDialog 
        open={!!previewItem} 
        onOpenChange={(open) => !open && setPreviewItem(null)}
        item={previewItem}
      />

      <EmbedDialog 
        open={!!embedItem} 
        onOpenChange={(open) => !open && setEmbedItem(null)}
        item={embedItem}
      />
    </>
  );
}
