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
            className="inspector-accordion"
            open={open}
            onToggle={(event) => setOpen(event.currentTarget.open)}
        >
            <summary>
                <span>{title}</span>
                <ChevronDown size={15} aria-hidden="true"/>
            </summary>
            <div className="accordion-content">
                {children}
            </div>
        </details>
    );
}
