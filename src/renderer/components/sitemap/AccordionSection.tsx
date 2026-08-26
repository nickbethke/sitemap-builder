import {ChevronDown} from 'lucide-react';
import {type ReactNode, useState} from 'react';

type AccordionSectionProps = {
    title: string;
    children: ReactNode;
    defaultOpen?: boolean;
};

export function AccordionSection({
    title,
    children,
    defaultOpen = false,
}: AccordionSectionProps) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <details
            className="group mb-0 overflow-hidden border-b border-border bg-[hsl(var(--panel))]"
            open={open}
            onToggle={(event) => setOpen(event.currentTarget.open)}
        >
            <summary className="flex min-h-10 cursor-pointer select-none list-none items-center justify-between px-3 text-[10px] font-bold uppercase tracking-wider text-foreground hover:bg-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring group-open:border-b group-open:border-border [&::-webkit-details-marker]:hidden">
                <span>{title}</span>
                <ChevronDown className="text-muted-foreground transition-transform group-open:rotate-180" size={15} aria-hidden="true"/>
            </summary>
            <div className="flex flex-col gap-3 px-3 py-3.5">
                {children}
            </div>
        </details>
    );
}
