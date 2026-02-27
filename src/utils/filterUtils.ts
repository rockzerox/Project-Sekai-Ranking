
import { UNIT_ORDER, UNIT_MASTER, CHARACTER_MASTER } from '../config/constants';

export const getUnitOptions = (allLabel: string | null = '團體') => {
    const options = UNIT_ORDER.filter(id => id !== "99").map(id => ({ value: id, label: UNIT_MASTER[id].name }));
    return allLabel ? [{ value: 'all', label: allLabel }, ...options] : options;
};

export const getBannerOptions = (allLabel: string | null = 'Banner') => {
    const options = Object.values(CHARACTER_MASTER).slice(0, 26).map(char => ({ 
        value: char.id, 
        label: char.name,
        style: { color: char.color }
    }));
    return allLabel ? [{ value: 'all', label: allLabel }, ...options] : options;
};

export const getFourStarOptions = (allLabel: string | null = '四星') => {
    const options = Object.values(CHARACTER_MASTER).slice(0, 26).map(char => ({ 
        value: char.id, 
        label: char.name,
        style: { color: char.color }
    }));
    return allLabel ? [{ value: 'all', label: allLabel }, ...options] : options;
};

export const getEventTypeOptions = (allLabel: string | null = '活動類型') => {
    const options = [{ value: 'marathon', label: '馬拉松' }, { value: 'cheerful_carnival', label: '歡樂嘉年華' }, { value: 'world_link', label: 'World Link' }];
    return allLabel ? [{ value: 'all', label: allLabel }, ...options] : options;
};

export const getStoryTypeOptions = (allLabel: string | null = '劇情') => {
    const options = [{ value: 'unit_event', label: '箱活' }, { value: 'mixed_event', label: '混活' }, { value: 'world_link', label: 'World Link' }];
    return allLabel ? [{ value: 'all', label: allLabel }, ...options] : options;
};

export const getCardTypeOptions = (allLabel: string | null = '卡池類型') => {
    const options = [{ value: 'permanent', label: '常駐' }, { value: 'limited', label: '限定' }, { value: 'special_limited', label: '特殊限定' }];
    return allLabel ? [{ value: 'all', label: allLabel }, ...options] : options;
};
