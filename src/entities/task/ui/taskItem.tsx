import {useState} from "react";
import {SwipeableListItem, SwipeAction, TrailingActions, Type,} from "react-swipeable-list";
import {TaskCard, type TaskCardProps} from "@/entities/task/ui/taskCard";
import EditIcon from '@/entities/task/assets/icons/edit.svg'
import DeleteIcon from '@/entities/task/assets/icons/delete.svg'
import {AddTagDialog} from './addHashtagDialog'

type TaskItemProps = TaskCardProps & {
  onEdit?: (task: TaskCardProps) => void;
  onDelete?: (task: TaskCardProps) => void;
  onAddTag?: (tags: string[]) => void;
};

export function TaskItem(props: TaskItemProps) {
  const [open, setOpen] = useState(false);

  const trailingActions = () => (
    <TrailingActions>
      <SwipeAction onClick={() => props.onEdit?.(props)}>
        <div className="rounded-l-[10px] flex items-center !justify-center w-[100px] bg-yellow-bg text-yellow-text">
          <div className="flex-col items-center">
            <img src={EditIcon} alt="edit"/>
            <p>Edit</p>
          </div>
        </div>
      </SwipeAction>

      <SwipeAction onClick={() => props.onDelete?.(props)}>
        <div className="rounded-r-[10px] flex items-center !justify-center w-full bg-red-bg text-red-text">
          <div className="flex-col items-center">
            <img src={DeleteIcon} alt="delete"/>
            <p>Delete</p>
          </div>
        </div>
      </SwipeAction>
    </TrailingActions>
  );

  return (
    <>
      <SwipeableListItem threshold={0.3} listType={Type.IOS} trailingActions={trailingActions()}>
        <TaskCard
          {...props}
          actionSlot={
            <button
              onClick={() => setOpen(true)}
              className="text-sm text-blue-500"
            >
              + Tag
            </button>
          }
        />
      </SwipeableListItem>
    </>
  );
}