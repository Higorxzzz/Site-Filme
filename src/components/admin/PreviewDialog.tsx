import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface PreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any;
}

export function PreviewDialog({ open, onOpenChange, item }: PreviewDialogProps) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item.title}</DialogTitle>
          <DialogDescription>
            Preview do item - TMDB ID: {item.tmdb_id}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {item.poster_url && (
            <img 
              src={item.poster_url} 
              alt={item.title}
              className="w-full max-w-sm mx-auto rounded-lg shadow-lg"
            />
          )}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={item.type === 'movie' ? 'default' : 'secondary'}>
                {item.type === 'movie' ? 'Filme' : 'Série'}
              </Badge>
              <Badge variant={item.published ? 'default' : 'outline'}>
                {item.published ? 'Publicado' : 'Não Publicado'}
              </Badge>
              {item.last_check_status && (
                <Badge variant={
                  item.last_check_status === 'ok' ? 'default' :
                  item.last_check_status === 'not_found' ? 'destructive' :
                  'secondary'
                }>
                  {item.last_check_status}
                </Badge>
              )}
            </div>
            {item.seasons && item.type === 'series' && (
              <p className="text-sm text-muted-foreground">
                {item.seasons} temporada{item.seasons > 1 ? 's' : ''}
              </p>
            )}
            <div className="space-y-1">
              <h4 className="font-semibold text-sm">Sinopse</h4>
              <p className="text-sm text-muted-foreground">{item.synopsis || 'Sem sinopse'}</p>
            </div>
            {item.last_check_message && (
              <div className="space-y-1">
                <h4 className="font-semibold text-sm">Último Check</h4>
                <p className="text-sm text-muted-foreground">{item.last_check_message}</p>
                {item.last_check_date && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.last_check_date).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
