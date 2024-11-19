import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useMutation, useQuery } from "convex/react";
import { EllipsisVertical, TrashIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { CreateChannel } from "./create-channel";
import { Voice } from "./voice";

export function ServerSidebar({ id }: { id: Id<"servers"> }) {
  const pathname = usePathname();
  const server = useQuery(api.functions.server.get, { id: id });
  const channels = useQuery(api.functions.channels.list, { id: id });
  const removeChannel = useMutation(api.functions.channels.remove);
  const removeServer = useMutation(api.functions.server.remove);
  const router = useRouter();
  const isOwner = useQuery(api.functions.server.isOwner, { id: id });
  const leaveServer = useMutation(api.functions.server.leave);

  const handleLeaveServer = async (id: Id<"servers">) => {
    try {
      router.push("/dms/");
      await leaveServer({ id });
      toast.success("Left Server");
    } catch (error) {
      toast.error("Failed to leave server", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  const handleServerDelete = async (id: Id<"servers">) => {
    try {
      // Run both actions concurrently
      await Promise.all([router.push("/dms/"), removeServer({ id })]);

      // Notify the user after the mutation
      toast.success("Server Deleted");
    } catch (error) {
      toast.error("Failed to delete server", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  const handleChannelDelete = async (id: Id<"channels">) => {
    try {
      if (server) {
        router.push(
          `/servers/${server?._id}/channels/${server?.defaultChannelId}`
        );
      }
      await removeChannel({ id });
      toast.success("Channel deleted");
    } catch (error) {
      toast.error("Failed to delete channel", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };
  return (
    <Sidebar className="left-12">
      <SidebarHeader className="flex flex-row justify-between">
        {server?.name}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <EllipsisVertical className="text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="flex justify-center items-center">
            <DropdownMenuItem asChild>
              <Button
                variant="outline"
                className="flex items-center"
                onClick={() => {
                  if (isOwner) {
                    handleServerDelete(id);
                  } else {
                    handleLeaveServer(id);
                  }
                }}
              >
                {isOwner ? "Delete Server" : "Leave Server"}
              </Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Channels</SidebarGroupLabel>
          <CreateChannel serverId={id} />
          <SidebarGroupContent>
            <SidebarMenu>
              {channels?.map((channel) => (
                <SidebarMenuItem key={channel._id}>
                  <SidebarMenuButton
                    isActive={
                      pathname === `/servers/${id}/channels/${channel._id}`
                    }
                    asChild
                  >
                    <Link href={`/servers/${id}/channels/${channel._id}`}>
                      {channel.name}
                    </Link>
                  </SidebarMenuButton>
                  <SidebarMenuAction
                    onClick={() => handleChannelDelete(channel._id)}
                  >
                    <TrashIcon />
                  </SidebarMenuAction>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Voice serverId={id} />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
