import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Info, User, Users, RotateCcw, PenTool, Volume2, VolumeX, Maximize, Palette, Check, Brain, Menu, X } from 'lucide-react';
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
    
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    // Section Component
    const MenuSection = ({ title, children }) => (
        <div className="flex flex-col gap-3 w-full">
            <h3 className={`text-[10px] font-bold tracking-widest uppercase opacity-40 ${theme === 'light' ? 'text-neutral-500' : 'text-neutral-400'} border-b ${theme === 'light' ? 'border-neutral-200' : 'border-neutral-800'} pb-1`}>
                {title}
            </h3>
            <div className="grid grid-cols-4 gap-2 justify-items-center">
                {children}
            </div>
        </div>
    );

    // Button Helper (Circular)
    const MenuBtn = ({ onClick, active, icon: Icon, label, danger }) => (
         <div className="flex flex-col items-center gap-1">
            <button 
                onClick={() => { onClick(); sounds.playClick(); }}
                className={`w-12 h-12 rounded-full border transition-all flex items-center justify-center shadow-sm
                ${active 
                    ? (theme === 'light' ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-black border-white')
                    : (theme === 'light' ? 'bg-white border-neutral-200 hover:bg-neutral-50' : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800')}
                ${danger ? 'border-red-500/20 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10' : ''}`}
                title={label}
            >
                <Icon size={20} className={active ? '' : 'opacity-70'} />
            </button>
            <span className={`text-[9px] font-bold tracking-wider uppercase text-center max-w-[60px] leading-tight ${theme === 'light' ? 'text-neutral-500' : 'text-neutral-400'}`}>
                {label}
            </span>
        </div>
    );

    return (
        <div className="relative w-full flex flex-col items-center lg:items-end pt-6 pb-2 lg:absolute lg:top-4 lg:left-auto lg:right-4 lg:w-auto lg:p-0 z-50 px-4 pointer-events-none">
             
             {/* Always Visible Control Bar */}
             <div className="flex gap-2 pointer-events-auto shadow-lg rounded-full">
                <button 
                    onClick={() => setShowInfo(true)}
                    className={`p-3 rounded-full border transition-all shadow-sm ${theme === 'light' ? 'bg-white border-neutral-200 hover:bg-neutral-50' : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800'}`}
                    title="Game Rules"
                >
                    <Info size={20} />
                </button>

                <button 
                    onClick={() => { setIsMenuOpen(!isMenuOpen); sounds.playClick(); }}
                    className={`py-2 px-5 rounded-full border transition-all shadow-sm flex items-center gap-2 font-bold uppercase tracking-widest text-xs
                    ${theme === 'light' 
                        ? (isMenuOpen ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white border-neutral-200 hover:bg-neutral-50')
                        : (isMenuOpen ? 'bg-white text-black border-white' : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800')}`}
                >
                    {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
                    <span>Menu</span>
                </button>
             </div>

             {/* Collapsible Panel */}
             <AnimatePresence>
                {isMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className={`mt-3 p-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex flex-col gap-6 w-full max-w-xs pointer-events-auto
                        ${theme === 'light' ? 'bg-white/95 border-neutral-200/50' : 'bg-neutral-950/95 border-neutral-800/50'}`}
                    >
                        {/* 1. Gameplay */}
                        <MenuSection title="Gameplay">
                            <MenuBtn 
                                onClick={toggleGameMode} 
                                icon={gameMode === 'pvp' ? Users : User} 
                                label={gameMode === 'pvp' ? 'Vs Friend' : 'Vs CPU'}
                                active={true}
                            />
                            {gameMode === 'pvc' && (
                                <MenuBtn 
                                    onClick={() => { const next = difficulty === 'easy' ? 'normal' : difficulty === 'normal' ? 'hard' : 'easy'; setDifficulty(next); }} 
                                    icon={Brain} 
                                    label={difficulty}
                                    active={difficulty === 'hard'}
                                />
                            )}
                            <MenuBtn 
                                onClick={handleReset} 
                                icon={RotateCcw} 
                                label="Reset Board"
                                danger
                            />
                        </MenuSection>

                        {/* 2. Board Options */}
                        <MenuSection title="Board & Editor">
                             <MenuBtn 
                                onClick={toggleBoardLayout} 
                                icon={RefreshCw} 
                                label={boardLayout}
                            />
                             <MenuBtn 
                                onClick={initializeEditor} 
                                icon={PenTool} 
                                label="Editor"
                            />
                        </MenuSection>

                        {/* 3. Appearance */}
                         <MenuSection title="Appearance">
                             <MenuBtn 
                                onClick={() => { sounds.toggleMute(); }} 
                                icon={sounds.isMuted ? VolumeX : Volume2} 
                                label={sounds.isMuted ? 'Muted' : 'Sound On'}
                                active={!sounds.isMuted}
                            />
                        </MenuSection>

                        {/* 4. Zoom Slider */}
                        <div className="flex flex-col gap-2 w-full px-1">
                             <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest opacity-50">
                                <span>Zoom</span>
                                <span>{Math.round(userZoom * 100)}%</span>
                            </div>
                            <input 
                                type="range" 
                                min="0.5" 
                                max="1.5" 
                                step="0.1"
                                value={userZoom}
                                onChange={(e) => setUserZoom(parseFloat(e.target.value))}
                                className={`w-full h-1.5 rounded-full appearance-none cursor-pointer ${theme === 'light' ? 'bg-neutral-200 accent-neutral-900' : 'bg-neutral-800 accent-white'}`}
                            />
                        </div>

                        {/* 5. Theme Swatches (Fix for Overflow) */}
                        <div className="flex flex-col gap-2 w-full pt-2 border-t border-neutral-200/50 dark:border-neutral-800/50">
                            <h3 className={`text-[10px] font-bold tracking-widest uppercase opacity-40 ${theme === 'light' ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                Theme
                            </h3>
                            <div className="grid grid-cols-6 gap-2">
                                {Object.keys(colorSchemes).map(scheme => (
                                    <button
                                        key={scheme}
                                        onClick={() => { 
                                            setTheme(scheme); 
                                            localStorage.setItem('hourglass-theme', scheme);
                                            sounds.playPop(); 
                                        }}
                                        className={`w-8 h-8 rounded-full border-2 transition-all shadow-sm ${colorSchemes[scheme].bg}
                                        ${theme === scheme 
                                            ? (theme === 'light' ? 'border-neutral-900 scale-110' : 'border-white scale-110') 
                                            : 'border-transparent hover:scale-105'}`}
                                        title={scheme}
                                    />
                                ))}
                            </div>
                        </div>

                    </motion.div>
                )}
             </AnimatePresence>
        </div>
    );
};

export default GameHeader;
