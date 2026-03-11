
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Filter, X } from 'lucide-react';
import { getUnitOptions, getBannerOptions, getEventTypeOptions, getStoryTypeOptions, getCardTypeOptions, getFourStarOptions, getThemeOptions } from '../../utils/filterUtils';
import Select from '../../components/ui/Select';
import { UI_TEXT } from '../../config/uiText';

export interface EventFilterState {
    unit: string;
    banner: string;
    type: string;
    storyType: string;
    cardType: string;
    fourStar: string;
    theme: string;
}

interface EventFilterGroupProps {
    filters: EventFilterState;
    onFilterChange: (newFilters: EventFilterState) => void;
    showUnit?: boolean;
    showBanner?: boolean;
    showEventType?: boolean;
    showStoryType?: boolean;
    showCardType?: boolean;
    showFourStar?: boolean;
    showTheme?: boolean;
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
    showFourStar = true,
    showTheme = true,
    mode = 'multi',
    containerClassName = "flex flex-wrap gap-2 items-center",
    itemClassName = "w-full sm:w-auto"
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [localFilters, setLocalFilters] = useState<EventFilterState>(filters);
    const modalRef = useRef<HTMLDivElement>(null);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Sync local state when external filters change
    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    const handleSingleChange = (key: keyof EventFilterState, value: string) => {
        if (mode === 'exclusive') {
            setLocalFilters({
                unit: 'all',
                banner: 'all',
                type: 'all',
                storyType: 'all',
                cardType: 'all',
                fourStar: 'all',
                theme: 'all',
                [key]: value
            });
        } else {
            setLocalFilters(prev => ({
                ...prev,
                [key]: value
            }));
        }
    };

    const applyFilters = () => {
        onFilterChange(localFilters);
        setIsOpen(false);
    };

    const clearAll = () => {
        const cleared = {
            unit: 'all',
            banner: 'all',
            type: 'all',
            storyType: 'all',
            cardType: 'all',
            fourStar: 'all',
            theme: 'all'
        };
        setLocalFilters(cleared);
        onFilterChange(cleared);
        setIsOpen(false);
    };

    const removeFilter = (key: keyof EventFilterState) => {
        const updated = { ...filters, [key]: 'all' };
        setLocalFilters(updated);
        onFilterChange(updated);
    };

    // Helper to get label for active tags
    const getFilterLabel = (key: keyof EventFilterState, value: string) => {
        let options: { value: string, label: string }[] = [];
        let prefix = '';
        switch (key) {
            case 'unit': options = getUnitOptions('團體'); prefix = '團體'; break;
            case 'banner': options = getBannerOptions('Banner'); prefix = 'Banner'; break;
            case 'fourStar': options = getFourStarOptions('四星'); prefix = '四星'; break;
            case 'type': options = getEventTypeOptions('活動類型'); prefix = '類型'; break;
            case 'storyType': options = getStoryTypeOptions('劇情'); prefix = '劇情'; break;
            case 'cardType': options = getCardTypeOptions('卡池'); prefix = '卡池'; break;
            case 'theme': options = getThemeOptions('主題'); prefix = '主題'; break;
        }
        const option = options.find(o => o.value === value);
        return option ? `${prefix}: ${option.label}` : `${prefix}: ${value}`;
    };

    const activeKeys = (Object.keys(filters) as Array<keyof EventFilterState>).filter(k => filters[k] !== 'all');

    return (
        <div className={containerClassName}>
            {/* Filter Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm w-full sm:w-auto justify-center sm:justify-start"
            >
                <Filter size={16} className="text-cyan-600 dark:text-cyan-400" />
                <span>{UI_TEXT.common.filter.button}</span>
                {activeKeys.length > 0 && (
                    <span className="flex items-center justify-center bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px]">
                        {activeKeys.length}
                    </span>
                )}
            </button>

            {/* Active Tags */}
            {activeKeys.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    {activeKeys.map(key => (
                        <span key={key} className="flex items-center gap-1 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 px-2 py-1 rounded-md text-xs font-medium">
                            {getFilterLabel(key, filters[key])}
                            <button onClick={() => removeFilter(key)} className="hover:text-cyan-900 dark:hover:text-cyan-100 focus:outline-none ml-1">
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isOpen && createPortal(
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn"
                    onClick={() => setIsOpen(false)}
                >
                    <div 
                        ref={modalRef} 
                        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Filter size={18} className="text-cyan-500" />
                                {UI_TEXT.common.filter.button}
                            </h3>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-5 space-y-4 overflow-y-auto flex-1">
                            {showUnit && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">團體 (Unit)</label>
                                    <Select
                                        className={`w-full py-2 text-sm ${itemClassName}`}
                                        value={localFilters.unit}
                                        onChange={(val) => handleSingleChange('unit', val)}
                                        options={getUnitOptions('全部團體')}
                                    />
                                </div>
                            )}

                            {showBanner && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Banner 角色</label>
                                    <Select
                                        className={`w-full py-2 text-sm ${itemClassName}`}
                                        value={localFilters.banner}
                                        onChange={(val) => handleSingleChange('banner', val)}
                                        options={getBannerOptions('全部角色')}
                                    />
                                </div>
                            )}

                            {showFourStar && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">四星成員</label>
                                    <Select
                                        className={`w-full py-2 text-sm ${itemClassName}`}
                                        value={localFilters.fourStar}
                                        onChange={(val) => handleSingleChange('fourStar', val)}
                                        options={getFourStarOptions('全部成員')}
                                    />
                                </div>
                            )}

                            {showEventType && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">活動類型</label>
                                    <Select
                                        className={`w-full py-2 text-sm ${itemClassName}`}
                                        value={localFilters.type}
                                        onChange={(val) => handleSingleChange('type', val)}
                                        options={getEventTypeOptions('全部類型')}
                                    />
                                </div>
                            )}

                            {showStoryType && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">劇情類型</label>
                                    <Select
                                        className={`w-full py-2 text-sm ${itemClassName}`}
                                        value={localFilters.storyType}
                                        onChange={(val) => handleSingleChange('storyType', val)}
                                        options={getStoryTypeOptions('全部劇情')}
                                    />
                                </div>
                            )}

                            {showCardType && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">卡池類型</label>
                                    <Select
                                        className={`w-full py-2 text-sm ${itemClassName}`}
                                        value={localFilters.cardType}
                                        onChange={(val) => handleSingleChange('cardType', val)}
                                        options={getCardTypeOptions('全部卡池')}
                                    />
                                </div>
                            )}

                            {showTheme && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">主題活動</label>
                                    <Select
                                        className={`w-full py-2 text-sm ${itemClassName}`}
                                        value={localFilters.theme}
                                        onChange={(val) => handleSingleChange('theme', val)}
                                        options={getThemeOptions('全部主題')}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-3 flex-shrink-0">
                            <button
                                onClick={clearAll}
                                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                                {UI_TEXT.common.filter.clearAll}
                            </button>
                            <button
                                onClick={applyFilters}
                                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors"
                            >
                                {UI_TEXT.common.filter.apply}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default EventFilterGroup;
