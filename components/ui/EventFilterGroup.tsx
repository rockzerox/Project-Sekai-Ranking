import React from 'react';
import { 
    getUnitOptions, 
    getBannerOptions, 
    getEventTypeOptions, 
    getStoryTypeOptions, 
    getCardTypeOptions 
} from '../../constants';
import Select from './Select';

export interface EventFilterState {
    unit: string;
    banner: string;
    type: string;
    storyType: string;
    cardType: string;
}

interface EventFilterGroupProps {
    filters: EventFilterState;
    onFilterChange: (newFilters: EventFilterState) => void;
    // 配置顯示哪些篩選器
    showUnit?: boolean;
    showBanner?: boolean;
    showEventType?: boolean;
    showStoryType?: boolean;
    showCardType?: boolean;
    // 顯示模式
    mode?: 'multi' | 'exclusive';
    compact?: boolean;
    containerClassName?: string;
    itemClassName?: string;
}

const EventFilterGroup: React.FC<EventFilterGroupProps> = ({
    filters,
    onFilterChange,
    showUnit = true,
    showBanner = true,
    showEventType = true,
    showStoryType = true,
    showCardType = true,
    mode = 'multi',
    compact = false,
    containerClassName = "flex flex-wrap gap-2 items-center",
    itemClassName = "min-w-[100px] sm:w-auto"
}) => {
    const handleSingleChange = (key: keyof EventFilterState, value: string) => {
        if (mode === 'exclusive') {
            // 排他模式：設定目標值，其餘恢復為 'all'
            onFilterChange({
                unit: 'all',
                banner: 'all',
                type: 'all',
                storyType: 'all',
                cardType: 'all',
                [key]: value
            });
        } else {
            // 聯集模式：保留其餘狀態
            onFilterChange({
                ...filters,
                [key]: value
            });
        }
    };

    return (
        <div className={containerClassName}>
            {showUnit && (
                <Select
                    className={`py-1.5 text-xs ${itemClassName}`}
                    value={filters.unit}
                    onChange={(val) => handleSingleChange('unit', val)}
                    options={getUnitOptions(compact ? '團體' : '所有團體 (All Units)')}
                />
            )}

            {showBanner && (
                <Select
                    className={`py-1.5 text-xs ${itemClassName}`}
                    value={filters.banner}
                    onChange={(val) => handleSingleChange('banner', val)}
                    options={getBannerOptions(compact ? 'Banner' : '所有 Banner')}
                />
            )}

            {showEventType && (
                <Select
                    className={`py-1.5 text-xs ${itemClassName}`}
                    value={filters.type}
                    onChange={(val) => handleSingleChange('type', val)}
                    options={getEventTypeOptions(compact ? '類型' : '所有類型 (All Types)')}
                />
            )}

            {showStoryType && (
                <Select
                    className={`py-1.5 text-xs ${itemClassName}`}
                    value={filters.storyType}
                    onChange={(val) => handleSingleChange('storyType', val)}
                    options={getStoryTypeOptions(compact ? '劇情' : '所有劇情 (All Stories)')}
                />
            )}

            {showCardType && (
                <Select
                    className={`py-1.5 text-xs ${itemClassName}`}
                    value={filters.cardType}
                    onChange={(val) => handleSingleChange('cardType', val)}
                    options={getCardTypeOptions(compact ? '卡面' : '所有卡面 (All Cards)')}
                />
            )}
        </div>
    );
};

export default EventFilterGroup;