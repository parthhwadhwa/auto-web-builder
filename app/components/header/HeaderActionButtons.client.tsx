import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';

interface HeaderActionButtonsProps {
  chatStarted: boolean;
}

export function HeaderActionButtons({ chatStarted: _chatStarted }: HeaderActionButtonsProps) {
  const [activePreviewIndex] = useState(0);
  const previews = useStore(workbenchStore.previews);
  const activePreview = previews[activePreviewIndex];

  const shouldShowButtons = activePreview;

  return (
    <div className="flex items-center gap-1">
      {/* Preview indicator */}
      {shouldShowButtons && (
        <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-bolt-elements-textSecondary">
          <div className="i-ph:globe text-green-500" />
          <span>Preview Ready</span>
        </div>
      )}
    </div>
  );
}
