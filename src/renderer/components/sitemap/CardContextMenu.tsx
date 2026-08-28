import {Button} from '@/components/ui/button.tsx';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import {useTranslation} from '@/lib/i18n/context.tsx';
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
    const {t} = useTranslation();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 text-muted-foreground data-[state=open]:bg-accent data-[state=open]:text-primary"
                    aria-label={t('cardMenu.aria')}
                    title={t('cardMenu.aria')}
                    onClick={(event) => event.stopPropagation()}
                >
                    <MoreHorizontal/>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                className="min-w-48 text-xs"
                sideOffset={5}
                align="end"
                onClick={(event) => event.stopPropagation()}
            >
                <DropdownMenuGroup>
                    <DropdownMenuItem className="text-xs" onSelect={onAddChild}>
                        <Plus/>
                        {t('cardMenu.addChild')}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-xs" onSelect={onDuplicate}>
                        <Copy/>
                        {t('cardMenu.duplicate')}
                    </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator/>

                <DropdownMenuGroup>
                    <DropdownMenuItem className="text-xs" disabled={!canMoveUp} onSelect={onMoveUp}>
                        <ArrowUp/>
                        {t('cardMenu.moveUp')}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-xs" disabled={!canMoveDown} onSelect={onMoveDown}>
                        <ArrowDown/>
                        {t('cardMenu.moveDown')}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-xs" disabled={!canMoveUpLevel} onSelect={onMoveUpLevel}>
                        <CornerLeftUp/>
                        {t('cardMenu.moveUpLevel')}
                    </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator/>

                <DropdownMenuGroup>
                    <DropdownMenuItem
                        className="text-xs text-destructive focus:text-destructive"
                        disabled={!canDelete}
                        onSelect={onDelete}
                    >
                        <Trash2/>
                        {t('cardMenu.delete')}
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
