import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { CirclePlus } from "lucide-react";
import {AddTagDialog} from "@entities/task/ui/addHashtagDialog";
import {useState} from "react";

export type TaskCardProps = {
  icon?: React.ReactNode;
  title: string;
  description: string;
  location?: string;
  tag?: string;
  tagClassName?: string;
  date: string;
  actionSlot?: React.ReactNode; // 👈 добавили
  onAddTag?: (tags: string[]) => void;
};

export function TaskCard({
                           icon,
                           title,
                           description,
                           location,
                           tag,
                           tagClassName,
                           date,
                           onAddTag,
                         }: TaskCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card className="w-full h-full rounded-xl border border-stroke bg-card">
        <CardContent className="flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between mb-[8px]">
            <div className="flex items-center gap-2 text-title-1 font-semibold text-[20px]">
              {icon}
              {title}
            </div>
            <Button size="icon" onClick={() => setOpen(true)} variant="ghost" className="h-8 w-8 relative top-[-12px]">
              <CirclePlus size={32} />
            </Button>
          </div>

          <div className="flex flex-col gap-[8px]">
            <p className="text-[16px] text-text-1">{description}</p>
            {location && (
              <Badge
                variant="secondary"
                className="bg-location-bg text-[13px] text-accent-blue w-fit"
              >
                {location}
              </Badge>
            )}

            {tag && (
              <Badge variant="default" className={`w-fit ${tagClassName}`}>
                #{tag}
              </Badge>
            )}
          </div>

          <div className="text-[13px] text-[#475569] text-right mr-1 mb-1">
            {date}
          </div>
        </CardContent>
      </Card>
      <AddTagDialog
        open={open}
        setOpen={setOpen}
        onClose={setOpen}
        onOpenChange={setOpen}
        onSave={(tags) => {
          onAddTag?.(tags);
          setOpen(false);
        }}
      />
    </>
  );
}