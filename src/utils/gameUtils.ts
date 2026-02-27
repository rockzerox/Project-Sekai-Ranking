
import { CharInfo, UnitInfo } from '../types';
import { CHARACTERS, UNITS } from '../config/constants';

export const getChar = (idOrName: string): CharInfo | undefined => {
    if (CHARACTERS[idOrName]) return CHARACTERS[idOrName];
    return Object.values(CHARACTERS).find(c => c.name === idOrName);
};

export const getUnit = (idOrName: string): UnitInfo | undefined => {
    if (UNITS[idOrName]) return UNITS[idOrName];
    return Object.values(UNITS).find(u => u.name === idOrName);
};

const BASE_IMAGE_URL = "https://raw.githubusercontent.com/rockzerox/Storage/refs/heads/main/Project-Sekai-Ranking";
const BASE_ITEM_URL = "https://raw.githubusercontent.com/rockzerox/Storage/refs/heads/main/Project-Sekai-Ranking/Item";

export const getAssetUrl = (
    idOrName: string | undefined, 
    type: 'character' | 'character_full' | 'character_q' | 'unit' | 'unit_full' | 'event' | 'item'
): string | undefined => {
    if (!idOrName) return undefined;
    if (type === 'item') return `${BASE_ITEM_URL}/${idOrName}`;
    if (type === 'event') return `${BASE_IMAGE_URL}/event_logo/${idOrName}.png`;
    if (type.startsWith('character')) {
        let filename = idOrName;
        if (!idOrName.includes('-')) {
            const char = getChar(idOrName);
            if (!char) return undefined;
            filename = char.id;
        }
        if (type === 'character_full') return `${BASE_IMAGE_URL}/Chra/${filename}.webp`;
        if (type === 'character_q') return `${BASE_IMAGE_URL}/Q/${filename}.webp`;
        return `${BASE_IMAGE_URL}/Chibi/${filename}.png`;
    } 
    if (type.startsWith('unit')) {
        const unit = getUnit(idOrName);
        if (!unit || !unit.urlKey) return undefined;
        const suffix = type === 'unit_full' ? 'full_logo' : 'logo';
        return `${BASE_IMAGE_URL}/logo/${unit.urlKey}_${suffix}.png`;
    }
    return undefined;
};
