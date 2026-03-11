export const calculateTooltipPosition = (
    targetRect: DOMRect,
    tooltipWidth: number,
    tooltipHeight: number,
    offset: number = 5
) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 預設顯示在目標上方正中央
    let left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
    let top = targetRect.top - tooltipHeight - offset;

    // 檢查水平邊界：如果超出右邊界，往左推；如果超出左邊界，往右推
    if (left + tooltipWidth > viewportWidth - offset) {
        left = viewportWidth - tooltipWidth - offset;
    }
    if (left < offset) {
        left = offset;
    }

    // 檢查垂直邊界：如果上方空間不足，改為顯示在下方
    if (top < offset) {
        top = targetRect.bottom + offset;
        
        // 如果下方空間也不足 (Tooltip 太高)，則強制貼齊視窗底部
        if (top + tooltipHeight > viewportHeight - offset) {
            top = Math.max(offset, viewportHeight - tooltipHeight - offset);
        }
    }

    return { left: `${left}px`, top: `${top}px` };
};
