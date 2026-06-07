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
          className="w-full rounded-lg object-cover border border-gray-200 hover:opacity-90 transition"
          style={{ maxHeight: 160 }}
        />
      </a>
    );
  }

  // PDF hoặc file khác
  return (
    <a href={url} target="_blank" rel="noreferrer"
      className={`flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 hover:border-blue-300 transition ${className}`}>
      <FileText size={16} className="text-blue-500 shrink-0" />
      <span className="text-xs text-gray-700 truncate">{fileName ?? 'Xem tài liệu'}</span>
    </a>
  );
}
