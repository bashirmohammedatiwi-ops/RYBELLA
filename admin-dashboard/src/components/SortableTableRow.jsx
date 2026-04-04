import { TableRow, TableCell } from '@mui/material';
import { DragIndicator as DragIcon } from '@mui/icons-material';

/** صف قابل للسحب - استخدمه مع array وقم بإعادة الترتيب واستدعاء onReorder */
export default function SortableTableRow({ item, index, isDragging, onDragStart, onDragOver, onDrop, onDragEnd, children, ...rowProps }) {
  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    onDragStart?.(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (fromIndex !== index) onDrop?.(fromIndex, index);
  };

  return (
    <TableRow
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={() => onDragEnd?.()}
      sx={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
        '&:active': { cursor: 'grabbing' },
      }}
      {...rowProps}
    >
      {children}
    </TableRow>
  );
}

export function DragHandleCell({ sx, ...props }) {
  return (
    <TableCell sx={{ width: 40, py: 0, cursor: 'grab', verticalAlign: 'middle', ...sx }} {...props}>
      <DragIcon fontSize="small" sx={{ color: 'text.secondary' }} />
    </TableCell>
  );
}
