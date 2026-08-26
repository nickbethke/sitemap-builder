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
                    className="card-menu-trigger"
                    aria-label="Kachelaktionen"
                    title="Kachelaktionen"
                    onClick={(event) => event.stopPropagation()}
                >
                    <MoreHorizontal size={16}/>
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="card-context-menu"
                    sideOffset={5}
                    align="end"
                    onClick={(event) => event.stopPropagation()}
                >
                    <DropdownMenu.Item
                        className="card-context-menu-item"
                        onSelect={onAddChild}
                    >
                        <Plus size={14}/>
                        Unterseite erstellen
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                        className="card-context-menu-item"
                        onSelect={onDuplicate}
                    >
                        <Copy size={14}/>
                        Duplizieren
                    </DropdownMenu.Item>

                    <DropdownMenu.Separator className="card-context-menu-separator"/>

                    <DropdownMenu.Item
                        className="card-context-menu-item"
                        disabled={!canMoveUp}
                        onSelect={onMoveUp}
                    >
                        <ArrowUp size={14}/>
                        Nach oben sortieren
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                        className="card-context-menu-item"
                        disabled={!canMoveDown}
                        onSelect={onMoveDown}
                    >
                        <ArrowDown size={14}/>
                        Nach unten sortieren
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                        className="card-context-menu-item"
                        disabled={!canMoveUpLevel}
                        onSelect={onMoveUpLevel}
                    >
                        <CornerLeftUp size={14}/>
                        Eine Ebene hoch
                    </DropdownMenu.Item>

                    <DropdownMenu.Separator className="card-context-menu-separator"/>

                    <DropdownMenu.Item
                        className="card-context-menu-item destructive"
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
