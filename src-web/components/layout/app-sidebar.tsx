import { Link } from "@tanstack/react-router";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupAction,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarSeparator,
} from "~/ui/sidebar";
import { ModeToggle } from "~/components/mode-toggle";

import IconAdd from "~icons/lucide/plus";
import IconChevronRight from "~icons/lucide/chevron-right";
import IconDelete from "~icons/lucide/trash";
import IconHome from "~icons/lucide/home";
import IconSearch from "~icons/lucide/search";
import IconSettings from "~icons/lucide/settings";

import { usePlatformLayout } from "~/hooks/use-platform";

const privateNotes = [
    { id: "1", title: "My First Note", emoji: "📝" },
    { id: "2", title: "Project Ideas", emoji: "💡" },
    { id: "3", title: "Meeting Notes", emoji: "📋" },
    { id: "4", title: "Reading List", emoji: "📚" },
];

type AppSidebarProps = {
    activeNoteId?: string;
    onNoteSelect?: (noteId: string) => void;
    onNewNote?: () => void;
}

export function AppSidebar({
    activeNoteId = "1",
    onNoteSelect,
    onNewNote,
}: AppSidebarProps) {
    const layout = usePlatformLayout();

    return (
        <Sidebar
            collapsible="offcanvas"
            className="border-r-0"
            style={{
                top: layout.titlebarHeight,
                height: `calc(100vh - ${layout.titlebarHeight}px)`,
            }}
        >
            <SidebarContent
                className="overflow-x-hidden"
                style={{ paddingTop: layout.isMac ? layout.titlebarHeight : undefined }}
            >
                <SidebarGroup className="py-2">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <Link to="/">
                                    <SidebarMenuButton tooltip="Home">
                                        <IconHome className="size-4" />
                                        <span>Home</span>
                                    </SidebarMenuButton>
                                </Link>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton tooltip="Search">
                                    <IconSearch className="size-4" />
                                    <span>Search</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarSeparator />

                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs text-muted-foreground">
                        Pages
                    </SidebarGroupLabel>
                    <SidebarGroupAction title="New Page" onClick={onNewNote}>
                        <IconAdd className="size-4" />
                        <span className="sr-only">New Page</span>
                    </SidebarGroupAction>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {privateNotes.map((note) => (
                                <SidebarMenuItem key={note.id}>
                                    <SidebarMenuButton
                                        onClick={() => onNoteSelect?.(note.id)}
                                        isActive={activeNoteId === note.id}
                                        tooltip={note.title}
                                        className="group/note"
                                    >
                                        <span>{note.emoji}</span>
                                        <span className="flex-1">{note.title}</span>
                                        <IconChevronRight className="size-3 opacity-0 group-hover/note:opacity-100 transition-opacity" />
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup className="mt-auto">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton tooltip="Trash" className="text-muted-foreground">
                                    <IconDelete className="size-4" />
                                    <span>Trash</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="pb-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Settings">
                            <IconSettings className="size-4" />
                            <span>Settings</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <ModeToggle />
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}
