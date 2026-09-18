import { useState } from "react";
import { File, Image, Download, X, Eye } from "lucide-react";
import { getFileUrl } from "@/lib/notifications";

type Attachment = {
  id: string;
  name: string;
  mimeType: string;
  date: string;
  size: string;
};

function isImage(mimeType: string) {
  return mimeType.startsWith("image/");
}

function isPdf(mimeType: string) {
  return mimeType === "application/pdf";
}

export function FileViewer({ attachments }: { attachments: Attachment[] }) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const preview = attachments.find((a) => a.id === previewId);

  return (
    <>
      <ul className="space-y-2 text-sm">
        {attachments.map((a) => (
          <li
            key={a.id}
            className="glass-soft flex items-center justify-between gap-3 rounded-2xl px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-2">
              {isImage(a.mimeType) ? (
                <Image className="size-4 shrink-0 text-primary" />
              ) : (
                <File className="size-4 shrink-0 text-muted-foreground" />
              )}
              <span className="truncate">{a.name}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs text-muted-foreground">{a.size}</span>
              {(isImage(a.mimeType) || isPdf(a.mimeType)) ? (
                <button
                  className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => setPreviewId(a.id)}
                  title="عرض"
                >
                  <Eye className="size-4" />
                </button>
              ) : null}
              <a
                className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                href={getFileUrl(a.id)}
                download={a.name}
                target="_blank"
                rel="noreferrer"
              >
                <Download className="size-4" />
              </a>
            </div>
          </li>
        ))}
      </ul>

      {preview ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewId(null)}
        >
          <button
            className="absolute right-4 top-4 grid size-10 place-items-center rounded-xl bg-white/10 text-white hover:bg-white/20"
            onClick={() => setPreviewId(null)}
          >
            <X className="size-5" />
          </button>
          <div className="max-h-full max-w-4xl overflow-auto" onClick={(e) => e.stopPropagation()}>
            {isImage(preview.mimeType) ? (
              <img
                src={getFileUrl(preview.id)}
                alt={preview.name}
                className="max-h-[90vh] w-auto rounded-xl"
              />
            ) : isPdf(preview.mimeType) ? (
              <iframe
                src={getFileUrl(preview.id)}
                title={preview.name}
                className="h-[85vh] w-full rounded-xl bg-white"
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
