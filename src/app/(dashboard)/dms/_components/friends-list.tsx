"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckIcon, MessageCircleIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function PendingFriendsList() {
  const friends = useQuery(api.functions.friend.listPending);
  const updateStatus = useMutation(api.functions.friend.updateStatus);

  return (
    <div className="flex flex-col divide-y">
      <h2 className="text-xs font-medium text-muted-foreground p-2.5">
        Pending Friends
      </h2>
      {friends?.length === 0 && (
        <FriendsListEmpty>
          {"You don't have any friend requests yet."}
        </FriendsListEmpty>
      )}
      {friends?.map((friend, index) => (
        <FriendItem
          key={index}
          username={friend.user.username}
          image={friend.user.image}
        >
          <IconButton
            title="Accept"
            icon={<CheckIcon />}
            className="bg-green-100"
            onClick={() =>
              updateStatus({ id: friend._id, status: "accepting" })
            }
          />
          <IconButton
            title="Reject"
            icon={<XIcon />}
            className="bg-red-100"
            onClick={() => updateStatus({ id: friend._id, status: "rejected" })}
          />
        </FriendItem>
      ))}
    </div>
  );
}

export function AcceptedFriendsList() {
  const friends = useQuery(api.functions.friend.listAccepted);
  const updateStatus = useMutation(api.functions.friend.updateStatus);
  const createDirectMessage = useMutation(api.functions.dm.create);
  const router = useRouter();

  const handleCreateDM = async (username: string) => {
    try {
      const id = await createDirectMessage({
        username: username,
      });
      router.push(`/dms/${id}`);
    } catch (error) {
      toast.error("Failed to create direct message", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  return (
    <div className="flex flex-col divide-y">
      <h2 className="text-xs font-medium text-muted-foreground p-2.5">
        Accepted Friends
      </h2>
      {friends?.length === 0 && (
        <FriendsListEmpty>{"You don't have any friends yet."}</FriendsListEmpty>
      )}
      {friends?.map((friend, index) => (
        <FriendItem
          key={index}
          username={friend.user.username}
          image={friend.user.image}
        >
          <IconButton
            title="Start DM"
            icon={<MessageCircleIcon />}
            className="bg-blue-100"
            onClick={() => {
              handleCreateDM(friend.user.username);
            }}
          />
          <IconButton
            title="Remove Friend"
            icon={<XIcon />}
            className="bg-red-100"
            onClick={() => updateStatus({ id: friend._id, status: "rejected" })}
          />
        </FriendItem>
      ))}
    </div>
  );
}

function FriendsListEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 bg-muted/50 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function IconButton({
  title,
  className,
  icon,
  onClick,
}: {
  title: string;
  className?: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className={cn("rounded-full", className)}
          variant="outline"
          size="icon"
          onClick={onClick}
        >
          {icon}
          <span className="sr-only">{title}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{title}</TooltipContent>
    </Tooltip>
  );
}

function FriendItem({
  username,
  image,
  children,
}: {
  username: string;
  image: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between p-2.5 gap-2.5">
      <div className="flex gap-2 5">
        <Avatar className="size-9 border">
          <AvatarImage src={image} />
          <AvatarFallback />
        </Avatar>
        <p className="text-sm font-medium">{username}</p>
      </div>
      <div className="flex items-center gap-1">{children}</div>
    </div>
  );
}
