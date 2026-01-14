import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Trophy, Info, Crown, Sun, Moon, User, Users } from 'lucide-react';

// --- Graph Topology & Logic ---

// Nodes: 1-9 (P1), 10-18 (P2), 19 (Center)
const NODES = {
  // Center
  19: { x: 0, y: 0, label: 'C' },
  
  // Top Triangle (P1)
  // Row 3 (Inner)
  7: { x: -1, y: -1, label: '7' },
  8: { x: 0, y: -1, label: '8' },
  9: { x: 1, y: -1, label: '9' },
  // Row 2 (Middle)
  4: { x: -2, y: -2, label: '4' },
  5: { x: 0, y: -2, label: '5' },
  6: { x: 2, y: -2, label: '6' },
  // Row 1 (Outer)
  1: { x: -3, y: -3, label: '1' },
  2: { x: 0, y: -3, label: '2' },
  3: { x: 3, y: -3, label: '3' },

  // Bottom Triangle (P2)
  // Row 4 (Inner)
  10: { x: -1, y: 1, label: '10' },
  11: { x: 0, y: 1, label: '11' },
  12: { x: 1, y: 1, label: '12' },
  // Row 5 (Middle)
  13: { x: -2, y: 2, label: '13' },
  14: { x: 0, y: 2, label: '14' },
  15: { x: 2, y: 2, label: '15' },
  // Row 6 (Outer)
  16: { x: -3, y: 3, label: '16' },
  17: { x: 0, y: 3, label: '17' },
  18: { x: 3, y: 3, label: '18' },
};

// Define explicit GEOMETRICALLY STRAIGHT lines
// These traverse the center in straight lines (X shape + Vertical)
const VALID_LINES = [
    // Horizontal Rows
    [1, 2, 3], 
    [4, 5, 6], 
    [7, 8, 9], 
    [10, 11, 12], 
    [13, 14, 15], 
    [16, 17, 18],
    
    // Vertical Spine (Straight)
    [2, 5, 8, 19, 11, 14, 17], 
    
    // Diagonal 1: Bottom-Left to Top-Right (Straight Geometric Line)
    // 16(-3,3) -> 13(-2,2) -> 10(-1,1) -> 19(0,0) -> 9(1,-1) -> 6(2,-2) -> 3(3,-3)
    [16, 13, 10, 19, 9, 6, 3],

    // Diagonal 2: Bottom-Right to Top-Left (Straight Geometric Line)
    // 18(3,3) -> 15(2,2) -> 12(1,1) -> 19(0,0) -> 7(-1,-1) -> 4(-2,-2) -> 1(-3,-3)
    [18, 15, 12, 19, 7, 4, 1]
];

// Build adjacency map from VALID_LINES (pairwise)
const ADJACENCY = {};
Object.keys(NODES).forEach(id => ADJACENCY[id] = new Set());

VALID_LINES.forEach(line => {
    for (let i = 0; i < line.length - 1; i++) {
        const u = line[i];
        const v = line[i + 1];
        ADJACENCY[u].add(v);
        ADJACENCY[v].add(u);
    }
});

// Promotion Rows
const PROMOTION_NODES_P1 = [1, 2, 3];    // Top (Target for P1)
const PROMOTION_NODES_P2 = [16, 17, 18]; // Bottom (Target for P2)

const INITIAL_PIECES = [
  ...Array.from({ length: 9 }, (_, i) => ({ id: `p2-${i+1}`, player: 2, node: i + 1, isKing: false })),    // P2 Top
  ...Array.from({ length: 9 }, (_, i) => ({ id: `p1-${i+1}`, player: 1, node: i + 10, isKing: false })),   // P1 Bottom
];

export default function HourglassGame() {
  const [pieces, setPieces] = useState(INITIAL_PIECES);
  const [turn, setTurn] = useState(1);
  const [winner, setWinner] = useState(null);
  const [isChainJumping, setIsChainJumping] = useState(false);
  const [gameMode, setGameMode] = useState('pvp'); // 'pvp' or 'pvc'
  
  const [selectedPieceId, setSelectedPieceId] = useState(null);
  const [validMoves, setValidMoves] = useState([]); // Array of { target, type, captured? }


  const getPieceAt = (nodeId) => pieces.find(p => p.node === parseInt(nodeId));

  // Determine valid moves (Movement + Jumps)
  // Accepts optional 'boardState' to calculate moves for a hypothetical future state (chain jumps)
  const calculateValidMoves = (piece, boardState = pieces) => {
    const moves = [];
    const currentNode = piece.node;
    const currentPos = NODES[currentNode];
    
    // Helper to find piece in the specific board state provided
    const getPieceInState = (id) => boardState.find(p => p.node === parseInt(id));

    // 1. Move to adjacent empty nodes
    const neighbors = Array.from(ADJACENCY[currentNode] || []);
    
    neighbors.forEach(neighbor => {
      const neighborNode = NODES[neighbor];
      const occupant = getPieceInState(neighbor);
      
      // P1 (Bottom) moves UP (decreasing Y). Backward is Increasing Y.
      // P2 (Top) moves DOWN (increasing Y). Backward is Decreasing Y.
      const isBackward = piece.player === 1 
          ? neighborNode.y > currentPos.y
          : neighborNode.y < currentPos.y;

      const isAllowedDir = piece.isKing || !isBackward;

      if (!occupant) {
        if (isAllowedDir) {
            moves.push({ target: neighbor, type: 'move' });
        }
      } else if (occupant.player !== piece.player) {
         // 2. Check Jumps
         const isCaptureAllowedDir = piece.isKing || !isBackward;
         
         if (isCaptureAllowedDir) {
             const potentialLandings = Array.from(ADJACENCY[neighbor] || []).filter(n => n !== currentNode);
             
             potentialLandings.forEach(landing => {
                 const isLine = VALID_LINES.some(line => {
                     for (let i = 0; i < line.length - 2; i++) {
                         const segment = [line[i], line[i+1], line[i+2]];
                         const forward = segment[0] === currentNode && segment[1] === neighbor && segment[2] === landing;
                         const backward = segment[0] === landing && segment[1] === neighbor && segment[2] === currentNode;
                         if (forward || backward) return true;
                     }
                     return false;
                 });
    
                 if (isLine && !getPieceInState(landing)) {
                     moves.push({ target: landing, type: 'jump', captured: occupant.id });
                 }
             });
         }
      }
    });

    return moves;
  };



  // --- Computer Player Logic (AI) ---
  useEffect(() => {
    if (gameMode === 'pvc' && turn === 2 && !winner) {
        const timer = setTimeout(() => {
            makeComputerMove();
        }, 800);
        return () => clearTimeout(timer);
    }
  }, [turn, isChainJumping, validMoves, winner, gameMode]);

  const makeComputerMove = () => {
      // 1. Identify Valid Moves
      let possibleMoves = [];
      
      if (isChainJumping && selectedPieceId) {
          // If locked in chain, stick to validMoves
          const piece = pieces.find(p => p.id === selectedPieceId);
          if (piece) {
              possibleMoves = validMoves.map(m => ({ piece, move: m }));
          }
      } else {
          // Calculate ALL moves for P2
          const p2Pieces = pieces.filter(p => p.player === 2);
          p2Pieces.forEach(p => {
              const moves = calculateValidMoves(p);
              moves.forEach(m => possibleMoves.push({ piece: p, move: m }));
          });
      }

      if (possibleMoves.length === 0) {
          // No moves available (usually loss), but let game logic handle it or pass turn
          setTurn(1);
          return;
      }

      // 2. Filter / Select Best Move
      const jumpMoves = possibleMoves.filter(pm => pm.move.type === 'jump');
      let chosenMove = null;

      // Rule: Must Jump if available
      if (jumpMoves.length > 0) {
          // Prioritize jumps that promote
          const promoteJumps = jumpMoves.filter(pm => PROMOTION_NODES_P2.includes(pm.move.target));
          if (promoteJumps.length > 0) {
              chosenMove = promoteJumps[Math.floor(Math.random() * promoteJumps.length)];
          } else {
              chosenMove = jumpMoves[Math.floor(Math.random() * jumpMoves.length)];
          }
      } else {
          // Strategy: Promote > Random
          const promotionMoves = possibleMoves.filter(pm => PROMOTION_NODES_P2.includes(pm.move.target));
          if (promotionMoves.length > 0) {
               chosenMove = promotionMoves[Math.floor(Math.random() * promotionMoves.length)];
          } else {
               chosenMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
          }
      }

      // 3. Execute
      if (chosenMove) {
          setSelectedPieceId(chosenMove.piece.id); 
          executeMove(chosenMove.move, chosenMove.piece.id); // executing with specific ID
      }
  };

  const handleNodeClick = (nodeId) => {
    if (winner) return;
    
    // Disable interaction if it's Computer's turn
    if (gameMode === 'pvc' && turn === 2) return;

    if (selectedPieceId) {
      const move = validMoves.find(m => m.target === parseInt(nodeId));
      if (move) {
        executeMove(move);
        return;
      }
    }

    // Only allow selecting own pieces if we are NOT in the middle of a chain
    // (If validMoves has items and we are here, it might be a chain wait state? 
    // Actually simplicity: If strictly enforcing chain, validMoves will be populated.
    // But standard click handler resets validMoves if you click elsewhere.
    // We need a 'mustJump' state or check validMoves size.
    
    // If we just finished a jump and *must* jump again, 'validMoves' is already set to the jumps.
    // The user must click the target node.
    // If they click another piece, we should probably BLOCK selection if a chain is active.
    
    // However, for now, let's allow re-selection ONLY if not forced.
    // But 'executeMove' sets state and validMoves.
    // If I click another piece, 'handleNodeClick' usually clears validMoves.
    // We need to differentiate "Free Selection" vs "Chain Locked".
    
    // Quick Fix: If validMoves contains JUMPS and we triggered a move, we are locked?
    // Let's implement a 'chainMode' state? Or just infer.
    // If validMoves > 0 and they are jumps, and selectedPieceId is set...
    
    // But wait, standard turn start also allows picking pieces. 
    // Let's rely on 'turn' switching. If turn didn't switch, we are still P1.
    // If we force jump, we should ideally restrict interaction.
    
    // For this step, I'll allow clicking the SAME piece to see moves (already handled).
    // If they click a different piece WHILE chain jumping, we should block.
    // How to know chain jumping? -> add state 'isChainJumping'.
    
    const piece = getPieceAt(nodeId);
    // If we are chaining (validMoves has jumps and same player), block selecting others
    if (validMoves.length > 0 && validMoves[0].type === 'jump' && selectedPieceId) {
        if (piece && piece.id !== selectedPieceId) return; // Block changing piece
    }

    if (piece && piece.player === turn) {
      // Logic to prevent changing piece if locked in chain is handled above? 
      // Actually strictly: if I JUST jumped, I updated validMoves to only jumps.
      // If I click node again, this logic runs.
      // If I click other node, this runs.
      // We need a state or flag.
      
      setSelectedPieceId(piece.id);
      // Recalculate? If locked, we already have them?
      // Better: if 'validMoves' is already populated and we click the same piece, keep it.
      if (selectedPieceId === piece.id && validMoves.length > 0 && validMoves[0].type === 'jump') {
          return; 
      }
      
      const moves = calculateValidMoves(piece);
      setValidMoves(moves);
    } else {
       // If locked in chain, don't clear!
       if (validMoves.length > 0 && validMoves[0].type === 'jump' && selectedPieceId) return; 

       setSelectedPieceId(null);
       setValidMoves([]);
    }
  };
  
  // State to track if we are in a multi-jump sequence



  const executeMove = (move, pieceId = selectedPieceId) => {
      let movedPiece = pieces.find(p => p.id === pieceId);
      
      // King Promotion Check
      // Promote ONLY if turn ends? Or immediate? Standard is immediate but ends turn usually *unless* it can continue jumping AS A KING?
      // Standard checkers: Promoted piece ends turn immediately. 
      // Let's stick to simple: Promote immediately.
      let shouldPromote = false;
      if (!movedPiece.isKing) {
          if (movedPiece.player === 1 && PROMOTION_NODES_P1.includes(move.target)) shouldPromote = true;
          if (movedPiece.player === 2 && PROMOTION_NODES_P2.includes(move.target)) shouldPromote = true;
      }

      // Calculate new state
      let nextPieceState = { 
        ...movedPiece, 
        node: move.target,
        isKing: movedPiece.isKing || shouldPromote
      };

      let newPieces = pieces.map(p => 
        p.id === pieceId ? nextPieceState : p
      );

      if (move.type === 'jump') {
          newPieces = newPieces.filter(p => p.id !== move.captured);
          
          // Check for Chain Jump
          // If promoted, turn usually ends in standard checkers.
          if (shouldPromote) {
             // Turn Ends
             setPieces(newPieces);
             setSelectedPieceId(null);
             setValidMoves([]);
             setIsChainJumping(false);
             setTurn(turn === 1 ? 2 : 1);
          } else {
             // Check if moves available from NEW position
             const subsequentMoves = calculateValidMoves(nextPieceState, newPieces);
             const jumpMoves = subsequentMoves.filter(m => m.type === 'jump');
             
             if (jumpMoves.length > 0) {
                 // FORCE CHAIN
                 setPieces(newPieces);
                 // validMoves updated to only jumps
                 setValidMoves(jumpMoves);
                 setIsChainJumping(true);
                 // Turn does NOT change
                 // Selection stays on this piece
             } else {
                 // No more jumps, turn ends
                 setPieces(newPieces);
                 setSelectedPieceId(null);
                 setValidMoves([]);
                 setIsChainJumping(false);
                 setTurn(turn === 1 ? 2 : 1);
                 
                 // Win Check
                 if (!newPieces.some(p => p.player === (turn === 1 ? 2 : 1))) {
                    setWinner(turn);
                 }
             }
          }
      } else {
          // Walk move always ends turn
          setPieces(newPieces);
          setSelectedPieceId(null);
          setValidMoves([]);
          setIsChainJumping(false);
          setTurn(turn === 1 ? 2 : 1);
      }
  };

  const handleReset = () => {
    setPieces(INITIAL_PIECES);
    setTurn(1);
    setWinner(null);
    setSelectedPieceId(null);
    setTurn(1);
    setWinner(null);
    setSelectedPieceId(null);
    setValidMoves([]);
    setIsChainJumping(false); // Ensure chain state is reset
  };

  const toggleGameMode = () => {
      setGameMode(prev => {
          const next = prev === 'pvp' ? 'pvc' : 'pvp';
          handleReset();
          return next;
      });
  };

  const [theme, setTheme] = useState('light'); // 'light' or 'dark'

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // Theme Configs
  const colors = {
      light: {
          bg: 'bg-neutral-50',
          text: 'text-neutral-900',
          subtext: 'text-neutral-500',
          p1: { bg: 'bg-neutral-900', text: 'text-white', border: 'border-neutral-900' },
          p2: { bg: 'bg-white', text: 'text-neutral-900', border: 'border-neutral-900' },
          lines: { outer: '#e5e5e5', inner: '#262626' },
          node: { valid: 'bg-neutral-900', default: 'bg-neutral-300' },
          indicator: { ring: 'border-neutral-400', glow: 'bg-neutral-900/5 hover:bg-neutral-900/10' }
      },
      dark: {
          bg: 'bg-neutral-950',
          text: 'text-neutral-50',
          subtext: 'text-neutral-400',
          p1: { bg: 'bg-white', text: 'text-black', border: 'border-white' },
          p2: { bg: 'bg-neutral-950', text: 'text-white', border: 'border-white' },
          lines: { outer: '#404040', inner: '#737373' },
          node: { valid: 'bg-white', default: 'bg-neutral-800' },
          indicator: { ring: 'border-white', glow: 'bg-white/10 hover:bg-white/20' }
      }
  }[theme];

  // --- Visuals & Responsive Scaling ---
  const SPACING = 60;
  const BOARD_SIZE = 600;
  
  const [scale, setScale] = useState(1);
  const boardWrapperRef = React.useRef(null);

  useEffect(() => {
    const handleResize = () => {
        if (!boardWrapperRef.current) return;
        
        // Measure the flexible container size
        const availableW = boardWrapperRef.current.clientWidth;
        const availableH = boardWrapperRef.current.clientHeight;
        
        // Add padding safety
        const safeW = availableW - 40; 
        const safeH = availableH - 40;

        const scaleW = safeW / BOARD_SIZE;
        const scaleH = safeH / BOARD_SIZE;
        
        // Fit completely within the flexible area
        const newScale = Math.min(scaleW, scaleH, 1.2); 
        setScale(Math.max(newScale, 0.4));
    };

    window.addEventListener('resize', handleResize);
    // Allow layout to stabilize
    const timeout = setTimeout(handleResize, 100);
    return () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(timeout);
    };
  }, []);

  const getNodePos = (id) => ({
      x: NODES[id].x * SPACING,
      y: NODES[id].y * SPACING
  });

  return (
    <div className={`w-full h-screen flex flex-col justify-between overflow-hidden ${colors.bg} ${colors.text} font-sans transition-colors duration-500`}>
        
        {/* Theme Toggle */}
        {/* Toggle Controls (Top Right) */}
        <div className="absolute top-4 right-4 flex gap-2 z-50">
            {/* Game Mode Toggle */}
            <button 
                onClick={toggleGameMode}
                className={`p-2 rounded-full border transition-all flex gap-2 items-center px-4 font-bold text-xs uppercase tracking-wider
                ${theme === 'light' ? 'border-neutral-200 hover:bg-neutral-100' : 'border-neutral-800 hover:bg-neutral-900'}`}
                title="Toggle Game Mode"
            >
                {gameMode === 'pvp' ? <Users size={18} /> : <User size={18} />}
                <span className="hidden md:inline">{gameMode === 'pvp' ? '2 Players' : '1 Player'}</span>
            </button>
            {/* Theme Toggle */}
            <button 
                onClick={toggleTheme}
                className={`p-2 rounded-full border ${theme === 'light' ? 'border-neutral-200 hover:bg-neutral-100' : 'border-neutral-800 hover:bg-neutral-900'} transition-all`}
            >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
        </div>

        {/* 1. HEADER (Shrink 0) */}
        <div className="pt-8 pb-2 text-center z-10 w-full shrink-0 relative">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 uppercase">Qataar</h1>
            <p className={`text-[10px] md:text-xs tracking-[0.3em] uppercase ${colors.subtext}`}>Traditional Hunza Board Game</p>
        </div>

        {/* 2. HUD (Shrink 0) */}
        <div className="py-2 flex items-center justify-center gap-12 shrink-0 z-20">
            <div className={`transition-all duration-300 flex flex-col items-center gap-1 ${turn === 1 ? 'opacity-100 scale-110' : 'opacity-40 blur-[1px]'}`}>
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 shadow-sm ${colors.p1.bg} ${colors.p1.border}`} />
                <div className="text-[10px] md:text-xs font-bold tracking-widest mt-1">P1</div>
            </div>
            <div className={`text-xl font-light ${colors.subtext}`}>VS</div>
            <div className={`transition-all duration-300 flex flex-col items-center gap-1 ${turn === 2 ? 'opacity-100 scale-110' : 'opacity-40 blur-[1px]'}`}>
                <div className={`relative w-8 h-8 md:w-10 md:h-10 rounded-full border-2 shadow-sm flex items-center justify-center ${colors.p2.bg} ${colors.p2.border}`}>
                     {gameMode === 'pvc' && <span className="text-[10px]">🤖</span>}
                </div>
                <div className="text-[10px] md:text-xs font-bold tracking-widest mt-1">
                    {gameMode === 'pvc' ? 'CPU' : 'P2'}
                </div>
            </div>
        </div>

        {/* 3. BOARD AREA (Flex 1 - Takes remaining space) */}
        <div 
            ref={boardWrapperRef}
            className="flex-1 w-full relative flex items-center justify-center overflow-hidden min-h-0"
        >
            <div 
                className="relative flex items-center justify-center transition-transform duration-200 ease-out will-change-transform"
                style={{ 
                    width: BOARD_SIZE, 
                    height: BOARD_SIZE,
                    transform: `scale(${scale})`,
                }}
            >
                {/* SVG Background Layer */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    <g transform="translate(300, 300)">
                        {/* Outer Lines */}
                        {VALID_LINES.map((line, i) => {
                            const points = line.map(nodeId => {
                                const p = getNodePos(nodeId);
                                return `${p.x},${p.y}`;
                            }).join(' ');

                            return (
                                <motion.polyline
                                    key={i}
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
                         {VALID_LINES.map((line, i) => {
                            const points = line.map(nodeId => {
                                const p = getNodePos(nodeId);
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
                </svg>

                {/* Nodes */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-0 h-0">
                        {Object.entries(NODES).map(([id, node]) => {
                            const pos = getNodePos(id);
                            const isValidTarget = validMoves.some(m => m.target === parseInt(id));
                            
                            return (
                                <motion.div
                                    key={id}
                                    className={`absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full flex items-center justify-center pointer-events-auto transition-colors duration-300
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
                                    onClick={() => handleNodeClick(id)}
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
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Pieces */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                    <div className="relative w-0 h-0">
                        <AnimatePresence>
                            {pieces.map((piece) => {
                                const pos = getNodePos(piece.node);
                                const isSelected = selectedPieceId === piece.id;
                                const pStyle = piece.player === 1 ? colors.p1 : colors.p2;
                                
                                return (
                                    <motion.div
                                        key={piece.id}
                                        // Removed layoutId to prevent jitter during resize/scale
                                        className={`absolute w-10 h-10 -ml-5 -mt-5 rounded-full flex items-center justify-center cursor-pointer pointer-events-auto shadow-md
                                        ${pStyle.bg} ${pStyle.text} border-[3px] ${pStyle.border}`}
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
                                            handleNodeClick(piece.node);
                                        }}
                                    >
                                        {piece.isKing && (
                                            <motion.div 
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                            >
                                                <Crown size={20} strokeWidth={2.5} fill="currentColor" />
                                            </motion.div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
        
        {/* 4. FOOTER (Shrink 0) */}
        <div className={`pb-6 pt-2 flex flex-col items-center gap-3 shrink-0 ${colors.subtext} pointer-events-none`}>
           <div className="flex gap-8 text-[10px] uppercase tracking-[0.2em]">
               <div className="flex items-center gap-2">
                   <div className={`w-8 h-[2px] ${theme === 'light' ? 'bg-neutral-300' : 'bg-neutral-600'}`} /> 
                   <span>Tracks</span>
               </div>
               <div className="flex items-center gap-2">
                   <Crown size={12} className={colors.text} />
                   <span>King</span>
               </div>
           </div>
           <div className="text-[10px] font-medium tracking-wide opacity-50">
               Faris Salman
           </div>
        </div>

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
                        onClick={handleReset}
                        className={`px-8 py-3 font-bold rounded-none transition-all hover:scale-105 flex items-center gap-2 uppercase tracking-wider text-sm shadow-lg
                        ${theme === 'light' ? 'bg-neutral-900 text-white' : 'bg-white text-black'}`}
                    >
                        <RefreshCw size={18} /> Restart
                    </button>
                </motion.div>
            )}
        </AnimatePresence>

    </div>
  );
}
