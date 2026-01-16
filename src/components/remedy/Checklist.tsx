"use client";

interface ChecklistProps {
  heading: string;
  items: string[];
}

export function Checklist({ heading, items }: ChecklistProps) {
  return (
    <div className="flex flex-col gap-4 p-5 w-full">
      <p className="font-semibold text-base text-black">{heading}</p>
      <ol className="list-decimal pl-6 space-y-1">
        {items.map((item, index) => (
          <li key={index} className="font-normal text-base text-black">
            {item}
          </li>
        ))}
      </ol>
    </div>
  );
}
