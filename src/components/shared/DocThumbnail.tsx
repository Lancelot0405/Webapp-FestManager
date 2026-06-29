import { Card } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface Props {
  url: string;
  fileName?: string;
  className?: string;
}

function isImage(url: string) {
  return /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url);
}

export default function DocThumbnail({ url, fileName, className = '' }: Props) {
  if (isImage(url)) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className={`block ${className}`}>
        <img
          src={url}
          alt={fileName ?? 'Tài liệu'}
          className="w-full rounded-lg object-cover hover:opacity-90 transition"
          style={{ maxHeight: 160 }}
        />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center gap-2 no-underline ${className}`}
    >
      <Card
        className="flex flex-row items-center gap-2 px-3 py-2.5 w-full bg-secondary text-secondary-foreground border-none hover:bg-secondary/80 transition"
      >
        <FileText size={16} className="text-primary shrink-0" />
        <span className="text-xs truncate">{fileName ?? 'Xem tài liệu'}</span>
      </Card>
    </a>
  );
}

