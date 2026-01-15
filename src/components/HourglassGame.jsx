import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Trophy, Info, Crown, Sun, Moon, User, Users, RotateCcw, PenTool, Save, Trash2, X } from 'lucide-react';

// --- Graph Topology & Logic ---

// Nodes: 1-9 (P1), 10-18 (P2), 19 (Center)
const BASE_NODES = {
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

// Extended Mode Nodes (Side midpoints for the "Square" frame)
const EXTRA_NODES = {
    20: { x: -3, y: 0, label: 'L' },
    21: { x: 3, y: 0, label: 'R' }
};

// Square Mode Nodes (3 Concentric Squares: 24 Nodes)
const SQUARE_NODES = {
    // Outer Ring (-3 to 3)
    1: { x: -3, y: -3, label: 'TL1' }, 2: { x: 0, y: -3, label: 'TM1' }, 3: { x: 3, y: -3, label: 'TR1' },
    4: { x: -3, y: 0, label: 'ML1' },                                    5: { x: 3, y: 0, label: 'MR1' },
    6: { x: -3, y: 3, label: 'BL1' }, 7: { x: 0, y: 3, label: 'BM1' }, 8: { x: 3, y: 3, label: 'BR1' },

    // Middle Ring (-2 to 2)
    9: { x: -2, y: -2, label: 'TL2' }, 10: { x: 0, y: -2, label: 'TM2' }, 11: { x: 2, y: -2, label: 'TR2' },
    12: { x: -2, y: 0, label: 'ML2' },                                    13: { x: 2, y: 0, label: 'MR2' },
    14: { x: -2, y: 2, label: 'BL2' }, 15: { x: 0, y: 2, label: 'BM2' }, 16: { x: 2, y: 2, label: 'BR2' },

    // Inner Ring (-1 to 1)
    17: { x: -1, y: -1, label: 'TL3' }, 18: { x: 0, y: -1, label: 'TM3' }, 19: { x: 1, y: -1, label: 'TR3' },
    20: { x: -1, y: 0, label: 'ML3' },                                     21: { x: 1, y: 0, label: 'MR3' },
    22: { x: -1, y: 1, label: 'BL3' }, 23: { x: 0, y: 1, label: 'BM3' }, 24: { x: 1, y: 1, label: 'BR3' },
};

// Base Lines
const BASE_LINES = [
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

// Extended Lines (The "Box" frame + Center Horizontal)
const EXTRA_LINES = [
    // Left Vertical: 1 -> 20 -> 16
    [1, 20, 16],
    // Right Vertical: 3 -> 21 -> 18
    [3, 21, 18],
    // Center Horizontal: 20 -> 19 -> 21
    [20, 19, 21]
];

const SQUARE_LINES = [
    // --- Concentric Rings ---
    // Outer
    [1, 2, 3], [3, 5, 8], [8, 7, 6], [6, 4, 1],
    // Middle
    [9, 10, 11], [11, 13, 16], [16, 15, 14], [14, 12, 9],
    // Inner
    [17, 18, 19], [19, 21, 24], [24, 23, 22], [22, 20, 17],

    // --- Radials (connecting layers) ---
    // Diagonals
    [1, 9, 17], [3, 11, 19], [8, 16, 24], [6, 14, 22],
    // Cardinals (Cross)
    [2, 10, 18], [5, 13, 21], [7, 15, 23], [4, 12, 20]
];



const getInitialPieces = (layout) => {
    if (layout === 'square') {
        // Square Mode (24 nodes)
        // P2 (Top): Outer Top (1,2,3), Middle Top (9,10,11), Inner Top (17,18,19)
        // P1 (Bottom): Outer Bot (6,7,8), Middle Bot (14,15,16), Inner Bot (22,23,24)
        return [
            // P2 (Top) - 6 Pieces (Outer & Middle Rings)
            { id: 'p2-1', player: 2, node: 1, isKing: false }, { id: 'p2-2', player: 2, node: 2, isKing: false }, { id: 'p2-3', player: 2, node: 3, isKing: false },
            { id: 'p2-4', player: 2, node: 9, isKing: false }, { id: 'p2-5', player: 2, node: 10, isKing: false }, { id: 'p2-6', player: 2, node: 11, isKing: false },
            
            // P1 (Bottom) - 6 Pieces (Outer & Middle Rings)
            { id: 'p1-1', player: 1, node: 6, isKing: false }, { id: 'p1-2', player: 1, node: 7, isKing: false }, { id: 'p1-3', player: 1, node: 8, isKing: false },
            { id: 'p1-4', player: 1, node: 14, isKing: false }, { id: 'p1-5', player: 1, node: 15, isKing: false }, { id: 'p1-6', player: 1, node: 16, isKing: false },
        ];
    }

    if (layout === 'custom') {
        try {
            const saved = localStorage.getItem('qataar_custom_board');
            if (saved) {
                const config = JSON.parse(saved);
                console.log("Loaded Custom Pieces:", config.pieces.length);
                return config.pieces || [];
            }
        } catch (e) {
            console.error("Failed to load custom board:", e);
        }
        return [];
    }
    // Standard / Extended
    return [
        ...Array.from({ length: 9 }, (_, i) => ({ id: `p2-${i+1}`, player: 2, node: i + 1, isKing: false })),    // P2 Top
        ...Array.from({ length: 9 }, (_, i) => ({ id: `p1-${i+1}`, player: 1, node: i + 10, isKing: false })),   // P1 Bottom
    ];
};

  // --- Sound Effects System (Hook) ---
  const useSound = () => {
      const ctxRef = React.useRef(null);

      // Initialize Audio Context lazily
      const getCtx = () => {
          if (!ctxRef.current) {
               const AudioContext = window.AudioContext || window.webkitAudioContext;
               if (AudioContext) ctxRef.current = new AudioContext();
          }
          return ctxRef.current;
      };

      const playTone = (freq, type, duration, vol = 0.1) => {
          const ctx = getCtx();
          if (!ctx) return;
          
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = type;
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          
          gain.gain.setValueAtTime(vol, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start();
          osc.stop(ctx.currentTime + duration);
      };

      const playThud = () => {
          const ctx = getCtx();
          if (!ctx) return;
          
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          // Pitch drop for "Thud" weight
          osc.frequency.setValueAtTime(120, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.15);
          osc.type = 'triangle';

          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.15);
      };

      const playPaperSlide = () => {
          const ctx = getCtx();
          if (!ctx) return;
          
          const bufferSize = ctx.sampleRate * 0.3; // 0.3s duration
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          
          // Generate White Noise
          for (let i = 0; i < bufferSize; i++) {
              data[i] = Math.random() * 2 - 1;
          }

          const noise = ctx.createBufferSource();
          noise.buffer = buffer;

          // Filter to make it "Paper" (Low Pass)
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 600; // Soft friction sound

          const gain = ctx.createGain();
          // Envelope: Soft attack, sustain, soft release
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05); // Attack
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3); // Release

          noise.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          noise.start();
      };

      return useMemo(() => ({
          playSelect: () => playThud(), // Thud for selection/placing
          playMove: () => playPaperSlide(), // Slide sound for movement
          
          playCapture: () => { 
              playThud();
              setTimeout(() => playTone(300, 'sine', 0.2, 0.1), 100);
          }, 
          
          playClick: () => playTone(800, 'sine', 0.03, 0.01), // Very quiet click
          playWin: () => { 
              [440, 554, 659, 880].forEach((f, i) => setTimeout(() => playTone(f, 'sine', 0.8, 0.05), i * 150));
          },
          playError: () => playTone(100, 'sawtooth', 0.15, 0.03)
      }), []);
  };

export default function HourglassGame() {
  console.log("HourglassGame Mounting...");
  const [boardLayout, setBoardLayout] = useState('standard'); // 'standard', 'extended', 'square', 'custom'
  
  // Custom Board State
  const [isEditing, setIsEditing] = useState(false);
  const [customConfig, setCustomConfig] = useState(() => {
      try {
          const saved = localStorage.getItem('qataar_custom_board');
          const parsed = saved ? JSON.parse(saved) : null;
          if (parsed && typeof parsed === 'object') {
              return {
                  nodes: parsed.nodes || {},
                  lines: parsed.lines || [],
                  pieces: parsed.pieces || [],
                  segments: parsed.segments || [] // Store raw segments for editor
              };
          }
      } catch (e) {
          console.error("Failed to parse custom config:", e);
      }
      return { nodes: {}, lines: [], pieces: [] };
  });



  const sounds = useSound();

  // --- Game State ---
  const [pieces, setPieces] = useState(() => getInitialPieces('standard'));
  const [turn, setTurn] = useState(1);
  const [winner, setWinner] = useState(null);
  const [isChainJumping, setIsChainJumping] = useState(false);
  const [gameMode, setGameMode] = useState('pvc'); // 'pvp' or 'pvc'
  
  const [selectedPieceId, setSelectedPieceId] = useState(null);
  const [validMoves, setValidMoves] = useState([]); 

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

  const getPieceAt = (nodeId) => pieces.find(p => String(p.node) === String(nodeId));

  const getPromotionNodes = (player) => {
      // Dynamic Promotion for Custom Layouts
      if (boardLayout === 'custom') {
          const allNodes = Object.values(activeNodes);
          if (allNodes.length === 0) return [];

          if (player === 1) {
             // P1 (Bottom) promotes at MIN Y (Top)
             const minY = Math.min(...allNodes.map(n => n.y));
             return Object.keys(activeNodes).filter(id => activeNodes[id].y === minY);
          } else {
             // P2 (Top) promotes at MAX Y (Bottom)
             const maxY = Math.max(...allNodes.map(n => n.y));
             return Object.keys(activeNodes).filter(id => activeNodes[id].y === maxY);
          }
      }

      if (player === 1) return [1, 2, 3]; // Top row is consistent for both (1,2,3)
       
      if (player === 2) {
          if (boardLayout === 'square') return [6, 7, 8]; // Bottom Outer Row
          return [16, 17, 18]; // Hourglass Bottom Row
      }
      return [];
  };

  // Determine valid moves (Movement + Jumps)
  // Accepts optional 'boardState' to calculate moves for a hypothetical future state (chain jumps)
  const calculateValidMoves = (piece, boardState = pieces) => {
    const moves = [];
    const currentNode = piece.node;
    const currentPos = activeNodes[currentNode];
    
    // Safety check if node exists in current mode
    if (!currentPos) return [];

    // Helper to find piece in the specific board state provided
    const getPieceInState = (id) => boardState.find(p => String(p.node) === String(id));

    // 1. Move to adjacent empty nodes
    const neighbors = Array.from(adjacency[String(currentNode)] || []);
    
    neighbors.forEach(neighbor => {
      const neighborNode = activeNodes[neighbor];
      if (!neighborNode) return; // Skip if neighbor node definition is missing
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
              const potentialLandings = Array.from(adjacency[neighbor] || []).filter(n => n !== currentNode);
              
              potentialLandings.forEach(landing => {
                  const landingNode = activeNodes[landing];
                  if (!landingNode) return; // Safety

                  // Geometric Collinearity Check
                  // We know Current -> Neighbor is valid (adjacency).
                  // We check Neighbor -> Landing is valid (adjacency).
                  // Now checking if Current -> Neighbor -> Landing is a straight line.
                  
                  // Vector 1 (Current -> Neighbor)
                  const dx1 = neighborNode.x - currentPos.x;
                  const dy1 = neighborNode.y - currentPos.y;
                  
                  // Vector 2 (Neighbor -> Landing)
                  const dx2 = landingNode.x - neighborNode.x;
                  const dy2 = landingNode.y - neighborNode.y;
                  
                  // Check direction consistency (must be same direction)
                  // valid if dx1 == dx2 && dy1 == dy2 (for uniform grid steps)
                  // OR simply cross product zero and dot product positive (general)
                  const crossMap = dx1 * dy2 - dy1 * dx2;
                  const dotMap = dx1 * dx2 + dy1 * dy2;
                  
                  const isStraight = (Math.abs(crossMap) < 0.01) && (dotMap > 0);

                  if (isStraight && !getPieceInState(landing)) {
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
  }, [turn, isChainJumping, validMoves, winner, gameMode]); // Added gameMode dependency

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

      const p2PromotionNodes = getPromotionNodes(2);

      // Rule: Must Jump if available
      if (jumpMoves.length > 0) {
          // Prioritize jumps that promote
          const promoteJumps = jumpMoves.filter(pm => p2PromotionNodes.includes(pm.move.target));
          if (promoteJumps.length > 0) {
              chosenMove = promoteJumps[Math.floor(Math.random() * promoteJumps.length)];
          } else {
              chosenMove = jumpMoves[Math.floor(Math.random() * jumpMoves.length)];
          }
      } else {
          // Strategy: Promote > Random
          const promotionMoves = possibleMoves.filter(pm => p2PromotionNodes.includes(pm.move.target));
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
      const move = validMoves.find(m => String(m.target) === String(nodeId));
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
    
    // Quick Fix: If validMoves > 0 and they are jumps, and selectedPieceId is set...
    
    // But wait, standard turn start also allows picking pieces. 
    // Let's rely on 'turn' switching. If turn didn't switch, we are still P1.
    // If we force jump, we should ideally restrict interaction.
    
    // For this step, I'll allow clicking the SAME piece to see moves (already handled).
    // If they click a different piece WHILE chain jumping, we should block.
    // How to know chain jumping? -> add state 'isChainJumping'.
    
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
      
      const moves = calculateValidMoves(piece);
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
  
  // State to track if we are in a multi-jump sequence


  const executeMove = (move, pieceId = selectedPieceId) => {
      let movedPiece = pieces.find(p => p.id === pieceId);
      
      // King Promotion Check
      // Promote ONLY if turn ends? Or immediate? Standard is immediate but ends turn usually *unless* it can continue jumping AS A KING?
      // Standard checkers: Promoted piece ends turn immediately. 
      // Let's stick to simple: Promote immediately.
      let shouldPromote = false;
      if (!movedPiece.isKing) {
          const promotionNodes = getPromotionNodes(movedPiece.player);
          if (promotionNodes.includes(move.target)) shouldPromote = true;
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
             sounds.playCapture();
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
                 sounds.playCapture();
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
                    sounds.playWin();
                 } else {
                    sounds.playCapture();
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
          sounds.playMove();
      }
  };

  const handleReset = () => {
    setPieces(getInitialPieces(boardLayout));
    setTurn(1);
    setWinner(null);
    setSelectedPieceId(null);
    setTurn(1);
    setWinner(null);
    setSelectedPieceId(null);
    setValidMoves([]);
    setIsChainJumping(false); // Ensure chain state is reset
    sounds.playClick();
  };

  const toggleGameMode = () => {
      setGameMode(prev => {
          const next = prev === 'pvp' ? 'pvc' : 'pvp';
          handleReset();
          sounds.playClick();
          return next;
      });
  };

  const toggleBoardLayout = () => {
    const modes = ['standard', 'extended', 'square'];
    // Only allow cycling to Custom if it exists
    if (customConfig.pieces && customConfig.pieces.length > 0) {
        modes.push('custom');
    }
    
    setBoardLayout(prev => {
        const idx = modes.indexOf(prev);
        const next = modes[(idx + 1) % modes.length];
        return next;
    });
  };

  useEffect(() => {
    handleReset();
  }, [boardLayout]);

  const [showInfo, setShowInfo] = useState(false);

  const [theme, setTheme] = useState('light'); // 'light' or 'dark'

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // --- Visuals & Responsive Scaling ---
  const SPACING = 60;

  // --- Editor Logic ---
  const [editorNodes, setEditorNodes] = useState({});
  const [editorLines, setEditorLines] = useState([]); // Array of [id1, id2] pairs
  const [dragState, setDragState] = useState(null); // { startId: string, current: {x,y} }
  const [editTool, setEditTool] = useState('line'); // 'line', 'p1', 'p2', 'erase'
  const editorRef = React.useRef(null);

  const initializeEditor = () => {
      // Start with current board or empty 7x7?
      if (customConfig.nodes && Object.keys(customConfig.nodes).length > 0) {
          setEditorNodes(customConfig.nodes);
          // Load lines? We need to decompose chains back to segments for the editor
          // or just load if we store raw segments separately. 
          // For now, let's just clear lines or try to infer.
          // Better: Store 'segments' in customConfig too for editing purposes.
          setEditorLines(customConfig.segments || []);
      } else {
          setEditorNodes({});
          setEditorLines([]);
      }
      setIsEditing(true);
      setGameMode('pvc'); 
  };

  // Drag Handlers
  const handleMouseDown = (e, x, y) => {
      e.stopPropagation();
      if (editTool === 'line') {
          setDragState({ startId: `${x},${y}`, startX: x, startY: y, current: { x: 0, y: 0 } });
      }
  };

  const handleMouseMove = (e) => {
      if (!dragState) return;
      if (!editorRef.current) return;
      if (editTool !== 'line') return;
      
      const rect = editorRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setDragState(prev => ({ ...prev, current: { x: (x / rect.width) * 100, y: (y / rect.height) * 100 } }));
  };

  const handleMouseUp = (e, x, y) => {
      e.stopPropagation();
      
      // Handle Click Interactions (Place/Erase)
      // If we are NOT dragging (or very short drag), it's a click
      if (!dragState && editTool !== 'line') {
          toggleEditorNode(x, y);
          return;
      }
      
      // Handle Line Drag Finish
      if (dragState) {
          const startId = dragState.startId;
          const endId = `${x},${y}`;
          
          if (startId !== endId) {
              // Validate: Horizontal, Vertical, or Diagonal (dx=dy)
              const dx = Math.abs(x - dragState.startX);
              const dy = Math.abs(y - dragState.startY);
              
              if (dx === 0 || dy === 0 || dx === dy) {
                  // Add Segment
                  setEditorLines(prev => {
                       // Check if exists
                       const exists = prev.some(l => (l[0] === startId && l[1] === endId) || (l[0] === endId && l[1] === startId));
                       if (exists) return prev.filter(l => !((l[0] === startId && l[1] === endId) || (l[0] === endId && l[1] === startId))); // Toggle remove
                       return [...prev, [startId, endId]];
                  });

                  // Auto-create Nodes if they don't exist
                  setEditorNodes(prev => {
                      const newNodes = { ...prev };
                      // Start Node
                      if (!newNodes[startId]) {
                           newNodes[startId] = { x: dragState.startX, y: dragState.startY, label: '', type: 'empty' };
                      }
                      // End Node
                       if (!newNodes[endId]) {
                            newNodes[endId] = { x: x, y: y, label: '', type: 'empty' };
                       }
                       return newNodes;
                  });
                  sounds.playMove(); // Sound for line creation
              }

          }
          setDragState(null);
      }
  };
  
  // Clean up global mouse up if released outside
  useEffect(() => {
      const gUp = () => setDragState(null);
      window.addEventListener('mouseup', gUp);
      return () => window.removeEventListener('mouseup', gUp);
  }, []);

  const toggleEditorNode = (x, y) => {
      const id = `${x},${y}`;
      setEditorNodes(prev => {
          const newNodes = { ...prev };
          
          if (editTool === 'erase') {
             delete newNodes[id];
             sounds.playClick(); // Sound for erasing node/piece
             return newNodes;
          }

          const existing = newNodes[id];
          
          // Explicit Set Logic (Paint Mode)
          let targetType = 'empty';
          if (editTool === 'p1') targetType = 'p1';
          if (editTool === 'p2') targetType = 'p2';
          if (editTool === 'empty') targetType = 'empty';
          
          if (editTool === 'line') return prev;

          // Update or Create
          if (existing) {
              newNodes[id] = { ...existing, type: targetType };
          } else {
              newNodes[id] = { x, y, label: '', type: targetType };
          }
          
          sounds.playSelect(); // Sound for placing node/piece
          return newNodes;
      });
  };





  const saveCustomBoard = () => {
      // Helper defined locally to ensure scope availability
      const getAutoId = (n) => `${n.x},${n.y}`;

      // 1. Format Nodes
      const finalNodes = {};
      const finalPieces = [];
      const nodeArray = Object.values(editorNodes);
      
      nodeArray.forEach(n => {
          const id = getAutoId(n);
          finalNodes[id] = { x: n.x, y: n.y, label: '' };
          if (n.type === 'p1') finalPieces.push({ id: `p1-${id}`, player: 1, node: id, isKing: false }); 
          if (n.type === 'p2') finalPieces.push({ id: `p2-${id}`, player: 2, node: id, isKing: false });
      });

      if (finalPieces.length === 0) {
          console.warn("Save Failed: No pieces");
          alert("Place at least one piece!");
          return;
      }

      // 2. Generate Lines (Manual)
      let finalLines = [];
      try {
           finalLines = convertSegmentsToChains(editorLines);
           console.log("Converted Chains:", finalLines);
      } catch (err) {
           console.error("Chain conversion failed:", err);
      }
      
      if (finalLines.length === 0 && editorLines.length > 0) {
           console.log("Fallback to raw segments");
           // If algorithm fails but lines exist, fallback to raw segments (as 2-point lines)
           editorLines.forEach(seg => finalLines.push(seg));
      }

      const config = { nodes: finalNodes, lines: finalLines, pieces: finalPieces, segments: editorLines };
      
      console.log("Saving Config:", config);
      localStorage.setItem('qataar_custom_board', JSON.stringify(config));
      setCustomConfig(config);
      setIsEditing(false);
      setBoardLayout('custom'); 
      handleReset(); 
      sounds.playWin(); // Success sound
  };

  // Render Editor Grid
  const renderEditor = () => {
      // Stubbed for debugging
      return null;
  };


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

  // --- Visual Helper ---
  const getNodePos = (nodeId) => {
      // For Custom Mode, nodes are objects in customConfig.nodes
      if (boardLayout === 'custom') {
          const node = customConfig.nodes[nodeId];
          if (node) return { x: node.x * SPACING, y: node.y * SPACING };
          return { x: 0, y: 0 }; 
      }
      // For Standard/Square, nodes are in activeNodes keyed by ID (int or string)
      // activeNodes keys are "19", "7" etc.
      // activeNodes[nodeId] = { x, y ... }
      
      const node = activeNodes[nodeId];
      if (!node) return { x: 0, y: 0 };
      return { x: node.x * SPACING, y: node.y * SPACING };
  };

  // Theme Configs
  const colorSchemes = {
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
          bg: 'bg-zinc-950',
          text: 'text-zinc-100',
          subtext: 'text-zinc-500',
          p1: { bg: 'bg-zinc-100', text: 'text-zinc-900', border: 'border-zinc-100' },
          p2: { bg: 'bg-zinc-900', text: 'text-zinc-100', border: 'border-zinc-700' },
          lines: { outer: '#27272a', inner: '#71717a' },
          node: { valid: 'bg-zinc-100', default: 'bg-zinc-800' },
          indicator: { ring: 'border-zinc-100', glow: 'bg-white/5 hover:bg-white/10' }
      }
  };

  const colors = colorSchemes[theme];

  return (
    <div className={`w-full h-screen flex flex-col justify-between overflow-hidden ${colors.bg} ${colors.text} font-sans transition-colors duration-500`}>
        
        {/* Toggle Controls (Top) */}
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
            {/* Theme Toggle */}
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

            {/* Theme Toggle */}
            <button 
                onClick={() => { toggleTheme(); sounds.playClick(); }}
                className={`p-2 rounded-full border transition-all shadow-sm ml-2 ${theme === 'light' ? 'bg-white border-neutral-200 hover:bg-neutral-50' : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800'}`}
                title="Toggle Theme"
            >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
        </div>

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
                {/* SVG Background Layer */}
                <svg 
                    width="600" 
                    height="600" 
                    viewBox="0 0 600 600" 
                    className="absolute inset-0 pointer-events-none z-0"
                >
                    <g transform="translate(300, 300)">
                        {/* Outer Lines */}
                        {activeLines.map((line, i) => {
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
                         {activeLines.map((line, i) => {
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
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-0" style={{ transform: 'translate(300px, 300px)' }}>
                        {Object.entries(activeNodes).map(([id, node]) => {
                            const pos = getNodePos(id);
                            const isValidTarget = validMoves.some(m => String(m.target) === String(id));
                            
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
                <div className="absolute inset-0 pointer-events-none z-30">
                     <div className="absolute top-0 left-0" style={{ transform: 'translate(300px, 300px)' }}>
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
        {renderEditor()}

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

    </div>
  );
}


// Helper: Convert separate segments [[a,b], [b,c]] into chains [[a,b,c]]
const convertSegmentsToChains = (segments) => {
    if (!segments || segments.length === 0) return [];
    
    // Deep copy to avoid mutating source
    let pool = [...segments]; 
    const chains = [];

    while (pool.length > 0) {
        // Start a new chain with the first remaining segment
        let currentChain = [...pool.shift()]; 
        
        let changed = true;
        while (changed) {
            changed = false;
            // Try to extend head or tail
            const head = currentChain[0];
            const tail = currentChain[currentChain.length - 1];
            
            // Find a segment that connects to head or tail
            const matchIndex = pool.findIndex(seg => 
                seg[0] === head || seg[1] === head || seg[0] === tail || seg[1] === tail
            );
            
            if (matchIndex !== -1) {
                const seg = pool[matchIndex];
                pool.splice(matchIndex, 1);
                
                // Determine how to attach
                if (seg[0] === tail) {
                    currentChain.push(seg[1]); // A-B + B-C -> A-B-C
                } else if (seg[1] === tail) {
                    currentChain.push(seg[0]); // A-B + C-B -> A-B-C
                } else if (seg[1] === head) {
                    currentChain.unshift(seg[0]); // B-C + A-B -> A-B-C
                } else if (seg[0] === head) {
                    currentChain.unshift(seg[1]); // B-C + B-A -> A-B-C
                }
                changed = true;
            }
        }
        chains.push(currentChain);
    }
    return chains;
};



