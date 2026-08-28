import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion.tsx';
import {type ReactNode} from 'react';

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
    return (
        <Accordion
            type="single"
            collapsible
            defaultValue={defaultOpen ? 'content' : undefined}
            className="bg-[hsl(var(--panel))]"
        >
            <AccordionItem value="content" className="border-border">
                <AccordionTrigger className="min-h-10 px-3 py-0 text-[10px] font-bold uppercase tracking-wider hover:bg-muted/50 hover:no-underline">
                    {title}
                </AccordionTrigger>
                <AccordionContent className="flex flex-col gap-3 px-3 pb-3.5 pt-3.5">
                    {children}
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
