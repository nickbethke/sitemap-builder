import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
    ArrowDown,
    ArrowUp,
    CornerLeftUp,
    Copy,
    MoreHorizontal,
    Plus,
    Trash2,
} from 'lucide-react';

type CardContextMenuProps = {
    canDelete: boolean;
    canMoveUp: boolean;
    canMoveDown: boolean;
    canMoveUpLevel: boolean;
    onAddChild: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onMoveUpLevel: () => void;
};

const itemClass = 'flex min-h-8 cursor-default select-none items-center gap-2 rounded-md px-2 text-xs text-popover-foreground outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-40';

export function CardContextMenu({
    canDelete,
    canMoveUp,
    canMoveDown,
    canMoveUpLevel,
    onAddChild,
    onDuplicate,
    onDelete,
    onMoveUp,
    onMoveDown,
    onMoveUpLevel,
}: CardContextMenuProps) {
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    className="grid size-6 place-items-center rounded-md border-0 text-muted-foreground data-[state=open]:bg-accent data-[state=open]:text-primary"
                    aria-label="Kachelaktionen"
                    title="Kachelaktionen"
                    onClick={(event) => event.stopPropagation()}
                >
                    <MoreHorizontal size={16}/>
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="z-50 min-w-48 rounded-lg border border-border bg-popover p-1 shadow-xl"
                    sideOffset={5}
                    align="end"
                    onClick={(event) => event.stopPropagation()}
                >
                    <DropdownMenu.Item className={itemClass} onSelect={onAddChild}>
                        <Plus size={14}/>
                        Unterseite erstellen
                    </DropdownMenu.Item>
                    <DropdownMenu.Item className={itemClass} onSelect={onDuplicate}>
                        <Copy size={14}/>
                        Duplizieren
                    </DropdownMenu.Item>

                    <DropdownMenu.Separator className="m-1 h-px bg-border"/>

                    <DropdownMenu.Item className={itemClass} disabled={!canMoveUp} onSelect={onMoveUp}>
                        <ArrowUp size={14}/>
                        Nach oben sortieren
                    </DropdownMenu.Item>
                    <DropdownMenu.Item className={itemClass} disabled={!canMoveDown} onSelect={onMoveDown}>
                        <ArrowDown size={14}/>
                        Nach unten sortieren
                    </DropdownMenu.Item>
                    <DropdownMenu.Item className={itemClass} disabled={!canMoveUpLevel} onSelect={onMoveUpLevel}>
                        <CornerLeftUp size={14}/>
                        Eine Ebene hoch
                    </DropdownMenu.Item>

                    <DropdownMenu.Separator className="m-1 h-px bg-border"/>

                    <DropdownMenu.Item
                        className={`${itemClass} text-destructive`}
                        disabled={!canDelete}
                        onSelect={onDelete}
                    >
                        <Trash2 size={14}/>
                        Löschen
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
