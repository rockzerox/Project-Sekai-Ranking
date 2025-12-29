import React, { useState, useMemo } from 'react';
import { UserProfileResponse, PastEventApiResponse } from '../types';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { getAssetUrl, CHARACTER_MASTER, UNIT_ORDER, API_BASE_URL, UNIT_MASTER, getChar } from '../constants';
import Card from './ui/Card';
import Button from './ui/Button';
import { fetchJsonWithBigInt } from '../hooks/useRankings';
import { useEventList } from '../hooks/useEventList';
import { useConfig } from '../contexts/ConfigContext';

const difficultyStyles: Record<string, string> = {
  easy: 'text-lime-600 dark:text-lime-400',    
  normal: 'text-blue-600 dark:text-blue-400',  
  hard: 'text-amber-600 dark:text-amber-400',   
  expert: 'text-rose-600 dark:text-rose-500',  
  master: 'text-purple-600 dark:text-purple-400',
  append: 'text-fuchsia-600 dark:text-fuchsia-400'
};

const DIFFICULTIES = ['easy', 'normal', 'hard', 'expert', 'master', 'append'];

const CHAR_TO_UNIT_MAP: Record<string, string> = {
    "1": "1", "2": "1", "3": "1", "4": "1",
    "5": "2", "6": "2", "7": "2", "8": "2",
    "9": "3", "10": "3", "11": "3", "12": "3",
    "13": "4", "14": "4", "15": "4", "16": "4",
    "17": "5", "18": "5", "19": "5", "20": "5",
    "21": "0", "22": "0", "23": "0", "24": "0", "25": "0", "26": "0"
};

const DUMMY_PROFILE: UserProfileResponse = {
    user: { name: '世界的居民', userId: 'XXXXXXXX', rank: 0 },
    totalPower: {
        totalPower: 0,
        basicCardTotalPower: 0,
        areaItemBonus: 0,
        characterRankBonus: 0,
        honorBonus: 0,
        mysekaiFixtureGameCharacterPerformanceBonus: 0,
        mysekaiGateLevelBonus: 0
    },
    userCharacters: [],
    userMusicDifficultyClearCount: []
};

interface HonorRecord {
    eventId: number;
    eventName: string;
    rank: number;
    score: number;
}

const PlayerProfileView: React.FC = () => {
    const { events: allEvents } = useEventList();
    const { eventDetails } = useConfig();
    const [userIdInput, setUserIdInput] = useState('');
    const [profileData, setProfileData] = useState<UserProfileResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [honorRecords, setHonorRecords] = useState<HonorRecord[]>([]);
    const [hasScanned, setHasScanned] = useState(false);
    const [honorPage, setHonorPage] = useState(1);
    
    // 排序狀態
    const [sortKey, setSortKey] = useState<'eventId' | 'score'>('eventId');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    
    const RECORDS_PER_PAGE = 5;

    const displayData = profileData || DUMMY_PROFILE;

    const handleFetchProfile = async () => {
        const input = userIdInput.trim();
        if (!input) return;
        if (!/^\d+$/.test(input)) { setError('ID 格式錯誤'); return; }

        setIsLoading(true); setError(null); setProfileData(null);
        setHasScanned(false); setHonorRecords([]); setHonorPage(1); 

        try {
            const data: UserProfileResponse = await fetchJsonWithBigInt(`${API_BASE_URL}/user/${input}/profile`);
            if (data) setProfileData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : '取得資料失敗');
        } finally {
            setIsLoading(false);
        }
    };

    const startHonorScan = async () => {
        if (!profileData || !allEvents.length) return;
        setIsScanning(true); setScanProgress(0); setHonorRecords([]);
        const targetUserId = profileData.user.userId;
        const pastEvents = allEvents.filter(e => new Date(e.closed_at) < new Date());
        const batchSize = 5;
        const results: HonorRecord[] = [];

        for (let i = 0; i < pastEvents.length; i += batchSize) {
            const batch = pastEvents.slice(i, i + batchSize);
            await Promise.all(batch.map(async (event) => {
                try {
                    const data: PastEventApiResponse = await fetchJsonWithBigInt(`${API_BASE_URL}/event/${event.id}/top100`);
                    if (data?.rankings) {
                        const entry = data.rankings.find(r => String(r.userId) === targetUserId);
                        if (entry) results.push({ eventId: event.id, eventName: event.name, rank: entry.rank, score: entry.score });
                    }
                } catch (e) {}
            }));
            setScanProgress(Math.round(((i + batch.length) / pastEvents.length) * 100));
        }
        setHonorRecords(results);
        setIsScanning(false); setHasScanned(true);
    };

    // 處理排序後的紀錄
    const sortedHonorRecords = useMemo(() => {
        return [...honorRecords].sort((a, b) => {
            const valA = a[sortKey];
            const valB = b[sortKey];
            if (sortOrder === 'desc') return valB - valA;
            return valA - valB;
        });
    }, [honorRecords, sortKey, sortOrder]);

    const paginatedHonors = useMemo(() => {
        const start = (honorPage - 1) * RECORDS_PER_PAGE;
        return sortedHonorRecords.slice(start, start + RECORDS_PER_PAGE);
    }, [sortedHonorRecords, honorPage]);

    const totalHonorPages = Math.ceil(honorRecords.length / RECORDS_PER_PAGE);

    const toggleSortKey = (key: 'eventId' | 'score') => {
        if (sortKey === key) {
            // 如果點擊相同的 Key，就切換升降冪
            setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
        } else {
            // 換 Key 時，預設一律降冪 (期數最新或分數最高)
            setSortKey(key);
            setSortOrder('desc');
        }
        setHonorPage(1);
    };

    const PowerBreakdownItem: React.FC<{ label: string, value: number }> = ({ label, value }) => (
        <div className="flex flex-col bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-800">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 mb-1 font-black uppercase tracking-tighter">{label}</span>
            <span className="font-mono font-black text-sm text-slate-800 dark:text-slate-200">{value.toLocaleString()}</span>
        </div>
    );

    return (
        <div className="w-full animate-fadeIn py-2">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 px-1">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">玩家狀態查詢 (Player Profile)</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">查詢該玩家的詳細資料、綜合力組成與歌曲通關狀況。</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <input 
                        type="text" inputMode="numeric" pattern="[0-9]*"
                        value={userIdInput} 
                        onChange={(e) => setUserIdInput(e.target.value.replace(/\D/g, ''))} 
                        onKeyDown={(e) => e.key === 'Enter' && handleFetchProfile()}
                        placeholder="輸入玩家 ID" 
                        className="w-full sm:w-[280px] px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none font-mono font-bold text-sm tracking-widest shadow-inner transition-all" 
                    />
                    <Button onClick={handleFetchProfile} disabled={isLoading || !userIdInput.trim()} variant="gradient" className="px-6 py-2 h-auto text-sm font-black whitespace-nowrap shadow-lg">查詢玩家</Button>
                </div>
            </div>

            {isLoading && <LoadingSpinner />}
            {error && <ErrorMessage message={error} />}

            <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-start transition-opacity duration-500 ${!profileData && !isLoading ? 'opacity-90' : 'opacity-100'}`}>
                
                {/* 左側：基礎資料 & 榮耀里程碑 (5/12) */}
                <div className="lg:col-span-5 flex flex-col gap-6 w-full">
                    <Card className="border-t-4 border-t-cyan-500 overflow-hidden shadow-lg">
                        <div className="flex items-center justify-between gap-4 mb-6 border-b border-slate-100 dark:border-slate-700/50 pb-5">
                            <div className="min-w-0 flex-1">
                                {/* 玩家名稱：套用 clamp 自動縮放 */}
                                <h3 
                                    className="font-black text-slate-900 dark:text-white mb-1 truncate tracking-tight leading-tight"
                                    style={{ fontSize: 'clamp(18px, 4vw, 24px)' }}
                                >
                                    {displayData.user.name}
                                </h3>
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px] font-black text-slate-500 uppercase tracking-tighter">ID: {displayData.user.userId}</div>
                            </div>
                            <div className="flex items-center gap-4 flex-shrink-0">
                                <div className="text-right">
                                    <span className="block text-[9px] text-slate-400 uppercase font-black tracking-widest">Rank</span>
                                    <span className="text-2xl font-black text-slate-800 dark:text-white font-mono">{displayData.user.rank}</span>
                                </div>
                                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                                <div className="text-right">
                                    <span className="block text-[9px] text-slate-400 uppercase font-black tracking-widest">Power</span>
                                    <span className="text-2xl font-black text-emerald-500 dark:text-emerald-400 font-mono">{displayData.totalPower.totalPower.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <PowerBreakdownItem label="表現力" value={displayData.totalPower.basicCardTotalPower} />
                            <PowerBreakdownItem label="區域道具" value={displayData.totalPower.areaItemBonus} />
                            <PowerBreakdownItem label="角色等級" value={displayData.totalPower.characterRankBonus} />
                            <PowerBreakdownItem label="稱號加成" value={displayData.totalPower.honorBonus} />
                            <PowerBreakdownItem label="家具加成" value={displayData.totalPower.mysekaiFixtureGameCharacterPerformanceBonus} />
                            <PowerBreakdownItem label="大門加成" value={displayData.totalPower.mysekaiGateLevelBonus} />
                        </div>
                    </Card>

                    {/* 榮耀里程碑 */}
                    <Card title={<div className="flex items-center gap-2 text-sm font-black"><svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>榮耀里程碑 (Glory)</div>} className="shadow-md">
                        {!profileData ? (
                            <div className="py-6 text-center px-4 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl"><p className="text-slate-400 text-[10px] font-black italic uppercase tracking-widest leading-relaxed">Top 100 歷史戰果</p></div>
                        ) : !hasScanned && !isScanning ? (
                            <div className="py-4 flex flex-col items-center justify-center">
                                <Button onClick={startHonorScan} variant="primary" className="px-8 py-2 text-xs">掃描全期數</Button>
                            </div>
                        ) : isScanning ? (
                            <div className="py-4 flex flex-col items-center">
                                <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                                <p className="text-cyan-600 dark:text-cyan-400 font-black text-sm">{scanProgress}%</p>
                            </div>
                        ) : honorRecords.length === 0 ? (
                            <div className="py-4 text-center text-slate-400 font-bold text-xs italic">尚無紀錄</div>
                        ) : (
                            <div className="space-y-4">
                                {/* 排序控制列 */}
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 scale-95 origin-left">
                                        <button 
                                            onClick={() => toggleSortKey('eventId')}
                                            className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${sortKey === 'eventId' ? 'bg-white dark:bg-slate-600 text-cyan-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                        >
                                            期數
                                        </button>
                                        <button 
                                            onClick={() => toggleSortKey('score')}
                                            className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${sortKey === 'score' ? 'bg-white dark:bg-slate-600 text-cyan-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                        >
                                            分數
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                                        className="w-7 h-7 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg text-cyan-600 dark:text-cyan-400 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 transition-colors shadow-sm"
                                    >
                                        <span className="text-lg leading-none font-black">{sortOrder === 'desc' ? '▼' : '▲'}</span>
                                    </button>
                                </div>

                                <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl">
                                    <table className="w-full text-left text-xs">
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {paginatedHonors.map((record) => {
                                                const details = eventDetails[record.eventId];
                                                const bannerChar = details ? getChar(details.banner) : null;
                                                const bannerColor = bannerChar?.color || '#94a3b8';
                                                return (
                                                    <tr key={record.eventId} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                                        <td className="px-3 py-3 w-16 md:w-20">
                                                            <span className="font-mono font-black text-[10px] md:text-slate-400 whitespace-nowrap" style={{ color: window.innerWidth < 768 ? bannerColor : undefined }}>
                                                                第 {record.eventId} 期
                                                            </span>
                                                        </td>
                                                        <td className="px-2 py-3 w-20 md:w-24">
                                                            <div className="w-16 h-8 md:w-20 md:h-10 bg-black/10 rounded overflow-hidden flex items-center justify-center">
                                                                <img src={getAssetUrl(record.eventId.toString(), 'event')} alt="logo" className="w-full h-full object-contain scale-110" />
                                                            </div>
                                                        </td>
                                                        <td className="px-2 py-3 hidden md:table-cell max-w-[100px] lg:max-w-[140px]">
                                                            {/* 桌機版活動名稱：微調 clamp 縮小並確保 leading 防止小寫字母切斷 */}
                                                            <span 
                                                                className="font-bold whitespace-nowrap overflow-hidden block transition-all leading-normal" 
                                                                style={{ 
                                                                    color: bannerColor,
                                                                    fontSize: 'clamp(9px, 1vw, 12px)',
                                                                    textOverflow: 'ellipsis'
                                                                }}
                                                            >
                                                                {record.eventName}
                                                            </span>
                                                        </td>
                                                        <td className="px-2 py-3">
                                                            {/* 名次顯示：微調桌機版大小 */}
                                                            <span 
                                                                className={`font-black font-mono whitespace-nowrap leading-normal ${record.rank <= 3 ? 'text-yellow-500' : 'text-cyan-600'}`}
                                                                style={{ fontSize: 'clamp(13px, 1.2vw, 15px)' }}
                                                            >
                                                                第 {record.rank} 名
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-3 text-right">
                                                            <span className="font-mono font-black text-[10px] md:text-[12px] text-slate-500 dark:text-slate-400">
                                                                {record.score.toLocaleString()}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                {totalHonorPages > 1 && (
                                    <div className="flex justify-center items-center gap-4 py-0.5">
                                        <button disabled={honorPage === 1} onClick={() => setHonorPage(p => p - 1)} className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 disabled:opacity-20"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg></button>
                                        <span className="text-[10px] font-black text-slate-500 font-mono">{honorPage} / {totalHonorPages}</span>
                                        <button disabled={honorPage === totalHonorPages} onClick={() => setHonorPage(p => p + 1)} className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 disabled:opacity-20"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg></button>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                </div>

                {/* 右側：角色等級 & 歌曲通關 (7/12) */}
                <div className="lg:col-span-7 flex flex-col gap-6 w-full max-w-full">
                    {/* 角色等級 */}
                    <Card 
                        title={<div className="flex items-center gap-2 font-black text-slate-800 dark:text-white uppercase tracking-tighter"><svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>角色等級</div>}
                        className="flex flex-col shadow-2xl border-t-4 border-t-purple-500"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-6">
                            {UNIT_ORDER.filter(id => id !== '99').map((unitId) => {
                                const unitInfo = UNIT_MASTER[unitId];
                                const unitChars = Object.values(CHARACTER_MASTER).filter(c => CHAR_TO_UNIT_MAP[c.id] === unitId);
                                return (
                                    <div key={unitId} className="flex flex-col bg-slate-50/50 dark:bg-slate-900/30 p-2 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5 mb-2 px-1">
                                            {getAssetUrl(unitId, 'unit') && <img src={getAssetUrl(unitId, 'unit')} alt="u" className="h-4 w-auto" />}
                                            <span className="text-[10px] font-black uppercase tracking-[0.1em]" style={{ color: unitInfo.color }}>{unitInfo.name}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {unitChars.map((char) => {
                                                const charData = displayData.userCharacters?.find(c => String(c.characterId) === char.id);
                                                const rank = charData?.characterRank || 0;
                                                const imgUrl = getAssetUrl(char.id, 'character');
                                                return (
                                                    <div 
                                                        key={char.id} 
                                                        className="flex items-center gap-2 p-1.5 rounded-xl border transition-all hover:scale-105 shadow-sm min-w-0" 
                                                        style={{ backgroundColor: `${char.color}15`, borderColor: `${char.color}30` }}
                                                    >
                                                        <div className="relative w-9 h-9 flex-shrink-0">
                                                            <img src={imgUrl} alt={char.name} className="w-full h-full rounded-full border border-white dark:border-slate-700 object-cover shadow-sm bg-white dark:bg-slate-800" />
                                                        </div>
                                                        <div className="flex flex-col min-w-0 leading-none">
                                                            <div className="text-[11px] font-black truncate tracking-tighter mb-0.5" style={{ color: char.color }}>{char.name}</div>
                                                            <div className="text-sm font-black text-slate-800 dark:text-white font-mono">Lv.{rank}</div>
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

                    {/* 歌曲通關數據 */}
                    <Card title={<div className="flex items-center gap-2 text-sm font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest"><svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>歌曲通關數據 (Music Clear)</div>} className="shadow-md">
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                            {DIFFICULTIES.map((diff) => {
                                const stat = displayData.userMusicDifficultyClearCount?.find(s => s.musicDifficultyType.toLowerCase() === diff);
                                return (
                                    <div key={diff} className="bg-slate-50 dark:bg-slate-900/50 rounded-xl px-3 py-2 border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm">
                                        <div className={`font-black uppercase text-[10px] w-12 tracking-tighter ${difficultyStyles[diff] || 'text-slate-400'}`}>{diff}</div>
                                        <div className="flex-1 flex justify-end gap-3 font-mono">
                                            <div className="flex flex-col items-end"><span className="text-[8px] text-slate-400 font-black leading-none mb-0.5">CLR</span><span className="text-[11px] font-black text-slate-700 dark:text-white leading-none">{stat?.liveClear || 0}</span></div>
                                            <div className="flex flex-col items-end"><span className="text-[8px] text-pink-500 font-black leading-none mb-0.5">FC</span><span className="text-[11px] font-black text-pink-600 dark:text-pink-400 leading-none">{stat?.fullCombo || 0}</span></div>
                                            <div className="flex flex-col items-end"><span className="text-[8px] text-yellow-500 font-black leading-none mb-0.5">AP</span><span className="text-[11px] font-black text-yellow-600 dark:text-yellow-400 leading-none">{stat?.allPerfect || 0}</span></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default PlayerProfileView;