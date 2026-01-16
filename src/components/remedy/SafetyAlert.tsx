"use client";

interface SafetyAlertProps {
  level: "informational" | "caution" | "emergency";
  title?: string;
  message: string;
}

export function SafetyAlert({ level, title, message }: SafetyAlertProps) {
  // Informational: gray bg, no border, horizontal layout
  // Caution: amber/yellow bg with amber border, vertical layout with title
  // Emergency: red/pink bg with red border, vertical layout with red title

  const containerStyles = {
    informational: "bg-black/5",
    caution: "bg-[rgba(208,139,43,0.1)] border border-[#d08b2b]",
    emergency: "bg-[rgba(255,72,72,0.1)] border border-[#ff4848]",
  };

  const iconColors = {
    informational: "text-zinc-800",
    caution: "text-zinc-800",
    emergency: "text-[#cc3939]",
  };

  const titleColors = {
    informational: "text-black",
    caution: "text-black",
    emergency: "text-[#cc3939]",
  };

  const isInformational = level === "informational";

  return (
    <div className="px-1">
      <div
        className={`px-4 py-5 rounded-3xl w-full ${containerStyles[level]} ${
          isInformational ? "flex gap-2.5 items-center" : "flex flex-col gap-2.5"
        }`}
      >
        {isInformational ? (
          // Informational: horizontal layout, icon + message inline
          <>
            <div className={`shrink-0 ${iconColors[level]}`}>
              <AlertIcon />
            </div>
            <p className="flex-1 font-normal text-sm text-black leading-normal">
              {message}
            </p>
          </>
        ) : (
          // Caution/Emergency: vertical layout with title row
          <>
            <div className="flex gap-1 items-center w-full">
              <div className={`shrink-0 ${iconColors[level]}`}>
                <AlertIcon />
              </div>
              <p className={`flex-1 font-semibold text-base ${titleColors[level]}`}>
                {title || "This could be serious"}
              </p>
            </div>
            <p className="font-normal text-sm text-black leading-normal">
              {message}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function AlertIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.57465 3.21665L1.51632 15C1.37079 15.252 1.29379 15.5377 1.29298 15.8288C1.29216 16.1198 1.36756 16.4059 1.51167 16.6588C1.65579 16.9116 1.86359 17.1223 2.11441 17.2699C2.36523 17.4174 2.65032 17.4967 2.94132 17.5H17.058C17.349 17.4967 17.6341 17.4174 17.8849 17.2699C18.1357 17.1223 18.3435 16.9116 18.4876 16.6588C18.6317 16.4059 18.7071 16.1198 18.7063 15.8288C18.7055 15.5377 18.6285 15.252 18.483 15L11.4247 3.21665C11.2761 2.97174 11.0664 2.76925 10.8163 2.62924C10.5661 2.48922 10.2841 2.41602 9.99715 2.41602C9.71025 2.41602 9.42815 2.48922 9.17802 2.62924C8.92789 2.76925 8.71825 2.97174 8.56965 3.21665H8.57465Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 7.5V10.8333"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 14.167H10.0083"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
