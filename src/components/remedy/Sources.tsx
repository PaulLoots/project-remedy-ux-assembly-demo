"use client";

interface Source {
  name: string;
  url: string;
  note?: string;
}

interface SourcesProps {
  sources: Source[];
}

export function Sources({ sources }: SourcesProps) {
  return (
    <div className="flex flex-col gap-2.5 px-5 py-3 w-full">
      <p className="font-normal text-sm text-black/60">Sources</p>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {sources.map((source, index) => (
          <a
            key={index}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-2 bg-black/5 p-2 rounded-lg shrink-0 w-[280px] hover:bg-black/10 transition-colors"
          >
            <div className="flex gap-2 items-start">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-base text-black leading-tight line-clamp-2">
                  {source.name}
                </p>
                {source.note && (
                  <p className="font-normal text-sm text-black/70 leading-tight line-clamp-2 mt-1">
                    {source.note}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-1 items-center">
              <div className="w-4 h-4 rounded bg-black/10 flex items-center justify-center">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 10.5H2C1.72386 10.5 1.5 10.2761 1.5 10V2C1.5 1.72386 1.72386 1.5 2 1.5H5V2.5H2.5V9.5H9.5V7H10.5V10C10.5 10.2761 10.2761 10.5 10 10.5Z"
                    fill="currentColor"
                  />
                  <path
                    d="M7 1.5V2.5H8.793L5.146 6.146L5.854 6.854L9.5 3.207V5H10.5V1.5H7Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <p className="font-normal text-xs text-black/70 truncate">
                {new URL(source.url).hostname.replace("www.", "")}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
