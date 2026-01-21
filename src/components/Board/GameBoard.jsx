import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown } from 'lucide-react';
import { SPACING } from '../../config/constants';

const GameBoard = ({ 
    activeNodes, 
    activeLines, 
    pieces, 
    validMoves, 
    selectedPieceId, 
    onNodeClick, 
    colors, // Theme colors object
    theme
}) => {
    
    // Helper to get raw coordinates
    // We assume activeNodes is fully populated for the current layout
    const getNodePos = (nodeId) => {
        const node = activeNodes[nodeId];
        if (!node) return { x: 0, y: 0 };
        return { x: node.x * SPACING, y: node.y * SPACING };
    };

    return (
        <div className="flex-1 w-full h-full relative">
             <svg 
                width="600" 
                height="600" 
                viewBox="0 0 600 600" 
                className="absolute inset-0 pointer-events-none z-0"
            >
            <BoardLines activeLines={activeLines} colors={colors} activeNodes={activeNodes} />
            </svg>

            {/* Nodes */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0" style={{ transform: 'translate(300px, 300px)' }}>
                    {Object.entries(activeNodes).map(([id, node]) => {
                        const pos = getNodePos(id);
                        const isValidTarget = validMoves.some(m => String(m.target) === String(id));
                        
                        return (
                            <motion.button
                                key={id}
                                className={`absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full flex items-center justify-center pointer-events-auto transition-colors duration-300 border-none outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500
                                ${isValidTarget 
                                    ? `${colors.node.valid} cursor-pointer z-40` 
                                    : `${colors.node.default} z-10`}`}
                                initial={{ x: pos.x, y: pos.y, scale: 1 }}
                                animate={{ 
                                    x: pos.x, 
                                    y: pos.y, 
                                    scale: isValidTarget ? 1.5 : 1 
                                }}
                                transition={{
                                    x: { duration: 0 }, 
                                    y: { duration: 0 },
                                    scale: { duration: 0.3 }
                                }}
                                onClick={() => onNodeClick(id)}
                                aria-label={`Node at coordinates ${node.x}, ${node.y}.${isValidTarget ? ' Valid move target.' : ''}`}
                            >
                                {isValidTarget && (
                                    <motion.div 
                                        className={`absolute w-8 h-8 -ml-4 -mt-4 top-1/2 left-1/2 rounded-full border ${colors.indicator.ring}`}
                                        initial={{ scale: 1, opacity: 0.5 }}
                                        animate={{ scale: 1.8, opacity: 0 }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                                    />
                                )}
                                {isValidTarget && (
                                    <div className={`absolute w-12 h-12 -ml-6 -mt-6 top-1/2 left-1/2 rounded-full transition-colors ${colors.indicator.glow}`} />
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Pieces */}
            <div className="absolute inset-0 pointer-events-none z-30">
                 <div className="absolute top-0 left-0" style={{ transform: 'translate(300px, 300px)' }}>
                    <AnimatePresence>
                        {pieces.map((piece) => {
                            const pos = getNodePos(piece.node);
                            const isSelected = selectedPieceId === piece.id;
                            const pStyle = piece.player === 1 ? colors.p1 : colors.p2;
                            
                            return (
                                <motion.button
                                    key={piece.id}
                                    className={`absolute w-10 h-10 -ml-5 -mt-5 rounded-full flex items-center justify-center cursor-pointer pointer-events-auto shadow-md border-[3px] outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500
                                    ${pStyle.bg} ${pStyle.text} ${pStyle.border}`}
                                    initial={{ scale: 0, x: pos.x, y: pos.y }}
                                    animate={{ 
                                        x: pos.x, 
                                        y: pos.y, 
                                        scale: isSelected ? 1.15 : 1, 
                                        zIndex: isSelected ? 50 : 30,
                                        borderColor: isSelected ? (theme === 'light' ? '#a3a3a3' : '#525252') : ''
                                    }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ 
                                        type: "spring", 
                                        stiffness: 300, 
                                        damping: 25,
                                        mass: 0.8
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onNodeClick(piece.node);
                                    }}
                                    aria-label={`Player ${piece.player} ${piece.isKing ? 'King' : 'Piece'} at node ${piece.node}.${isSelected ? ' Selected.' : ''}`}
                                >
                                    {piece.isKing && (
                                        <motion.div 
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                        >
                                            <Crown size={20} strokeWidth={2.5} fill="currentColor" />
                                        </motion.div>
                                    )}
                                </motion.button>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

// Optimization: Memoize Static Lines
const BoardLines = React.memo(({ activeLines, colors, activeNodes }) => {
    // Shared Helper inside the memoized component
    const getNodePos = (nodeId) => {
        const node = activeNodes[nodeId];
        if (!node) return { x: 0, y: 0 };
        // We need SPACING imported or passed. It's imported in file.
        // Assuming SPACING is constant:
        // import { SPACING } from '../../config/constants'; (It is imported at line 4)
        return { x: node.x * 60, y: node.y * 60 }; // Using 60 hardcoded or relying on constant if feasible? 
        // Better to use the constant 'SPACING' from line 4.
    };
    
    // Actually, getNodePos logic is simple: x * SPACING.
    // Let's just inline it or define it here.
    const _getPos = (id) => {
        const n = activeNodes[id];
        return n ? { x: n.x * SPACING, y: n.y * SPACING } : { x: 0, y: 0 }; 
    };

    return (
        <g transform="translate(300, 300)">
            {/* Outer Lines */}
            {activeLines.map((line, i) => {
                const points = line.map(nodeId => {
                    const p = _getPos(nodeId);
                    return `${p.x},${p.y}`;
                }).join(' ');

                return (
                    <motion.polyline
                        key={`outer-${i}`}
                        points={points}
                        fill="none"
                        stroke={colors.lines.outer}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        animate={{ stroke: colors.lines.outer }}
                    />
                );
            })}
             {/* Inner Lines */}
             {activeLines.map((line, i) => {
                const points = line.map(nodeId => {
                    const p = _getPos(nodeId);
                    return `${p.x},${p.y}`;
                }).join(' ');
                 return (
                    <motion.polyline
                        key={`inner-${i}`}
                        points={points}
                        fill="none"
                        stroke={colors.lines.inner}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        animate={{ stroke: colors.lines.inner }}
                    />
                 );
             })}
        </g>
    );
});

export default GameBoard;
