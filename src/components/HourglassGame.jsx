import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, PenTool } from 'lucide-react';
import { BASE_NODES, EXTRA_NODES, SQUARE_NODES, BASE_LINES, EXTRA_LINES, SQUARE_LINES } from '../config/layout';
import { colorSchemes } from '../config/theme';
import { BOARD_SIZE, SPACING, SNAP_THRESHOLD } from '../config/constants';
import { snap, convertSegmentsToChains } from '../utils/boardUtils';
import { calculateValidMoves } from '../utils/gameLogic';
import useSound from '../hooks/useSound';
import { useGameEngine } from '../hooks/useGameEngine';
import { useAI } from '../hooks/useAI';
import BoardEditor from './Editor/BoardEditor';
import GameBoard from './Board/GameBoard';
import GameHeader from './Game/GameHeader';
import GameOverlay from './Game/GameOverlay';

export default function HourglassGame() {
  console.log("HourglassGame Mounting...");
  const [theme, setTheme] = useState(() => localStorage.getItem('hourglass-theme') || 'light');
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [boardLayout, setBoardLayout] = useState('standard'); // 'standard', 'extended', 'square', 'custom'
  const [difficulty, setDifficulty] = useState('normal'); // 'easy', 'normal', 'hard'

  // Custom Board State (kept here as it affects layout injection)
  const [isEditing, setIsEditing] = useState(false);
  const [customConfig, setCustomConfig] = useState(() => {
      try {
          const saved = localStorage.getItem('qataar_custom_board');
          const parsed = saved ? JSON.parse(saved) : null;
          if (parsed && typeof parsed === 'object') {
              // Heuristic: Check if nodes define large coordinates (Pixels) and convert to Grid
              // Grid is typically -3 to 3. Pixels are 0-600.
              const nodes = parsed.nodes || {};
              let isPixel = false;
              Object.values(nodes).forEach(n => {
                  if (Math.abs(n.x) > 10 || Math.abs(n.y) > 10) isPixel = true;
              });

              if (isPixel) {
                  console.warn("Legacy Custom Board detected (Pixels). Migrating to Grid...");
                  const newNodes = {};
                  const pieces = parsed.pieces || [];
                  
                  // Migration Helpers (assuming 600 size and 200/60 spacing context)
                  // We use the current SPACING constant to try and map back, 
                  // or if legacy was fixed at 60, use 60. 
                  // Let's assume legacy pixels scale with the styling at the time.
                  const CACHED_SPACING = 60; 
                  const toG = (v) => Math.round((v - 300) / CACHED_SPACING);

                  Object.entries(nodes).forEach(([key, node]) => {
                      // Key might be "300,300"
                      const gx = toG(node.x);
                      const gy = toG(node.y);
                      const gId = `${gx},${gy}`;
                      newNodes[gId] = { ...node, x: gx, y: gy };
                      
                      // Update Pieces
                      pieces.forEach(p => {
                          if (p.node === key) p.node = gId;
                      });
                  });
                  
                  // We also need to migrate lines (segments)
                  // But lines are harder if keys changed.
                  // For now, let's just accept nodes and let user redraw lines if broken?
                  // Or try to map keys.
                  // Since we mapped keys "300,300" -> "0,0", we can map segment keys too.
                  
                  return {
                      nodes: newNodes,
                      lines: [], // Clear lines to be safe, user can redraw easily
                      pieces: pieces,
                      segments: [] 
                  };
              }

              return {
                  nodes: parsed.nodes || {},
                  lines: parsed.lines || [],
                  pieces: parsed.pieces || [],
                  segments: parsed.segments || [] 
              };
          }
      } catch (e) {
          console.error("Failed to parse custom config:", e);
      }
      return { nodes: {}, lines: [], pieces: [] };
  });

  const sounds = useSound();

  // --- Dynamic Topology ---
  const activeNodes = useMemo(() => {
      if (boardLayout === 'custom') return customConfig.nodes || {};
      if (boardLayout === 'square') return SQUARE_NODES;
      return boardLayout === 'extended' ? { ...BASE_NODES, ...EXTRA_NODES } : BASE_NODES;
  }, [boardLayout, customConfig]);

  const activeLines = useMemo(() => {
      if (boardLayout === 'custom') return customConfig.lines || [];
      if (boardLayout === 'square') return SQUARE_LINES;
      return boardLayout === 'extended' ? [...BASE_LINES, ...EXTRA_LINES] : BASE_LINES;
  }, [boardLayout, customConfig]);

  const adjacency = useMemo(() => {
      const adj = {};
      Object.keys(activeNodes).forEach(id => adj[id] = new Set());

      activeLines.forEach(line => {
          for (let i = 0; i < line.length - 1; i++) {
              const u = String(line[i]);
              const v = String(line[i + 1]);
              if (adj[u]) adj[u].add(v);
              if (adj[v]) adj[v].add(u);
          }
      });
      return adj;
  }, [activeLines, activeNodes]);

  // --- Game Engine Hook ---
  const {
      pieces, setPieces,
      turn, setTurn,
      winner, setWinner,
      isChainJumping, setIsChainJumping,
      gameMode, setGameMode, toggleGameMode,
      selectedPieceId, setSelectedPieceId,
      validMoves, setValidMoves,
      getPieceAt,
      executeMove,
      handleReset
  } = useGameEngine(boardLayout, activeNodes, activeLines, adjacency, sounds);

  // --- AI Hook ---
  useAI({
      turn, gameMode, winner, pieces,
      isChainJumping, selectedPieceId, validMoves,
      executeMove, setSelectedPieceId, setTurn,
      boardLayout, activeNodes, adjacency,
      difficulty
  });

  const handleNodeClick = (nodeId) => {
    if (winner) return;

    // Disable interaction if it's Computer's turn
    if (gameMode === 'pvc' && turn === 2) return;

    if (selectedPieceId) {
      const move = validMoves.find(m => String(m.target) === String(nodeId));
      if (move) {
        executeMove(move);
        return;
      }
    }

    const piece = getPieceAt(nodeId);

    // Only lock selection if we are explicitly in a chain jump sequence
    if (isChainJumping && validMoves.length > 0 && selectedPieceId) {
        if (piece && piece.id !== selectedPieceId) {
             sounds.playError();
             return; // Must continue with same piece
        }
    }

    if (piece && piece.player === turn) {
        // If not chain jumping, allow switching pieces freely
        if (!isChainJumping && selectedPieceId && piece.id !== selectedPieceId) {
             // allow switch
        } else if (selectedPieceId === piece.id && validMoves.length > 0) {
             // Clicking same piece (perhaps to toggle off? or just ignore)
             return;
        }

      const moves = calculateValidMoves(piece, pieces, activeNodes, adjacency, boardLayout);
      setValidMoves(moves);
      setSelectedPieceId(piece.id);
      sounds.playSelect(); // Sound Effect
    } else {
       // If locked in chain, don't clear!
       if (isChainJumping) return;

       setSelectedPieceId(null);
       setValidMoves([]);
    }
  };

  const toggleBoardLayout = () => {
    const modes = ['standard', 'extended', 'square'];
    // Only allow cycling to Custom if it exists AND has valid pieces for both players
    if (customConfig.pieces && customConfig.pieces.length > 0) {
        const hasP1 = customConfig.pieces.some(p => p.player === 1);
        const hasP2 = customConfig.pieces.some(p => p.player === 2);
        
        if (hasP1 && hasP2) {
            modes.push('custom');
        }
    }

    setBoardLayout(prev => {
        const idx = modes.indexOf(prev);
        const next = modes[(idx + 1) % modes.length];
        return next;
    });
  };

  useEffect(() => {
    handleReset();
  }, [boardLayout, handleReset]); // Added handleReset to dependency array

  const [showInfo, setShowInfo] = useState(false);



  // --- Visuals & Responsive Scaling ---
  // SPACING imported from constants

  const initializeEditor = () => {
      setIsEditing(true);
      setGameMode('pvc'); 
  };

  const [scale, setScale] = useState(1);
  const [userZoom, setUserZoom] = useState(1); // 0.5 to 1.5
  const [showZoom, setShowZoom] = useState(false);
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
        const baseScale = Math.min(scaleW, scaleH, 1.2); 
        
        // Apply User Zoom
        const finalScale = Math.max(baseScale * userZoom, 0.4);
        setScale(finalScale);
    };

    window.addEventListener('resize', handleResize);
    // Allow layout to stabilize
    const timeout = setTimeout(handleResize, 100);
    return () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(timeout);
    };
  }, [userZoom]); // Re-calculate when zoom changes

  // --- Visual Helper ---


  // Theme Configs


  const colors = colorSchemes[theme];

  const handleSaveCustomBoard = (newConfig) => {
      console.log("Saving Custom Board:", newConfig);
      localStorage.setItem('qataar_custom_board', JSON.stringify(newConfig));
      setCustomConfig(newConfig);
      setIsEditing(false);
      setBoardLayout('custom'); 
      handleReset();
      sounds.playWin();
  };


  return (
    <div className={`w-full h-screen flex flex-col justify-between overflow-hidden ${colors.bg} ${colors.text} font-sans transition-colors duration-500`}>
        
        {/* Toggle Controls (Top) */}
        <GameHeader 
            theme={theme} setTheme={setTheme}
            showInfo={showInfo} setShowInfo={setShowInfo}
            boardLayout={boardLayout} toggleBoardLayout={toggleBoardLayout}
            isEditing={isEditing} initializeEditor={initializeEditor}
            userZoom={userZoom} setUserZoom={setUserZoom} showZoom={showZoom} setShowZoom={setShowZoom}
            gameMode={gameMode} toggleGameMode={toggleGameMode}
            difficulty={difficulty} setDifficulty={setDifficulty}
            handleReset={handleReset}
            sounds={sounds}
            showThemeModal={showThemeModal} setShowThemeModal={setShowThemeModal}
            customConfig={customConfig}
        />

        {/* 1. HEADER (Shrink 0) */}
        <div className="pt-2 pb-2 text-center z-10 w-full shrink-0 relative">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 uppercase">Qataar</h1>
            <p className={`text-[10px] md:text-xs tracking-[0.3em] uppercase ${colors.subtext}`}>Traditional Hunza Board Game</p>
            <div className={`text-[10px] uppercase tracking-widest opacity-40 mt-1 font-medium ${colors.subtext}`}>by Faris Salman</div>
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
            className="flex-1 w-full relative overflow-hidden min-h-0"
        >
            <div 
                className="absolute top-1/2 left-1/2 transition-transform duration-200 ease-out will-change-transform flex items-center justify-center"
                style={{ 
                    width: BOARD_SIZE, 
                    height: BOARD_SIZE,
                    transform: `translate(-50%, -50%) scale(${scale})`,
                }}
            >
                <GameBoard 
                    activeNodes={activeNodes}
                    activeLines={activeLines}
                    pieces={pieces}
                    validMoves={validMoves}
                    selectedPieceId={selectedPieceId}
                    onNodeClick={handleNodeClick}
                    colors={colors}
                    theme={theme}
                />
            </div>
        </div>
        
        {/* 4. FOOTER (Shrink 0) */}
        <div className={`pb-12 md:pb-6 pt-2 flex flex-col items-center gap-3 shrink-0 ${colors.subtext} pointer-events-none`}>
           <div className="flex gap-6 md:gap-8 text-[10px] uppercase tracking-[0.2em] flex-wrap justify-center">
               <div className="flex items-center gap-2">
                   <div className={`w-3 h-3 rounded-full ${colors.p1.bg} ${colors.p1.border} border`} />
                   <span>Player 1</span>
               </div>
               <div className="flex items-center gap-2">
                   <div className={`w-3 h-3 rounded-full ${colors.p2.bg} ${colors.p2.border} border`} />
                   <span>Player 2</span>
               </div>
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

        {/* Info Modal */}
        {/* Editor Overlay */}
        <BoardEditor 
            isOpen={isEditing} 
            onClose={() => setIsEditing(false)} 
            onSave={handleSaveCustomBoard} 
            theme={theme} 
            colors={colors} 
            sounds={sounds}
            initialConfig={customConfig}
        />

        <GameOverlay 
            winner={winner}
            gameMode={gameMode}
            handleReset={handleReset}
            sounds={sounds}
            theme={theme}
            showInfo={showInfo}
            setShowInfo={setShowInfo}
        />

    </div>
  );
}


// Helper: Convert separate segments [[a,b], [b,c]] into chains [[a,b,c]]




