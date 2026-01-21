import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Info, User, Users, RotateCcw, PenTool, Volume2, VolumeX, Maximize, Palette, Check, Brain } from 'lucide-react';
import { colorSchemes } from '../../config/theme';

const GameHeader = ({
    theme, setTheme,
    showInfo, setShowInfo,
    boardLayout, toggleBoardLayout,
    isEditing, initializeEditor,
    userZoom, setUserZoom, showZoom, setShowZoom,
    gameMode, toggleGameMode,
    difficulty, setDifficulty,
    handleReset,
    sounds,
    showThemeModal, setShowThemeModal,
    customConfig
}) => {
    
    return (
        <div className="relative w-full flex justify-center pt-6 pb-2 lg:absolute lg:top-4 lg:left-auto lg:right-4 lg:w-auto lg:p-0 lg:justify-end z-50 flex-wrap gap-2 px-4">
             {/* Info Button */}
             <button 
                onClick={() => setShowInfo(true)}
                className={`p-2 rounded-full border transition-all shadow-sm ${theme === 'light' ? 'bg-white border-neutral-200 hover:bg-neutral-50' : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800'}`}
                title="Game Rules"
            >
                <Info size={18} />
            </button>

             {/* Board Layout Toggle */}
            <button 
                onClick={() => { toggleBoardLayout(); sounds.playClick(); }}
                className={`py-2 px-4 md:p-2 rounded-full border transition-all flex gap-2 items-center font-bold text-xs uppercase tracking-wider shadow-sm
                ${theme === 'light' 
                    ? (boardLayout !== 'standard' ? 'bg-neutral-900 text-white' : 'bg-white border-neutral-200 text-neutral-900 hover:bg-neutral-50')
                    : (boardLayout !== 'standard' ? 'bg-white text-black' : 'bg-neutral-900 border-neutral-800 text-neutral-100 hover:bg-neutral-800')}`}
                title="Toggle Board Layout"
            >
                <RefreshCw size={16} />
                <span>
                    {boardLayout === 'standard' && 'Standard'}
                    {boardLayout === 'extended' && 'Extended'}
                    {boardLayout === 'square' && 'Square'}
                    {boardLayout === 'custom' && 'Custom'}
                </span>
            </button>
           
           {/* Editor Toggle */}
           <button 
               onClick={() => { initializeEditor(); sounds.playClick(); }}
               className={`p-2 rounded-full border transition-all shadow-sm ${theme === 'light' ? 'bg-white border-neutral-200 hover:bg-neutral-50' : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800'}`}
               title="Edit Custom Board"
           >
               <PenTool size={16} />
           </button>

            {/* Zoom Control */}
            <div className="flex items-center gap-2 bg-neutral-100/50 dark:bg-neutral-800/50 rounded-full pr-1">
                <AnimatePresence>
                    {showZoom && (
                        <motion.input 
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 80, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            type="range" 
                            min="0.5" 
                            max="1.5" 
                            step="0.1"
                            value={userZoom}
                            onChange={(e) => setUserZoom(parseFloat(e.target.value))}
                            className="ml-2 accent-neutral-500 h-1 bg-neutral-300 rounded-lg appearance-none cursor-pointer"
                        />
                    )}
                </AnimatePresence>
                <button 
                   onClick={() => { setShowZoom(!showZoom); sounds.playClick(); }}
                   className={`p-2 rounded-full border transition-all shadow-sm ${theme === 'light' ? 'bg-white border-neutral-200 hover:bg-neutral-50' : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800'} ${showZoom ? 'ring-2 ring-neutral-400' : ''}`}
                   title="Zoom"
                >
                   <Maximize size={16} /> 
                </button> 
            </div>


            {/* Game Mode Toggle */}
            <button 
                onClick={() => { toggleGameMode(); sounds.playClick(); }}
                className={`py-2 px-6 md:p-2 rounded-full border transition-all flex gap-2 items-center font-bold text-xs uppercase tracking-wider shadow-sm
                ${theme === 'light' 
                    ? 'bg-white border-neutral-200 text-neutral-900 hover:bg-neutral-50' 
                    : 'bg-neutral-900 border-neutral-800 text-neutral-100 hover:bg-neutral-800'}`}
                title="Toggle Game Mode"
            >
                {gameMode === 'pvp' ? <Users size={16} /> : <User size={16} />}
                <span>{gameMode === 'pvp' ? '2 Players' : '1 Player'}</span>
            </button>

            {/* AI Difficulty Toggle (Only in PVC) */}
            {gameMode === 'pvc' && (
                <button 
                    onClick={() => { 
                        const next = difficulty === 'easy' ? 'normal' : difficulty === 'normal' ? 'hard' : 'easy';
                        setDifficulty(next);
                        sounds.playClick();
                    }}
                    className={`py-2 px-4 md:p-2 rounded-full border transition-all flex gap-2 items-center font-bold text-xs uppercase tracking-wider shadow-sm ml-2
                    ${theme === 'light' 
                        ? 'bg-white border-neutral-200 text-neutral-900 hover:bg-neutral-50' 
                        : 'bg-neutral-900 border-neutral-800 text-neutral-100 hover:bg-neutral-800'}
                    ${difficulty === 'hard' ? 'border-red-500 text-red-500' : ''}`}
                    title="AI Difficulty"
                >
                    <Brain size={16} />
                    <span className="hidden md:inline">{difficulty}</span>
                </button>
            )}

            {/* Reset Button */}
            <button 
                onClick={() => { handleReset(); sounds.playClick(); }}
                className={`py-2 px-4 md:p-2 rounded-full border transition-all flex gap-2 items-center font-bold text-xs uppercase tracking-wider shadow-sm ml-2
                ${theme === 'light' 
                    ? 'bg-white border-neutral-200 text-neutral-900 hover:bg-neutral-50' 
                    : 'bg-neutral-900 border-neutral-800 text-neutral-100 hover:bg-neutral-800'}`}
                title="Reset Game"
            >
                <RotateCcw size={16} />
                <span className="hidden md:inline">Reset</span>
            </button>

            {/* Mute Toggle */}
            <button 
                onClick={() => { sounds.toggleMute(); sounds.playClick(); }}
                className={`p-2 rounded-full border transition-all shadow-sm ml-2 ${theme === 'light' ? 'bg-white border-neutral-200 hover:bg-neutral-50' : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800'}`}
                title={sounds.isMuted ? "Unmute" : "Mute"}
            >
                {sounds.isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            {/* Theme Toggle */}
            <div className="relative">
                <button 
                    onClick={() => { setShowThemeModal(!showThemeModal); sounds.playClick(); }}
                    className={`p-2 rounded-full border transition-all shadow-sm ml-2 ${theme === 'light' ? 'bg-white border-neutral-200 hover:bg-neutral-50' : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800'}`}
                    title="Change Theme"
                >
                    <Palette size={18} />
                </button>
                
                {/* Theme Selector Dropdown/Modal */}
                <AnimatePresence>
                    {showThemeModal && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className={`absolute right-0 top-12 p-3 rounded-2xl border shadow-xl z-50 w-48
                            ${theme === 'light' ? 'bg-white border-neutral-200' : 'bg-zinc-950 border-zinc-800'}`}
                        >
                            <div className="flex flex-col gap-2">
                                {Object.keys(colorSchemes).map(schemeName => (
                                    <button
                                        key={schemeName}
                                        onClick={() => { 
                                            // Handle Theme Switch
                                            setTheme(schemeName); 
                                            // Persist (assuming localStorage handling exists or adding it)
                                            localStorage.setItem('hourglass-theme', schemeName);
                                            setShowThemeModal(false); 
                                            sounds.playPop(); 
                                        }}
                                        className={`p-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-colors
                                        ${theme === schemeName 
                                            ? (theme === 'light' ? 'bg-neutral-900 text-white' : 'bg-white text-black')
                                            : (theme === 'light' ? 'hover:bg-neutral-100 text-neutral-600' : 'hover:bg-zinc-900 text-zinc-400')}`}
                                    >
                                        {schemeName}
                                        {theme === schemeName && <Check size={14} />}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default GameHeader;
