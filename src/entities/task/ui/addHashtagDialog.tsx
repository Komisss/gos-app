import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/shared/ui/dialog";
import { Checkbox } from "@/shared/ui/checkbox";
import { Badge } from "@/shared/ui/badge";
import { CircleX } from "lucide-react";
import { Button } from "@/shared/ui/button";

const TAG_COLORS = {
  check: "bg-green-bg text-green-text",
  urgent: "bg-red-bg text-red-text",
  admin: "bg-[#F3E8FF] text-[#6B21B0]",
  review: "bg-[#E2E8F0] text-[#1E293B]",
};
const TAGS = ["check", "urgent", "admin", "review"];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (tags: string[]) => void;
  onClose: () => void;
  setOpen: (open: boolean) => void;
};

export function AddTagDialog({open, onSave, setOpen }: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelected((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="gap-[20px] max-w-sm rounded-2xl p-[16px] [&>button]:hidden">
        <div className="absolute right-[16px] top-[16px]">
          <DialogClose asChild>
            <button className="hover:bg-muted rounded-full">
              <CircleX size={24}/>
            </button>
          </DialogClose>
        </div>
        <DialogHeader>
          <DialogTitle className="text-center !text-title-1 !text-[16px] !font-semibold">
            Add hashtag
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-[16px] mt-2">
          {TAGS.map((tag) => (
            <div
              key={tag}
              className="flex items-center justify-between"
            >
              <Badge className={TAG_COLORS[tag]}>
                #{tag}
              </Badge>

              <Checkbox
                checked={selected.includes(tag)}
                onCheckedChange={() => toggleTag(tag)}
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}