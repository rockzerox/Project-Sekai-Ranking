
import React from 'react';
import { 
    getUnitOptions, 
    getBannerOptions, 
    getEventTypeOptions, 
    getStoryTypeOptions, 
    getCardTypeOptions,
    getFourStarOptions
} from '../../constants';
import Select from './Select';

export interface EventFilterState {
    unit: string;
    banner: string;
    type: string;
    storyType: string;
    cardType: string;
    fourStar: string; // 新增
}

interface EventFilterGroupProps {
    filters: EventFilterState;
    onFilterChange: (newFilters: EventFilterState) => void;
    showUnit?: boolean;
    showBanner?: boolean;
    showEventType?: boolean;
    showStoryType?: boolean;
    showCardType?: boolean;
    showFourStar?: boolean; // 新增
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
    showFourStar = true, // 預設顯示
    mode = 'multi',
    compact = false,
    containerClassName = "flex flex-wrap gap-2 items-center",
    itemClassName = "min-w-[100px] sm:w-auto"
}) => {
    const handleSingleChange = (key: keyof EventFilterState, value: string) => {
        if (mode === 'exclusive') {
            onFilterChange({
                unit: 'all',
                banner: 'all',
                type: 'all',
                storyType: 'all',
                cardType: 'all',
                fourStar: 'all',
                [key]: value
            });
        } else {
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
                    options={getUnitOptions(compact ? '團體' : '團體')}
                />
            )}

            {showBanner && (
                <Select
                    className={`py-1.5 text-xs ${itemClassName}`}
                    value={filters.banner}
                    onChange={(val) => handleSingleChange('banner', val)}
                    options={getBannerOptions(compact ? 'Banner' : 'Banner')}
                />
            )}

            {showFourStar && (
                <Select
                    className={`py-1.5 text-xs ${itemClassName}`}
                    value={filters.fourStar}
                    onChange={(val) => handleSingleChange('fourStar', val)}
                    options={getFourStarOptions(compact ? '四星' : '四星')}
                />
            )}

            {showEventType && (
                <Select
                    className={`py-1.5 text-xs ${itemClassName}`}
                    value={filters.type}
                    onChange={(val) => handleSingleChange('type', val)}
                    options={getEventTypeOptions(compact ? '類型' : '活動類型')}
                />
            )}

            {showStoryType && (
                <Select
                    className={`py-1.5 text-xs ${itemClassName}`}
                    value={filters.storyType}
                    onChange={(val) => handleSingleChange('storyType', val)}
                    options={getStoryTypeOptions(compact ? '劇情' : '劇情')}
                />
            )}

            {showCardType && (
                <Select
                    className={`py-1.5 text-xs ${itemClassName}`}
                    value={filters.cardType}
                    onChange={(val) => handleSingleChange('cardType', val)}
                    options={getCardTypeOptions(compact ? '卡池' : '卡池')}
                />
            )}
        </div>
    );
};

export default EventFilterGroup;
