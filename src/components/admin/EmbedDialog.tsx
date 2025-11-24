import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface EmbedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any;
}

export function EmbedDialog({ open, onOpenChange, item }: EmbedDialogProps) {
  if (!item) return null;

  const embedUrl = item.embed_url || (item.type === 'movie' 
    ? `https://primevicio.lat/api/stream/movies/${item.tmdb_id}`
    : `https://primevicio.lat/api/stream/series/${item.tmdb_id}/1/1`);

  const embedCode = `<iframe src="${embedUrl}" width="100%" height="500" frameborder="0" allowfullscreen></iframe>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    toast.success("Código copiado!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manual Embed - {item.title}</DialogTitle>
          <DialogDescription>
            Preview e código do iframe para incorporação
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <div className="aspect-video">
              <iframe 
                src={embedUrl} 
                className="w-full h-full rounded-md"
                frameBorder="0"
                allowFullScreen
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Código do Iframe</label>
              <Button size="sm" variant="outline" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            </div>
            <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
              {embedCode}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
