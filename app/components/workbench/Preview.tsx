import { memo, useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { IconButton } from '~/components/ui/IconButton';
import { workbenchStore } from '~/lib/stores/workbench';
import { PortDropdown } from './PortDropdown';
import { ScreenshotSelector } from './ScreenshotSelector';
import type { ElementInfo } from './Inspector';

interface PreviewProps {
  setSelectedElement?: (element: ElementInfo | null) => void;
}

export const Preview = memo(({ setSelectedElement }: PreviewProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [isPortDropdownOpen, setIsPortDropdownOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hasSelectedPreview = useRef(false);
  const previews = useStore(workbenchStore.previews);
  const activePreview = previews[activePreviewIndex];
  const [displayPath, setDisplayPath] = useState('/');
  const [iframeUrl, setIframeUrl] = useState<string | undefined>();
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isInspectorMode, setIsInspectorMode] = useState(false);

  useEffect(() => {
    if (!activePreview) {
      setIframeUrl(undefined);
      setDisplayPath('/');
      return;
    }

    const { baseUrl } = activePreview;
    setIframeUrl(baseUrl);
    setDisplayPath('/');
  }, [activePreview]);

  useEffect(() => {
    if (previews.length > 1 && !hasSelectedPreview.current) {
      hasSelectedPreview.current = true;
    }
  }, [previews]);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  const toggleInspectorMode = () => {
    setIsInspectorMode((prev) => !prev);
  };

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !isInspectorMode) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'ELEMENT_CLICKED' && setSelectedElement) {
        setSelectedElement(event.data.element);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isInspectorMode, setSelectedElement]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !isInspectorMode) return;

    const injectScript = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return;

        const existingScript = iframeDoc.getElementById('inspector-script');
        if (existingScript) return;

        const script = iframeDoc.createElement('script');
        script.id = 'inspector-script';
        script.textContent = `
          (function() {
            let highlightedElement = null;
            let highlightOverlay = null;

            function createOverlay() {
              if (highlightOverlay) return highlightOverlay;
              highlightOverlay = document.createElement('div');
              highlightOverlay.style.cssText = 'position: absolute; pointer-events: none; border: 2px solid #6D28D9; background: rgba(109, 40, 217, 0.1); z-index: 999999; transition: all 0.1s;';
              document.body.appendChild(highlightOverlay);
              return highlightOverlay;
            }

            function updateOverlay(element) {
              const overlay = createOverlay();
              const rect = element.getBoundingClientRect();
              overlay.style.top = rect.top + window.scrollY + 'px';
              overlay.style.left = rect.left + window.scrollX + 'px';
              overlay.style.width = rect.width + 'px';
              overlay.style.height = rect.height + 'px';
              overlay.style.display = 'block';
            }

            function hideOverlay() {
              if (highlightOverlay) {
                highlightOverlay.style.display = 'none';
              }
            }

            document.addEventListener('mouseover', (e) => {
              if (e.target !== highlightOverlay) {
                highlightedElement = e.target;
                updateOverlay(e.target);
              }
            });

            document.addEventListener('mouseout', () => {
              hideOverlay();
            });

            document.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (highlightedElement) {
                const element = highlightedElement;
                const computedStyle = window.getComputedStyle(element);
                window.parent.postMessage({
                  type: 'ELEMENT_CLICKED',
                  element: {
                    tagName: element.tagName,
                    className: element.className,
                    id: element.id,
                    styles: {
                      color: computedStyle.color,
                      backgroundColor: computedStyle.backgroundColor,
                      fontSize: computedStyle.fontSize,
                      fontFamily: computedStyle.fontFamily,
                      padding: computedStyle.padding,
                      margin: computedStyle.margin,
                      border: computedStyle.border,
                      display: computedStyle.display,
                    }
                  }
                }, '*');
              }
            }, true);
          })();
        `;
        iframeDoc.body.appendChild(script);
      } catch (error) {
        console.error('Failed to inject inspector script:', error);
      }
    };

    iframe.addEventListener('load', injectScript);
    injectScript();

    return () => {
      iframe.removeEventListener('load', injectScript);
    };
  }, [isInspectorMode]);

  const openInNewTab = () => {
    if (iframeUrl) {
      window.open(iframeUrl, '_blank');
    }
  };

  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-bolt-elements-background-depth-1' : ''}`}>
      <div className="flex items-center gap-1.5 border-b border-bolt-elements-borderColor px-4 py-2 bg-bolt-elements-background-depth-2">
        <PortDropdown
          activePreviewIndex={activePreviewIndex}
          setActivePreviewIndex={setActivePreviewIndex}
          isDropdownOpen={isPortDropdownOpen}
          setIsDropdownOpen={setIsPortDropdownOpen}
          previews={previews}
        />

        <div className="flex items-center gap-1 flex-1 min-w-0">
          <div className="i-ph:globe-simple text-lg text-bolt-elements-textTertiary" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-bolt-elements-textPrimary focus:outline-none text-sm px-2 py-1 rounded-md hover:bg-bolt-elements-background-depth-3 focus:bg-bolt-elements-background-depth-3"
            type="text"
            value={displayPath}
            onChange={(e) => setDisplayPath(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && activePreview) {
                const targetPath = displayPath.startsWith('/') ? displayPath : `/${displayPath}`;
                const fullUrl = activePreview.baseUrl + targetPath;
                setIframeUrl(fullUrl);
                setDisplayPath(targetPath);

                if (inputRef.current) {
                  inputRef.current.blur();
                }
              }
            }}
            disabled={!activePreview}
          />
        </div>

        <div className="flex items-center gap-2">
          <IconButton
            icon="i-ph:cursor-click"
            onClick={toggleInspectorMode}
            className={
              isInspectorMode ? 'bg-bolt-elements-background-depth-3 !text-bolt-elements-item-contentAccent' : ''
            }
            title={isInspectorMode ? 'Disable Element Inspector' : 'Enable Element Inspector'}
          />
          <IconButton
            icon={isFullscreen ? 'i-ph:arrows-in' : 'i-ph:arrows-out'}
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
          />
          <IconButton
            icon="i-ph:arrow-square-out"
            onClick={openInNewTab}
            title="Open in New Tab"
            disabled={!activePreview}
          />
        </div>
      </div>

      <div className="flex-1 border-t border-bolt-elements-borderColor flex justify-center items-center overflow-auto">
        <div
          style={{
            width: '100%',
            height: '100%',
            overflow: 'auto',
            background: 'var(--bolt-elements-background-depth-1)',
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {activePreview ? (
            <>
              <iframe
                ref={iframeRef}
                title="preview"
                className="border-none w-full h-full bg-bolt-elements-background-depth-1"
                src={iframeUrl}
                sandbox="allow-scripts allow-forms allow-popups allow-modals allow-storage-access-by-user-activation allow-same-origin"
                allow="geolocation; ch-ua-full-version-list; cross-origin-isolated; screen-wake-lock; publickey-credentials-get; shared-storage-select-url; ch-ua-arch; bluetooth; compute-pressure; ch-prefers-reduced-transparency; deferred-fetch; usb; ch-save-data; publickey-credentials-create; shared-storage; deferred-fetch-minimal; run-ad-auction; ch-ua-form-factors; ch-downlink; otp-credentials; payment; ch-ua; ch-ua-model; ch-ect; autoplay; camera; private-state-token-issuance; accelerometer; ch-ua-platform-version; idle-detection; private-aggregation; interest-cohort; ch-viewport-height; local-fonts; ch-ua-platform; midi; ch-ua-full-version; xr-spatial-tracking; clipboard-read; gamepad; display-capture; keyboard-map; join-ad-interest-group; ch-width; ch-prefers-reduced-motion; browsing-topics; encrypted-media; gyroscope; serial; ch-rtt; ch-ua-mobile; window-management; unload; ch-dpr; ch-prefers-color-scheme; ch-ua-wow64; attribution-reporting; fullscreen; identity-credentials-get; private-state-token-redemption; hid; ch-ua-bitness; storage-access; sync-xhr; ch-device-memory; ch-viewport-width; picture-in-picture; magnetometer; clipboard-write; microphone"
              />
              <ScreenshotSelector
                isSelectionMode={isSelectionMode}
                setIsSelectionMode={setIsSelectionMode}
                containerRef={iframeRef}
              />
            </>
          ) : (
            <div className="flex w-full h-full justify-center items-center bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary">
              No preview available
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
