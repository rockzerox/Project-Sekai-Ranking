import React, { useState, useImperativeHandle, forwardRef, useRef, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { calculateTooltipPosition } from '../../utils/tooltipUtils';

export interface TooltipHandle {
    show: (x: number, y: number, content: React.ReactNode) => void;
    hide: () => void;
}

interface PortalTooltipProps {
    className?: string;
}

export const PortalTooltip = forwardRef<TooltipHandle, PortalTooltipProps>(({ className = '' }, ref) => {
    const [visible, setVisible] = useState(false);
    const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });
    const [content, setContent] = useState<React.ReactNode>(null);
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({ opacity: 0 });
    const tooltipRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
        show: (x, y, content) => {
            setTargetPos({ x, y });
            setContent(content);
            setVisible(true);
            setTooltipStyle({ opacity: 0 }); // Reset style for measurement
        },
        hide: () => {
            setVisible(false);
        }
    }));

    useLayoutEffect(() => {
        if (visible && tooltipRef.current) {
            const rect = tooltipRef.current.getBoundingClientRect();
            // Mock DOMRect for mouse position
            const mockRect = {
                left: targetPos.x,
                right: targetPos.x,
                top: targetPos.y,
                bottom: targetPos.y,
                width: 0,
                height: 0,
            } as DOMRect;

            const { left, top } = calculateTooltipPosition(mockRect, rect.width, rect.height, 15);
            setTooltipStyle({ left, top, opacity: 1 });
        }
    }, [visible, targetPos, content]);

    if (!visible) return null;

    return ReactDOM.createPortal(
        <div
            ref={tooltipRef}
            className={`fixed z-[9999] pointer-events-none transition-opacity duration-150 bg-slate-900/95 text-white p-3 rounded-xl shadow-2xl border border-slate-700 backdrop-blur-md ${className}`}
            style={tooltipStyle}
        >
            {content}
        </div>,
        document.body
    );
});

PortalTooltip.displayName = 'PortalTooltip';
