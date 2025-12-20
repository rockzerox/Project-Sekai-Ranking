
import React, { useState } from 'react';
import { UserProfileResponse } from '../types';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { getAssetUrl, CHARACTER_MASTER, UNIT_ORDER, API_BASE_URL, getChar } from '../constants';
import Card from './ui/Card';

const difficultyStyles: Record<string, string> = {
  easy: 'text-lime-600 dark:text-lime-400',    
  normal: 'text-blue-600 dark:text-blue-400',  
  hard: 'text-amber-600 dark:text-amber-400',   
  expert: 'text-rose-600 dark:text-rose-500',  
  master: 'text-purple-600 dark:text-purple-400',
  append: 'text-fuchsia-600 dark:text-fuchsia-400'
};

// 角色 ID 歸屬單位映射 (與 PJSK 官方數據一致)
const CHAR_TO_UNIT_MAP: Record<string, string> = {
    "1": "Leo/need", "2": "Leo/need", "3": "Leo/need", "4": "Leo/need",
    "5": "MORE MORE JUMP!", "6": "MORE MORE JUMP!", "7": "MORE MORE JUMP!", "8": "MORE MORE JUMP!",
    "9": "Vivid BAD SQUAD", "10": "Vivid BAD SQUAD", "11": "Vivid BAD SQUAD", "12": "Vivid BAD SQUAD",
    "13": "Wonderlands × Showtime", "14": "Wonderlands × Showtime", "15": "Wonderlands × Showtime", "16": "Wonderlands × Showtime",
    "17": "25點，Nightcord見。", "18": "25點，Nightcord見。", "19": "25點，Nightcord見。", "20": "25點，Nightcord見。",
    "21": "Virtual Singer", "22": "Virtual Singer", "23": "Virtual Singer", "24": "Virtual Singer", "25": "Virtual Singer", "26": "Virtual Singer"
};

const PlayerProfileView: React.FC = () => {
    const [userIdInput, setUserIdInput] = useState('');
    const [profileData, setProfileData] = useState<UserProfileResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFetchProfile = async () => {
        const input = userIdInput.trim();
        if (!input) return;
        
        if (!/^\d+$/.test(input)) {
            setError('ID 格式錯誤：請只輸入數字 (Invalid ID Format)');
            return;
        }

        setIsLoading(true);
        setError(null);
        setProfileData(null);

        try {
            const response = await fetch(`${API_BASE_URL}/user/${input}/profile`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('找不到該玩家 ID，請檢查輸入是否正確。');
                }
                throw new Error('取得玩家資料失敗，請稍後再試。');
            }
            
            const textData = await response.text();
            // 處理 BigInt 問題
            const sanitizedData = textData.replace(/"(\w*Id|id)"\s*:\s*(\d{15,})/g, '"$1": "$2"');
            const data: UserProfileResponse = JSON.parse(sanitizedData);
            
            setProfileData(data);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : '發生未知錯誤');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleFetchProfile();
        }
    };

    const PowerBreakdownItem: React.FC<{ label: string, value: number }> = ({ label, value }) => (
        <div className="flex flex-col bg-slate-50 dark:bg-slate-900/50 p-2 rounded border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">{label}</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{value.toLocaleString()}</span>
        </div>
    );

    const renderCharacterRanks = () => {
        if (!profileData?.userCharacters) return null;

        // 依照 UNIT_ORDER 過濾出非 Mix 的單位進行顯示
        return (
            <Card 
                title={
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        角色等級 (Character Rank)
                    </div>
                }
                className="mt-6"
            >
                <div className="space-y-6">
                    {UNIT_ORDER.filter(u => u !== 'Mix').map((unitName) => {
                        const unitChars = Object.values(CHARACTER_MASTER).filter(c => CHAR_TO_UNIT_MAP[c.id] === unitName);
                        if (unitChars.length === 0) return null;

                        return (
                            <div key={unitName} className="flex flex-col gap-3">
                                {/* Unit Header */}
                                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/30 pb-1">
                                    {getAssetUrl(unitName, 'unit') && (
                                        <img src={getAssetUrl(unitName, 'unit')} alt={unitName} className="h-5 w-auto object-contain" />
                                    )}
                                    <span 
                                        className="text-xs font-bold uppercase tracking-wider"
                                        style={{ color: unitChars[0].color }}
                                    >
                                        {unitName}
                                    </span>
                                </div>

                                {/* Character Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {unitChars.map((char) => {
                                        const charData = profileData.userCharacters?.find(c => String(c.characterId) === char.id);
                                        const rank = charData?.characterRank || 0;
                                        const imgUrl = getAssetUrl(char.id, 'character');

                                        return (
                                            <div key={char.id} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800/50">
                                                {imgUrl && (
                                                    <div className="relative w-10 h-10 flex-shrink-0">
                                                        <img 
                                                            src={imgUrl} 
                                                            alt={char.name} 
                                                            className="w-full h-full rounded-full border-2 object-cover"
                                                            style={{ borderColor: char.color }}
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex flex-col justify-center min-w-0">
                                                    <span 
                                                        className="text-[10px] font-bold leading-none mb-1 truncate"
                                                        style={{ color: char.color }}
                                                    >
                                                        {char.name}
                                                    </span>
                                                    <span className="text-sm font-black text-slate-700 dark:text-white leading-none font-mono">
                                                        Lv.{rank}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
        );
    };

    return (
        <div className="w-full animate-fadeIn py-4">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">玩家狀態查詢 (Player Profile)</h2>
                <p className="text-slate-500 dark:text-slate-400">輸入玩家 ID 查詢詳細資料、綜合力組成與歌曲通關狀況</p>
            </div>

            <div className="max-w-2xl mx-auto mb-10">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input 
                            type="text"
                            value={userIdInput}
                            onChange={(e) => setUserIdInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="請輸入玩家 ID (e.g., 12345678901234567)"
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all shadow-sm"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                            </svg>
                        </div>
                    </div>
                    <button 
                        onClick={handleFetchProfile}
                        disabled={isLoading || !userIdInput.trim()}
                        className={`px-6 py-3 rounded-lg font-bold text-white transition-all shadow-md ${
                            isLoading || !userIdInput.trim()
                            ? 'bg-slate-400 cursor-not-allowed'
                            : 'bg-cyan-500 hover:bg-cyan-600 hover:shadow-cyan-500/30 active:scale-95'
                        }`}
                    >
                        查詢
                    </button>
                </div>
            </div>

            {isLoading && <LoadingSpinner />}
            {error && <ErrorMessage message={error} />}

            {profileData && !isLoading && (
                <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
                    {/* User Info Card */}
                    <Card>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-100 dark:border-slate-700/50 pb-4">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                                    {profileData.user.name}
                                </h3>
                                <p className="text-sm font-mono text-slate-500 dark:text-slate-400">
                                    ID: {profileData.user.userId}
                                </p>
                            </div>
                            <div className="flex gap-6">
                                <div className="text-center">
                                    <span className="block text-xs text-slate-500 uppercase font-bold mb-1">等級 (Rank)</span>
                                    <span className="text-3xl font-bold text-slate-800 dark:text-white">{profileData.user.rank}</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-xs text-slate-500 uppercase font-bold mb-1">綜合力 (Total Power)</span>
                                    <span className="text-3xl font-bold text-emerald-500 dark:text-emerald-400">
                                        {profileData.totalPower.totalPower.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg p-4">
                            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                綜合力來源 (Total Power Breakdown)
                            </h5>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                                <PowerBreakdownItem label="表現力 (Cards)" value={profileData.totalPower.basicCardTotalPower} />
                                <PowerBreakdownItem label="區域道具 (Area)" value={profileData.totalPower.areaItemBonus} />
                                <PowerBreakdownItem label="角色等級 (Char)" value={profileData.totalPower.characterRankBonus} />
                                <PowerBreakdownItem label="稱號加成 (Honor)" value={profileData.totalPower.honorBonus} />
                                <PowerBreakdownItem label="家具加成 (Fix)" value={profileData.totalPower.mysekaiFixtureGameCharacterPerformanceBonus} />
                                <PowerBreakdownItem label="大門加成 (Gate)" value={profileData.totalPower.mysekaiGateLevelBonus} />
                            </div>
                        </div>
                    </Card>

                    {renderCharacterRanks()}

                    {/* Music Stats Card */}
                    {profileData.userMusicDifficultyClearCount && profileData.userMusicDifficultyClearCount.length > 0 && (
                        <Card 
                            title={
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                                    歌曲通關狀態 (Music Clear Status)
                                </div>
                            }
                        >
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                {profileData.userMusicDifficultyClearCount.map((stat) => (
                                    <div key={stat.musicDifficultyType} className="bg-slate-5 dark:bg-slate-700/30 rounded-lg p-3 border border-slate-100 dark:border-slate-700 flex flex-col items-center shadow-sm hover:shadow-md transition-shadow">
                                        <div className={`font-black uppercase text-sm mb-3 ${difficultyStyles[stat.musicDifficultyType] || 'text-slate-500 dark:text-slate-300'}`}>
                                            {stat.musicDifficultyType}
                                        </div>
                                        <div className="grid grid-cols-1 w-full gap-2 text-center">
                                            <div className="flex justify-between items-center bg-white dark:bg-slate-800 rounded px-2 py-1">
                                                <span className="text-[10px] text-slate-400 font-bold">C</span>
                                                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">{stat.liveClear}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-white dark:bg-slate-800 rounded px-2 py-1 border-l-2 border-pink-400">
                                                <span className="text-[10px] text-pink-400 font-bold">FC</span>
                                                <span className="text-xs font-mono font-bold text-pink-600 dark:text-pink-300">{stat.fullCombo}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-white dark:bg-slate-800 rounded px-2 py-1 border-l-2 border-yellow-400">
                                                <span className="text-[10px] text-yellow-500 font-bold">AP</span>
                                                <span className="text-xs font-mono font-bold text-yellow-600 dark:text-yellow-300">{stat.allPerfect}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
};

export default PlayerProfileView;
