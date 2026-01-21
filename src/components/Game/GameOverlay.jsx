import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RefreshCw, Info } from 'lucide-react';
import { colorSchemes } from '../../config/theme';

const GameOverlay = ({
    winner, gameMode, handleReset, sounds, theme,
    showInfo, setShowInfo
}) => {
    const colors = colorSchemes[theme];

    return (
        <>
        <AnimatePresence>
            {showInfo && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowInfo(false)}
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                >
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className={`relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl shadow-2xl p-6 md:p-8 ${theme === 'light' ? 'bg-white text-neutral-900' : 'bg-neutral-900 text-white'} border ${theme === 'light' ? 'border-neutral-200' : 'border-neutral-800'}`}
                    >
                        <button 
                            onClick={() => setShowInfo(false)}
                            className="absolute top-4 right-4 p-2 opacity-50 hover:opacity-100"
                        >
                            ✕
                        </button>
                        
                        <h2 className="text-2xl font-bold mb-6 uppercase tracking-tight flex items-center gap-3">
                            <Info size={24} /> How to Play
                        </h2>
                        
                        <div className="space-y-6 text-sm md:text-base leading-relaxed opacity-90">
                            
                            <section>
                                <h3 className="font-bold uppercase tracking-wider text-xs mb-2 opacity-60">Objective</h3>
                                <p>Eliminate all opponent pieces or block them so they have no valid moves remaining.</p>
                            </section>

                            <section>
                                <h3 className="font-bold uppercase tracking-wider text-xs mb-2 opacity-60">Movement</h3>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li><strong>Player 1 (Bottom)</strong> moves UP.</li>
                                    <li><strong>Player 2 / CPU (Top)</strong> moves DOWN.</li>
                                    <li>Pieces can move one step forward or sideways along any connected line.</li>
                                    <li><strong>King:</strong> Reaching the opposite end promotes a piece to a King 👑. Kings can move and capture in <strong>any direction</strong>.</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="font-bold uppercase tracking-wider text-xs mb-2 opacity-60">Capturing</h3>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>Jump over an adjacent opponent piece into an empty spot behind it.</li>
                                    <li>Captures can be made in any direction (Forward or Backward) if a straight line exists.</li>
                                    <li><strong>Chain Jumps:</strong> If you capture a piece and land where another capture is possible, you <strong>must</strong> continue jumping.</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="font-bold uppercase tracking-wider text-xs mb-2 opacity-60">Game Modes</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                    <div className={`p-3 rounded-lg border ${theme === 'light' ? 'bg-neutral-50 border-neutral-100' : 'bg-neutral-800 border-neutral-700'}`}>
                                        <div className="font-bold text-xs uppercase mb-1">Standard</div>
                                        <div className="text-xs opacity-70">Classic Hourglass shape with 19 intersections. Traditional rules.</div>
                                    </div>
                                    <div className={`p-3 rounded-lg border ${theme === 'light' ? 'bg-neutral-50 border-neutral-100' : 'bg-neutral-800 border-neutral-700'}`}>
                                        <div className="font-bold text-xs uppercase mb-1">Extended</div>
                                        <div className="text-xs opacity-70">Adds a box frame enclosing the hourglass. Side verticals and center horizontal are valid paths.</div>
                                    </div>
                                    <div className={`p-3 rounded-lg border ${theme === 'light' ? 'bg-neutral-50 border-neutral-100' : 'bg-neutral-800 border-neutral-700'}`}>
                                        <div className="font-bold text-xs uppercase mb-1">Square</div>
                                        <div className="text-xs opacity-70">Three concentric squares connected at midpoints. A larger battlefield.</div>
                                    </div>
                                    <div className={`p-3 rounded-lg border ${theme === 'light' ? 'bg-neutral-50 border-neutral-100' : 'bg-neutral-800 border-neutral-700'}`}>
                                        <div className="font-bold text-xs uppercase mb-1">Custom</div>
                                        <div className="text-xs opacity-70">Design your own board! Place nodes and draw lines to create unique challenges.</div>
                                    </div>
                                </div>
                            </section>

                        </div>

                        <button 
                            onClick={() => setShowInfo(false)}
                            className={`w-full mt-8 py-3 font-bold rounded-lg transition-all uppercase tracking-widest text-xs
                            ${theme === 'light' ? 'bg-neutral-900 text-white hover:bg-neutral-800' : 'bg-white text-black hover:bg-neutral-200'}`}
                        >
                            Got it
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Winner Modal */}
         <AnimatePresence>
            {winner && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-md ${theme === 'light' ? 'bg-white/80' : 'bg-black/80'}`}
                >
                    <Trophy className={`w-20 h-20 mb-6 ${colors.text}`} />
                    <h2 className={`text-4xl font-bold mb-8 uppercase tracking-tight ${colors.text}`}>
                        {winner === 1 ? 'Player 1 Won' : (gameMode === 'pvc' ? 'Computer Won' : 'Player 2 Won')}
                    </h2>
                    <button 
                        onClick={() => { handleReset(); sounds.playClick(); }}
                        className={`px-8 py-3 font-bold rounded-none transition-all hover:scale-105 flex items-center gap-2 uppercase tracking-wider text-sm shadow-lg
                        ${theme === 'light' ? 'bg-neutral-900 text-white' : 'bg-white text-black'}`}
                    >
                        <RefreshCw size={18} /> Restart
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
        </>
    );
};

export default GameOverlay;
