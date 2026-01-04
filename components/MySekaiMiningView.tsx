
import React, { useState, useMemo } from 'react';
import { UI_TEXT } from '../constants/uiText';
import { getAssetUrl } from '../constants';
import Card from './ui/Card';
import Input from './ui/Input';
import Select from './ui/Select';

// 嚴格遵守查表區間 (即使數值相同也不合併，便於維護)
const getBasePt = (power: number): { base: number; tier: number } => {
    if (power < 0) return { base: 0, tier: 0 };
    if (power <= 44999) return { base: 450, tier: 1 };
    if (power <= 89999) return { base: 490, tier: 2 };
    if (power <= 134999) return { base: 490, tier: 3 };
    if (power <= 179999) return { base: 530, tier: 4 };
    if (power <= 224999) return { base: 530, tier: 5 };
    if (power <= 269999) return { base: 640, tier: 6 };
    if (power <= 314999) return { base: 730, tier: 7 };
    if (power <= 359999) return { base: 770, tier: 8 };
    return { base: 800, tier: 9 };
};

// 樹木工具定義 (更新為遊戲內實際名稱)
const TREE_TOOLS = [
    { id: 1, dmg: 4, label: UI_TEXT.mySekaiMining.tools.normal, color: 'bg-slate-400', border: 'border-slate-500', imgs: ['normal-axe.png', 'normal-pickaxe.png'] },
    { id: 2, dmg: 5, label: UI_TEXT.mySekaiMining.tools.good, color: 'bg-blue-400', border: 'border-blue-500', imgs: ['good-axe.png', 'good-pickaxe.png'] },
    { id: 3, dmg: 7, label: UI_TEXT.mySekaiMining.tools.best, color: 'bg-purple-400', border: 'border-purple-500', imgs: ['best-axe.png', 'best-pickaxe.png'] },
    { id: 4, dmg: 8, label: UI_TEXT.mySekaiMining.tools.chainsaw, color: 'bg-pink-400', border: 'border-pink-500', imgs: ['chainsaw.png', 'drill.png'] },
];

type ReverseStrategy = 'standard' | 'partial' | 'singleTool';

const EnergyBreakdown: React.FC<{ flames: number }> = ({ flames }) => {
    if (flames <= 0) return null;
    // 無條件進位到整數火
    const total = Math.ceil(flames);
    const big = Math.floor(total / 10);
    const small = total % 10;

    return (
        <div className="flex flex-wrap items-center gap-2 mt-2 p-2.5 bg-white/50 dark:bg-black/20 rounded-lg border border-slate-100 dark:border-white/5">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold whitespace-nowrap mr-1">相當於:</span>
            {big > 0 && (
                <div className="flex items-center gap-1 bg-white/60 dark:bg-black/40 px-2 py-1 rounded border border-slate-200 dark:border-slate-700" title="Live Bonus (大)">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">LiveBonus(大)</span>
                    <img src={getAssetUrl('LiveBonus-big.png', 'item')} alt="Big" className="w-5 h-5 object-contain drop-shadow-sm" />
                    <span className="font-mono font-black text-xs text-slate-800 dark:text-white">x{big}</span>
                </div>
            )}
            {small > 0 && (
                <div className="flex items-center gap-1 bg-white/60 dark:bg-black/40 px-2 py-1 rounded border border-slate-200 dark:border-slate-700" title="Live Bonus (小)">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">LiveBonus(小)</span>
                    <img src={getAssetUrl('LiveBonus-small.png', 'item')} alt="Small" className="w-4 h-4 object-contain drop-shadow-sm" />
                    <span className="font-mono font-black text-xs text-slate-800 dark:text-white">x{small}</span>
                </div>
            )}
        </div>
    );
};

const MySekaiMiningView: React.FC = () => {
    // Global State
    const [teamPower, setTeamPower] = useState<string>('250000');
    const [eventBonus, setEventBonus] = useState<string>('250');

    // Forward Calc State (Quantities)
    const [qtyFlower, setQtyFlower] = useState<string>('1');
    const [qtySparkle, setQtySparkle] = useState<string>('1');
    const [qtyTree, setQtyTree] = useState<string>('1');

    // Reverse Calc State
    const [targetPt, setTargetPt] = useState<string>('50000');
    const [reverseStrategy, setReverseStrategy] = useState<ReverseStrategy>('standard');

    // --- Advanced Tree Simulator State ---
    const [isTreeSimExpanded, setIsTreeSimExpanded] = useState(false);
    const [treeSimQueue, setTreeSimQueue] = useState<number[]>([]);

    // 1. 計算當前基礎分
    const { base, tier } = useMemo(() => {
        const p = parseInt(teamPower) || 0;
        return getBasePt(p);
    }, [teamPower]);

    // 2. 正向計算 (Batch Mining Estimation)
    const { totals, singleScores } = useMemo(() => {
        const bonus = parseFloat(eventBonus) || 0;
        const multiplier = 1 + bonus / 100;

        const calculateSingle = (cost: number) => {
            const rawScore = base * cost * multiplier;
            let unit = 500 * cost;
            if (unit < 10) unit = 10;
            return Math.round(rawScore / unit) * unit;
        };

        const scoreFlower = calculateSingle(0.2);
        const scoreSparkle = calculateSingle(0.5);
        const scoreTree = calculateSingle(1.0);

        const nFlower = Math.max(0, parseInt(qtyFlower) || 0);
        const nSparkle = Math.max(0, parseInt(qtySparkle) || 0);
        const nTree = Math.max(0, parseInt(qtyTree) || 0);

        const totalPt = (scoreFlower * nFlower) + (scoreSparkle * nSparkle) + (scoreTree * nTree);
        const totalEnergy = (0.2 * nFlower) + (0.5 * nSparkle) + (1.0 * nTree);

        return {
            singleScores: {
                flower: scoreFlower,
                sparkle: scoreSparkle,
                tree: scoreTree
            },
            totals: {
                pt: totalPt,
                energy: totalEnergy
            }
        };
    }, [base, eventBonus, qtyFlower, qtySparkle, qtyTree]);

    // 3. 反向推算 (Strategy Planning)
    const strategyResult = useMemo(() => {
        const target = parseInt(targetPt) || 0;
        if (target <= 0) return null;

        const bonus = parseFloat(eventBonus) || 0;
        const multiplier = 1 + bonus / 100;

        // 計算 1 HP (不捨入) 與 20 HP (有捨入) 的分數
        const unitPt_1HP = (base * multiplier) / 20; 
        
        // 標準樹單次分數 (用於 Standard 與 SingleTool)
        const stdRaw = base * 1.0 * multiplier;
        const stdUnit = 500;
        const fullTreePt = Math.round(stdRaw / stdUnit) * stdUnit;

        if (fullTreePt === 0) return null;

        // --- 策略 1: Standard (標準完整採集 - F2P) ---
        if (reverseStrategy === 'standard') {
            // 計算花朵 (0.2火) 單次得分 (單位 100)
            const smallRaw = base * 0.2 * multiplier;
            const smallUnit = 100; 
            const flowerPt = Math.round(smallRaw / smallUnit) * smallUnit;

            const treeCount = Math.floor(target / fullTreePt);
            const remainder = target % fullTreePt;
            const flowerCount = flowerPt > 0 ? Math.ceil(remainder / flowerPt) : 0;
            const totalFlames = (treeCount * 1.0) + (flowerCount * 0.2);

            return {
                type: 'standard',
                totalFlames,
                tree: treeCount,
                flower: flowerCount
            };
        }

        // --- 策略 2: Partial (分段採集 - Hit & Run) ---
        if (reverseStrategy === 'partial') {
            // 情境 A: 電鋸 2 下 (16 HP) - 消耗 0.8 火 (0.05 * 16)
            // 傷害非完整採集，故不適用 500 單位捨入，直接用 1HP 分數乘倍率
            const chainsaw2HitPt = Math.floor(unitPt_1HP * 16);
            const countA = chainsaw2HitPt > 0 ? Math.ceil(target / chainsaw2HitPt) : 0;
            const energyA = countA * 0.8;

            // 情境 B: 最強斧 2 下 (14 HP) - 消耗 0.7 火 (0.05 * 14)
            const bestAxe2HitPt = Math.floor(unitPt_1HP * 14);
            const countB = bestAxe2HitPt > 0 ? Math.ceil(target / bestAxe2HitPt) : 0;
            const energyB = countB * 0.7;

            return {
                type: 'partial',
                chainsaw: { count: countA, energy: energyA },
                bestAxe: { count: countB, energy: energyB }
            };
        }

        // --- 策略 3: Single Tool (單一工具速刷) ---
        if (reverseStrategy === 'singleTool') {
            const treeCount = Math.ceil(target / fullTreePt);
            const totalFlames = treeCount * 1.0;
            // 動作數估計: 由於 Leave-2 規則，Lv4 與 Lv3 實際上都需要 4 下才能砍完 20HP
            // Lv4: 20 -> 12 -> 4 -> 2 -> 0 (4 hits)
            // Lv3: 20 -> 13 -> 6 -> 4(修正為2) -> 0 (4 hits)
            const actions = treeCount * 4; 

            return {
                type: 'singleTool',
                totalFlames,
                treeCount,
                actions
            };
        }

        return null;
    }, [base, eventBonus, targetPt, reverseStrategy]);

    // 4. 樹木模擬邏輯 (Advanced Tree Sim Logic)
    const treeSimulation = useMemo(() => {
        const unitPt = singleScores.tree / 20; // 每一滴血對應的分數
        const unitStamina = 0.05; // 每一滴血對應的體力 (20 HP = 1.0 火)
        
        let currentHP = 20;
        let totalSimPt = 0;
        let totalSimEnergy = 0;
        
        const steps: { toolId: number, actualDmg: number, stepPt: number, stepEnergy: number, startHP: number, endHP: number, color: string }[] = [];

        for (const toolId of treeSimQueue) {
            if (currentHP <= 0) break;
            const tool = TREE_TOOLS.find(t => t.id === toolId);
            if (!tool) continue;

            const dmg = tool.dmg;
            let actualDmg = dmg;

            // --- Leave-2 Rule Implementation ---
            // 如果當前 HP > 2，且這一刀會讓 HP < 2 (例如剩 4 HP，打 3 或 4)，強制讓 HP 停在 2
            if (currentHP > 2 && (currentHP - dmg) < 2) {
                actualDmg = currentHP - 2;
            } 
            // 如果當前 HP <= 2 (已進入尾刀區)，則可以打完
            else if (currentHP <= 2) {
                actualDmg = currentHP; // 傷害上限為剩餘血量
            }
            // 其他情況：正常造成傷害

            // 只有造成傷害才紀錄
            if (actualDmg > 0) {
                const stepPt = Math.floor(actualDmg * unitPt);
                const stepEnergy = actualDmg * unitStamina;
                
                steps.push({
                    toolId,
                    actualDmg,
                    stepPt,
                    stepEnergy,
                    startHP: currentHP,
                    endHP: currentHP - actualDmg,
                    color: tool.color
                });

                totalSimPt += stepPt;
                totalSimEnergy += stepEnergy;
                currentHP -= actualDmg;
            }
        }

        return {
            steps,
            remainingHP: currentHP,
            totalSimPt,
            totalSimEnergy,
            isComplete: currentHP <= 0,
            unitPt
        };
    }, [treeSimQueue, singleScores.tree]);

    const handleAddTool = (toolId: number) => {
        if (treeSimulation.remainingHP <= 0) return;
        setTreeSimQueue(prev => [...prev, toolId]);
    };

    const handleUndo = () => {
        setTreeSimQueue(prev => prev.slice(0, -1));
    };

    const handleReset = () => {
        setTreeSimQueue([]);
    };

    // 策略說明區塊的樣式與內容
    const getStrategyInfo = () => {
        switch (reverseStrategy) {
            case 'standard':
                return {
                    text: UI_TEXT.mySekaiMining.reverse.strategyInfo.standard,
                    className: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                };
            case 'partial':
                return {
                    text: UI_TEXT.mySekaiMining.reverse.strategyInfo.partial,
                    className: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                };
            case 'singleTool':
                return {
                    text: UI_TEXT.mySekaiMining.reverse.strategyInfo.singleTool,
                    className: 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                };
            default:
                return { text: '', className: '' };
        }
    };

    const info = getStrategyInfo();

    return (
        <div className="w-full animate-fadeIn py-4 pb-20">
            <div className="mb-6 px-2">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    {UI_TEXT.mySekaiMining.title}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">
                    {UI_TEXT.mySekaiMining.description}
                </p>
            </div>

            {/* Global Settings */}
            <div className="bg-slate-800 dark:bg-slate-900 rounded-2xl p-6 shadow-lg mb-6 border border-slate-700 overflow-hidden">
                <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                    {UI_TEXT.mySekaiMining.title} / Global Settings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end relative z-10">
                    <Input 
                        label={UI_TEXT.mySekaiMining.globalSettings.teamPower}
                        value={teamPower} 
                        onChange={setTeamPower} 
                        type="number"
                        className="font-mono font-bold text-lg"
                        placeholder="250000"
                    />
                    <Input 
                        label={UI_TEXT.mySekaiMining.globalSettings.eventBonus}
                        value={eventBonus} 
                        onChange={setEventBonus} 
                        type="number"
                        className="font-mono font-bold text-lg text-pink-500"
                        placeholder="250"
                    />
                    
                    {/* Real-time Base Pt Display */}
                    <div className="lg:col-span-2 flex gap-4">
                        <div className="flex-1 bg-black/20 rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center">
                            <span className="text-[10px] text-slate-400 font-black uppercase">{UI_TEXT.mySekaiMining.globalSettings.basePt}</span>
                            <span className="text-2xl font-mono font-black text-cyan-400">{base}</span>
                        </div>
                        <div className="flex-1 bg-black/20 rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center">
                            <span className="text-[10px] text-slate-400 font-black uppercase">{UI_TEXT.mySekaiMining.globalSettings.tier}</span>
                            <span className="text-2xl font-mono font-black text-emerald-400">Tier {tier}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calculation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Card: Forward Calculation (List Mode) */}
                <Card title={UI_TEXT.mySekaiMining.forward.title} className="h-full border-t-4 border-t-cyan-500">
                    <div className="flex flex-col h-full gap-4">
                        
                        {/* Table Header */}
                        <div className="grid grid-cols-[1.5fr_1fr_1fr] gap-3 px-2 border-b border-slate-200 dark:border-slate-700/50 pb-2">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{UI_TEXT.mySekaiMining.forward.headers.item}</span>
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider text-center">{UI_TEXT.mySekaiMining.forward.headers.qty}</span>
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider text-right">{UI_TEXT.mySekaiMining.forward.headers.score}</span>
                        </div>

                        {/* Items List */}
                        <div className="space-y-4 flex-1">
                            {/* Flower */}
                            <div className="grid grid-cols-[1.5fr_1fr_1fr] gap-3 items-center">
                                <div className="flex flex-col">
                                    <span className="text-xs sm:text-sm font-bold text-rose-500 dark:text-rose-400">{UI_TEXT.mySekaiMining.forward.items.flower.name}</span>
                                    <span className="text-[9px] text-slate-400 font-mono font-bold">{UI_TEXT.mySekaiMining.forward.items.flower.costLabel} 🔥</span>
                                </div>
                                <Input 
                                    value={qtyFlower} 
                                    onChange={setQtyFlower} 
                                    type="number" 
                                    className="h-8 text-center font-bold text-sm" 
                                    placeholder="0"
                                />
                                <div className="text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                                    {(singleScores.flower * Math.max(0, parseInt(qtyFlower)||0)).toLocaleString()}
                                </div>
                            </div>

                            {/* Sparkle */}
                            <div className="grid grid-cols-[1.5fr_1fr_1fr] gap-3 items-center">
                                <div className="flex flex-col">
                                    <span className="text-xs sm:text-sm font-bold text-amber-500 dark:text-amber-400">{UI_TEXT.mySekaiMining.forward.items.sparkle.name}</span>
                                    <span className="text-[9px] text-slate-400 font-mono font-bold">{UI_TEXT.mySekaiMining.forward.items.sparkle.costLabel} 🔥</span>
                                </div>
                                <Input 
                                    value={qtySparkle} 
                                    onChange={setQtySparkle} 
                                    type="number" 
                                    className="h-8 text-center font-bold text-sm"
                                    placeholder="0"
                                />
                                <div className="text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                                    {(singleScores.sparkle * Math.max(0, parseInt(qtySparkle)||0)).toLocaleString()}
                                </div>
                            </div>

                            {/* Tree with Advanced Sim Toggle */}
                            <div className="flex flex-col gap-2">
                                <div className="grid grid-cols-[1.5fr_1fr_1fr] gap-3 items-center">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">{UI_TEXT.mySekaiMining.forward.items.tree.name}</span>
                                            <button 
                                                onClick={() => setIsTreeSimExpanded(!isTreeSimExpanded)}
                                                className={`text-[9px] px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 ${isTreeSimExpanded ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
                                            >
                                                <span>Adv. Sim</span>
                                                <svg className={`w-3 h-3 transform transition-transform ${isTreeSimExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                            </button>
                                        </div>
                                        <span className="text-[9px] text-slate-400 font-mono font-bold">{UI_TEXT.mySekaiMining.forward.items.tree.costLabel} 🔥</span>
                                    </div>
                                    <Input 
                                        value={qtyTree} 
                                        onChange={setQtyTree} 
                                        type="number" 
                                        className="h-8 text-center font-bold text-sm"
                                        placeholder="0"
                                    />
                                    <div className="text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                                        {(singleScores.tree * Math.max(0, parseInt(qtyTree)||0)).toLocaleString()}
                                    </div>
                                </div>

                                {/* Advanced Tree Simulator Panel */}
                                {isTreeSimExpanded && (
                                    <div className="bg-slate-100 dark:bg-slate-800/80 rounded-lg p-3 border border-slate-200 dark:border-slate-700 animate-fadeIn text-xs">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-black text-slate-500 uppercase tracking-wider text-[10px]">Tree Mining Sim (20 HP)</span>
                                            <span className="text-[9px] text-slate-400 font-mono">1 HP ≈ {treeSimulation.unitPt.toFixed(1)} pt</span>
                                        </div>

                                        {/* Visual HP Bar (20 Grid) */}
                                        <div className="flex gap-[2px] h-4 w-full bg-slate-300 dark:bg-slate-700 rounded overflow-hidden mb-3">
                                            {Array.from({ length: 20 }, (_, i) => {
                                                const currentSlot = 20 - i; // 20, 19, ..., 1
                                                // Find which step covers this slot
                                                const step = treeSimulation.steps.find(s => currentSlot <= s.startHP && currentSlot > s.endHP);
                                                return (
                                                    <div 
                                                        key={i} 
                                                        className={`flex-1 transition-all duration-300 ${step ? step.color : 'bg-transparent'}`}
                                                        title={step ? `Dmg: ${step.actualDmg}` : `HP: ${currentSlot}`}
                                                    />
                                                );
                                            })}
                                        </div>

                                        <div className="flex justify-between items-center mb-3 px-1">
                                            <span className={`font-black font-mono ${treeSimulation.remainingHP > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                {treeSimulation.remainingHP > 0 ? `Remaining: ${treeSimulation.remainingHP} HP` : 'COMPLETED'}
                                            </span>
                                            <div className="flex gap-3 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                                                <span>{treeSimulation.totalSimEnergy.toFixed(2)} 🔥</span>
                                                <span>{treeSimulation.totalSimPt.toLocaleString()} pt</span>
                                            </div>
                                        </div>

                                        {/* Controls - Updated Layout */}
                                        <div className="flex flex-col gap-2 mb-2">
                                            <div className="grid grid-cols-4 gap-1.5">
                                                {TREE_TOOLS.map(tool => (
                                                    <button 
                                                        key={tool.id}
                                                        onClick={() => handleAddTool(tool.id)}
                                                        disabled={treeSimulation.isComplete}
                                                        className={`py-2 rounded font-bold text-white shadow-sm active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed leading-tight flex flex-col items-center justify-center relative overflow-hidden group gap-1 min-h-[60px] ${tool.color}`}
                                                    >
                                                        {/* Text Stacked Vertically */}
                                                        <span className="text-[10px] relative z-10 drop-shadow-sm">{tool.label.split('(')[0]}</span>
                                                        <span className="text-[9px] opacity-90 font-mono relative z-10 drop-shadow-sm">Dmg: {tool.dmg}</span>
                                                        
                                                        {/* Images Row */}
                                                        <div className="flex gap-1 items-center justify-center mt-0.5">
                                                            {tool.imgs.map((img, idx) => (
                                                                <img key={idx} src={getAssetUrl(img, 'item')} alt="" className="w-4 h-4 object-contain opacity-95 group-hover:scale-110 transition-transform" />
                                                            ))}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                <button onClick={handleUndo} disabled={treeSimQueue.length === 0} className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded py-1.5 font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-30">Undo</button>
                                                <button onClick={handleReset} disabled={treeSimQueue.length === 0} className="bg-slate-200 dark:bg-slate-700 text-rose-500 rounded py-1.5 font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-30">Reset</button>
                                            </div>
                                            <p className="text-[9px] text-slate-400 text-center italic">* 斧頭/十字鎬 通用此邏輯</p>
                                        </div>

                                        {/* Steps Summary */}
                                        <div className="bg-white/50 dark:bg-black/20 p-2 rounded text-[10px] font-mono text-slate-500 break-all leading-tight min-h-[1.5em]">
                                            {treeSimulation.steps.length > 0 ? (
                                                treeSimulation.steps.map((s, i) => (
                                                    <span key={i}>
                                                        {i > 0 && " -> "}
                                                        <span className="font-bold text-slate-700 dark:text-slate-300">
                                                            {TREE_TOOLS.find(t => t.id === s.toolId)?.label.split(' ')[0]}
                                                        </span>
                                                        <span className="text-slate-400">({s.stepPt})</span>
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="italic opacity-50">Select tools to simulate...</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mt-2">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{UI_TEXT.mySekaiMining.forward.summary.totalPt}</span>
                                <span className="text-2xl font-black font-mono text-cyan-600 dark:text-cyan-400">
                                    {totals.pt.toLocaleString()} <span className="text-sm text-slate-400">pt</span>
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{UI_TEXT.mySekaiMining.forward.summary.totalEnergy}</span>
                                <span className="text-sm font-black font-mono text-slate-600 dark:text-slate-300">
                                    {totals.energy.toFixed(1)} 🔥
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Right Card: Reverse Calculation */}
                <Card title={UI_TEXT.mySekaiMining.reverse.title} className="h-full border-t-4 border-t-pink-500">
                    <div className="flex flex-col h-full justify-between gap-6">
                        <div className="space-y-4">
                            <Input 
                                label={UI_TEXT.mySekaiMining.reverse.inputLabel}
                                value={targetPt}
                                onChange={setTargetPt}
                                type="number"
                                className="font-mono font-bold text-lg"
                            />
                            
                            <div className="space-y-2">
                                <Select 
                                    label={UI_TEXT.mySekaiMining.reverse.strategyLabel}
                                    value={reverseStrategy}
                                    onChange={(val) => setReverseStrategy(val as ReverseStrategy)}
                                    options={[
                                        { value: 'standard', label: UI_TEXT.mySekaiMining.reverse.strategies.standard },
                                        { value: 'partial', label: UI_TEXT.mySekaiMining.reverse.strategies.partial },
                                        { value: 'singleTool', label: UI_TEXT.mySekaiMining.reverse.strategies.singleTool },
                                    ]}
                                    className="font-bold text-sm"
                                />
                                <div className={`p-2.5 rounded-lg border text-xs font-medium leading-relaxed shadow-sm transition-colors ${info.className}`}>
                                    {info.text}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            {strategyResult && strategyResult.type === 'standard' && (
                                <>
                                    <div className="flex flex-col bg-pink-50 dark:bg-pink-900/10 p-4 rounded-xl border border-pink-100 dark:border-pink-900/30">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-pink-600 dark:text-pink-400 uppercase">{UI_TEXT.mySekaiMining.reverse.resultTotal}</span>
                                            <span className="text-2xl font-black font-mono text-pink-600 dark:text-pink-400">
                                                {strategyResult.totalFlames.toFixed(1)} <span className="text-sm">🔥</span>
                                            </span>
                                        </div>
                                        <EnergyBreakdown flames={strategyResult.totalFlames} />
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{UI_TEXT.mySekaiMining.reverse.resultCombo}</span>
                                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                            {UI_TEXT.mySekaiMining.reverse.comboTemplate
                                                .replace('{tree}', strategyResult.tree.toString())
                                                .replace('{flower}', strategyResult.flower.toString())
                                            }
                                        </div>
                                    </div>
                                </>
                            )}

                            {strategyResult && strategyResult.type === 'partial' && (
                                <div className="grid grid-cols-1 gap-2">
                                    <div className="bg-pink-50 dark:bg-pink-900/10 p-3 rounded-xl border border-pink-100 dark:border-pink-900/30">
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-pink-500 uppercase tracking-tight">[Pass] 電鋸/電鑽</span>
                                                <img src={getAssetUrl('chainsaw.png', 'item')} alt="chainsaw" className="w-5 h-5 object-contain" />
                                            </div>
                                            <span className="text-xs font-mono font-bold text-slate-500">{strategyResult.chainsaw.energy.toFixed(1)} 🔥</span>
                                        </div>
                                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                            需對 <span className="font-black text-lg">{strategyResult.chainsaw.count}</span> 棵樹分段採集
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">
                                            (每棵樹 2 下，共 {strategyResult.chainsaw.count * 2} 次動作)
                                        </div>
                                        <EnergyBreakdown flames={strategyResult.chainsaw.energy} />
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-tight">[F2P] 最強的</span>
                                                <img src={getAssetUrl('best-axe.png', 'item')} alt="axe" className="w-5 h-5 object-contain" />
                                            </div>
                                            <span className="text-xs font-mono font-bold text-slate-500">{strategyResult.bestAxe.energy.toFixed(1)} 🔥</span>
                                        </div>
                                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                            需對 <span className="font-black text-lg">{strategyResult.bestAxe.count}</span> 棵樹分段採集
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">
                                            (每棵樹 2 下，共 {strategyResult.bestAxe.count * 2} 次動作)
                                        </div>
                                        <EnergyBreakdown flames={strategyResult.bestAxe.energy} />
                                    </div>
                                </div>
                            )}

                            {strategyResult && strategyResult.type === 'singleTool' && (
                                <>
                                    <div className="flex flex-col bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-900/30">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase">需完整採集</span>
                                            <span className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
                                                {strategyResult.treeCount} <span className="text-sm">棵</span>
                                            </span>
                                        </div>
                                        <EnergyBreakdown flames={strategyResult.totalFlames} />
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <div className="flex justify-between items-center text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">動作數預估</span>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="flex items-center gap-1 bg-white/50 dark:bg-black/20 p-1 rounded">
                                                        <span className="text-[10px] text-slate-500">電鋸</span>
                                                        <img src={getAssetUrl('chainsaw.png', 'item')} alt="" className="w-4 h-4 object-contain" />
                                                    </div>
                                                    <span className="text-slate-300">/</span>
                                                    <div className="flex items-center gap-1 bg-white/50 dark:bg-black/20 p-1 rounded">
                                                        <span className="text-[10px] text-slate-500">電鑽</span>
                                                        <img src={getAssetUrl('drill.png', 'item')} alt="" className="w-4 h-4 object-contain" />
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="font-mono text-lg text-purple-600 dark:text-purple-400">約 {strategyResult.actions} 下</span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 italic text-right border-t border-slate-200 dark:border-slate-700 pt-2">
                                            * 電鋸/最強工具皆需約 {strategyResult.treeCount * 4} 次動作 (含尾刀)
                                        </div>
                                    </div>
                                </>
                            )}

                            {!strategyResult && (
                                <div className="p-4 text-center text-slate-400 text-xs font-bold italic">
                                    請輸入有效目標分數
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

            </div>
        </div>
    );
};

export default MySekaiMiningView;
