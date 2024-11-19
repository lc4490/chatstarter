import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DropdownMenuContent,
  DropdownMenuItem,
} from "@radix-ui/react-dropdown-menu";
import { useMutation, useQuery } from "convex/react";
import { CrownIcon, EllipsisVertical } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { CreateInvite } from "./create-invite";

export function ServerMembers({ id }: { id: Id<"servers"> }) {
  const members = useQuery(api.functions.server.members, { id });
  const server = useQuery(api.functions.server.get, { id });
  const removeServerMember = useMutation(
    api.functions.server.removeServerMember
  );

  const handleRemoveMember = async (
    serverId: Id<"servers">,
    userId: Id<"users">
  ) => {
    try {
      const serverMemberId = await removeServerMember({ serverId, userId });
      console.log(serverMemberId);
      toast.success("Channel deleted");
    } catch (error) {
      toast.error("Failed to delete channel", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  return (
    <div className="flex flex-col max-w-80 w-full border-l p-4 bg-muted gap-2">
      {members?.map((member) => (
        <div
          className="flex items-center justify-between gap-4"
          key={member._id}
        >
          <div className="flex items-center gap-2">
            <Avatar className="size-8 border">
              <AvatarImage src={member.image} />
              <AvatarFallback>{member.username[0]}</AvatarFallback>
            </Avatar>
            <p className="text-sm font-medium">{member.username}</p>
          </div>
          {server?.ownerId === member._id ? (
            <CrownIcon className="text-muted-foreground" />
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <EllipsisVertical className="text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Button
                    onClick={() => {
                      handleRemoveMember(id, member._id);
                    }}
                  >
                    Remove Member
                  </Button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ))}
      <CreateInvite serverId={id} />
    </div>
  );
}
