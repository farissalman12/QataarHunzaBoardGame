import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PenTool, User, Trash2, Save, RotateCcw, Circle, Ban } from 'lucide-react';
import { snap, convertSegmentsToChains } from '../../utils/boardUtils';
import { BOARD_SIZE, SPACING } from '../../config/constants';

const BoardEditor = ({ isOpen, onClose, onSave, theme, colors, sounds, initialConfig }) => {
    const [editorNodes, setEditorNodes] = useState({});
    const [editorLines, setEditorLines] = useState([]); // Array of [id1, id2] pairs
    const [dragState, setDragState] = useState(null); // { startId: string, current: {x,y} }
    const [editTool, setEditTool] = useState('line'); // 'line', 'p1', 'p2', 'erase'
    const [editorCursor, setEditorCursor] = useState({ x: 0, y: 0 }); // Snapped Cursor
    const editorRef = useRef(null);

    // Helpers for Coordinate Conversion
    const CENTER = BOARD_SIZE / 2;
    const toPixel = (gridVal) => (gridVal * SPACING) + CENTER;
    const toGrid = (pixelVal) => Math.round((pixelVal - CENTER) / SPACING);
    
    // Pixel ID to Grid ID and back
    // PixelKey: "300,300" -> GridKey: "0,0"
    const pKeyToGKey = (pKey) => {
        const [px, py] = pKey.split(',').map(Number);
        return `${toGrid(px)},${toGrid(py)}`;
    };
    const gKeyToPKey = (gKey) => {
        const [gx, gy] = gKey.split(',').map(Number);
        return `${toPixel(gx)},${toPixel(gy)}`;
    };

    // Initialize Editor State when opened
    useEffect(() => {
        if (isOpen) {
            console.log("BoardEditor Output: Opening...", initialConfig);
            if (!initialConfig) {
                 setEditorNodes({});
                 setEditorLines([]);
                 return;
            }

            try {
                if (initialConfig.nodes && Object.keys(initialConfig.nodes).length > 0) {
                    // Convert Grid Coordinates (from Save) back to Pixel Coordinates (for Editor)
                    const pixelNodes = {};
                    Object.entries(initialConfig.nodes).forEach(([gId, node]) => {
                        let px = node.x;
                        let py = node.y;

                        // HEURISTIC: Detect if saved data is Grid or Pixel
                        // Grid is typically -5 to 5. Pixels are 0 to 600.
                        // If absolute value is small (< 15), assume Grid and convert.
                        // If large, assume it's already Pixel (Legacy).
                        const isGrid = Math.abs(px) < 15 && Math.abs(py) < 15;
                        
                        if (isGrid) {
                            px = toPixel(node.x);
                            py = toPixel(node.y);
                        }

                        // Validate Bounds (0 to 600)
                        if (isNaN(px) || isNaN(py)) {
                             console.warn("Invalid coordinate detected:", node);
                             return;
                        }
                        
                        // Clamp to canvas to prevent "all over the place"
                        px = Math.max(0, Math.min(600, px));
                        py = Math.max(0, Math.min(600, py));

                        const pId = `${px},${py}`;
                        pixelNodes[pId] = { ...node, x: px, y: py };
                    });
                    setEditorNodes(pixelNodes);

                    // Convert Lines (Segments) if they exist
                     const pixelSegments = (initialConfig.segments || []).map(seg => {
                         const [start, end] = seg;
                         const remap = (id) => {
                             const parts = String(id).split(',');
                             if (parts.length !== 2) return id;
                             const [ix, iy] = parts.map(Number);
                             // If it looks like Grid (-10 to 10), convert to Pixel
                             if (Math.abs(ix) <= 10 && Math.abs(iy) <= 10) {
                                 return gKeyToPKey(id);
                             }
                             return id; 
                         };
                         return [remap(start), remap(end)];
                     }).filter(([s, e]) => pixelNodes[s] && pixelNodes[e]);
                     
                    setEditorLines(pixelSegments);
                } else {
                    setEditorNodes({});
                    setEditorLines([]);
                }
            } catch (err) {
                console.error("BoardEditor specific error:", err);
                // Fallback to empty to prevent UI freeze
                setEditorNodes({});
                setEditorLines([]);
            }
        }
    }, [isOpen, initialConfig]);

    const [errorMessage, setErrorMessage] = useState(null); // Validation feedback

    // --- Interaction Handlers ---

    // Helper: Check if point c is on segment a-b
    const isPointOnSegment = (c, a, b) => {
        const threshold = 10; // Tolerance
        
        // 1. Check Bounds (Bounding Box)
        if (c.x < Math.min(a.x, b.x) - threshold || c.x > Math.max(a.x, b.x) + threshold ||
            c.y < Math.min(a.y, b.y) - threshold || c.y > Math.max(a.y, b.y) + threshold) {
            return false;
        }

        // 2. Cross Product for Collinearity
        // (cy - ay) * (bx - ax) - (cx - ax) * (by - ay)
        const cross = (c.y - a.y) * (b.x - a.x) - (c.x - a.x) * (b.y - a.y);
        if (Math.abs(cross) > 400) return false; // Increased tolerance slightly

        // 3. Dot Product for "Between-ness"
        const dot = (c.x - a.x) * (b.x - a.x) + (c.y - a.y) * (b.y - a.y);
        if (dot < 0) return false;
        
        const squaredLength = (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y);
        if (dot > squaredLength) return false;

        return true;
    };

    const getSnappedPos = (e) => {
        if (!editorRef.current) return { x: 0, y: 0 };
        const rect = editorRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        // Snap X and Y separately using the utility
        return { x: snap(x), y: snap(y) };
    };

    const rafRef = useRef(null);

    const handleMouseMove = (e) => {
        // Cancel any pending frame to avoid stacking
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
        }

        // Schedule new frame
        rafRef.current = requestAnimationFrame(() => {
            const rawPos = getSnappedPos(e);
            let finalPos = rawPos;

            if (dragState && editTool === 'line') {
                // Apply Angle Snapping (0, 45, 90 deg)
                const startX = dragState.startX;
                const startY = dragState.startY;
                let dx = rawPos.x - startX;
                let dy = rawPos.y - startY;
                const absDx = Math.abs(dx);
                const absDy = Math.abs(dy);

                if (absDy < absDx * 0.5) {
                    // Horizontal
                    dy = 0;
                } else if (absDx < absDy * 0.5) {
                    // Vertical
                    dx = 0;
                } else {
                    // Diagonal (45 deg)
                    const maxD = Math.max(absDx, absDy);
                    dx = Math.sign(dx) * maxD;
                    dy = Math.sign(dy) * maxD;
                }
                finalPos = { x: startX + dx, y: startY + dy };
            }

            setEditorCursor(finalPos);

            if (dragState) {
                setDragState(prev => ({ ...prev, current: finalPos }));
            }
        });
    };

    const handleMouseDown = (e) => {
        const pos = getSnappedPos(e);
        const pId = `${pos.x},${pos.y}`;
        setErrorMessage(null); // Clear errors on interaction

        if (editTool === 'line') {
            setDragState({ startX: pos.x, startY: pos.y, startId: pId, current: pos });
            // Ensure start node exists
            if (!editorNodes[pId]) {
                 setEditorNodes(prev => ({ ...prev, [pId]: { x: pos.x, y: pos.y, type: 'empty' } }));
            }
        } else if (editTool === 'erase') {
            // Remove node and connected lines
            const newNodes = { ...editorNodes };
            delete newNodes[pId];
            setEditorNodes(newNodes);
            
            setEditorLines(prev => prev.filter(([s, e]) => s !== pId && e !== pId));
            sounds.playClick(); 
        } else if (editTool === 'node') {
             // Strict Node Placement: MUST be on an existing line (Split Line)
             // 1. Check if node already exists
             if (editorNodes[pId]) {
                 setErrorMessage("Node already exists here!");
                 sounds.playError();
                 return;
             }

             // 2. Find lines that intersect with this point
             const linesToSplit = [];
             editorLines.forEach((line) => {
                 const n1 = editorNodes[line[0]];
                 const n2 = editorNodes[line[1]];
                 if (n1 && n2 && isPointOnSegment(pos, n1, n2)) {
                     linesToSplit.push(line);
                 }
             });

             if (linesToSplit.length > 0) {
                 // Create the Split Node
                 const newNodes = { 
                     ...editorNodes, 
                     [pId]: { x: pos.x, y: pos.y, type: 'empty' } 
                 };

                 // Rebuild Lines: Remove split lines, add new segments
                 const newLines = [];
                 const splitSet = new Set(linesToSplit);

                 // Keep lines that weren't split
                 editorLines.forEach(l => {
                     if (!splitSet.has(l)) newLines.push(l);
                 });

                 // Add new segments for split lines
                 linesToSplit.forEach(([start, end]) => {
                     newLines.push([start, pId]);
                     newLines.push([pId, end]);
                 });

                 setEditorNodes(newNodes);
                 setEditorLines(newLines);
                 sounds.playPop();
             } else {
                 setErrorMessage("Place Node ON a Line to split it!");
                 sounds.playError();
             }
        } else {
            // Place Piece (P1 or P2)
            const type = editTool; // 'p1' or 'p2'

            // CASE A: Node exists -> Toggle Piece
            if (editorNodes[pId]) {
                setEditorNodes(prev => ({
                    ...prev,
                    [pId]: { x: pos.x, y: pos.y, type: prev[pId]?.type === type ? 'empty' : type }
                }));
                sounds.playPop();
                return;
            }

            // CASE B: No Node -> Try to Split Line (Auto-Node)
            const linesToSplit = [];
            editorLines.forEach((line) => {
                 const n1 = editorNodes[line[0]];
                 const n2 = editorNodes[line[1]];
                 if (n1 && n2 && isPointOnSegment(pos, n1, n2)) {
                     linesToSplit.push(line);
                 }
            });

            if (linesToSplit.length > 0) {
                 // Create the Split Node with the PIECE
                 const newNodes = { 
                     ...editorNodes, 
                     [pId]: { x: pos.x, y: pos.y, type: type } // <--- Auto-set type to P1/P2
                 };

                 // Rebuild Lines
                 const newLines = [];
                 const splitSet = new Set(linesToSplit);

                 editorLines.forEach(l => {
                     if (!splitSet.has(l)) newLines.push(l);
                 });

                 linesToSplit.forEach(([start, end]) => {
                     newLines.push([start, pId]);
                     newLines.push([pId, end]);
                 });

                 setEditorNodes(newNodes);
                 setEditorLines(newLines);
                 sounds.playPop();
            } else {
                setErrorMessage("Place on a Line or existing Node!");
                sounds.playError();
            }
        }
    };

    const handleMouseUp = () => {
        if (dragState) {
            const startId = dragState.startId;
            const endPos = dragState.current;
            const endId = `${endPos.x},${endPos.y}`;

            if (startId !== endId) {
                // Ensure end node exists
                if (!editorNodes[endId]) {
                    setEditorNodes(prev => ({ ...prev, [endId]: { x: endPos.x, y: endPos.y, type: 'empty' } }));
                }

                // Add Line
                const newLine = [startId, endId];
                // Check duplicate
                const exists = editorLines.some(([s, e]) => 
                    (s === startId && e === endId) || (s === endId && e === startId)
                );

                if (!exists) {
                    setEditorLines(prev => [...prev, newLine]);
                    sounds.playSlide();
                }
            }
            setDragState(null);
        }
    };

    const handleClear = () => {
        if (window.confirm("Are you sure you want to clear the board?")) {
            setEditorNodes({});
            setEditorLines([]);
            setErrorMessage(null);
            sounds.playTrash(); 
        }
    };
    
    // New: Hard Reset to clear potentially corrupt local storage
    const handleHardReset = () => {
         if (window.confirm("Factory Reset: This will delete your custom board save data. Continue?")) {
             localStorage.removeItem('qataar_custom_board');
             onClose(); // Close editor
             window.location.reload(); // Hard refresh to clear memory
         }
    };

    const validateBoard = (nodes) => {
        const counts = { p1: 0, p2: 0 };
        const nodeKeys = Object.keys(nodes);
        if (nodeKeys.length === 0) return { error: "Board is empty!" };

        // 1. Check Piece Counts (FATAL ERROR)
        Object.values(nodes).forEach(n => {
            if (n.type === 'p1') counts.p1++;
            if (n.type === 'p2') counts.p2++;
        });

        if (counts.p1 === 0) return { error: "Missing Player 1 Pieces!" };
        if (counts.p2 === 0) return { error: "Missing Player 2 Pieces!" };
        
        // 2. Connectivity Check (WARNING)
        const adj = {};
        nodeKeys.forEach(k => adj[k] = []);
        editorLines.forEach(([s, e]) => {
            if (adj[s]) adj[s].push(e);
            if (adj[e]) adj[e].push(s);
        });

        const startNode = nodeKeys[0];
        const visited = new Set([startNode]);
        const queue = [startNode];

        while (queue.length > 0) {
            const curr = queue.shift();
            const neighbors = adj[curr] || [];
            neighbors.forEach(n => {
                if (!visited.has(n)) {
                    visited.add(n);
                    queue.push(n);
                }
            });
        }

        if (visited.size !== nodeKeys.length) {
             return { warning: "Board has disconnected parts! AI may behave strangely." };
        }

        return { success: true };
    };

    const handleSave = () => {
        // Validation Pre-check
        const result = validateBoard(editorNodes);
        
        if (result.error) {
            setErrorMessage(result.error);
            sounds.playError();
            return;
        }

        if (result.warning) {
            if (!window.confirm(`${result.warning}\n\nDo you want to save anyway?`)) {
                return;
            }
        }

        // 1. Format Nodes
        const finalNodes = {};
        const finalPieces = [];
        const nodeArray = Object.values(editorNodes);

        nodeArray.forEach(n => {
            const gx = toGrid(n.x);
            const gy = toGrid(n.y);
            const gId = `${gx},${gy}`;
            
            finalNodes[gId] = { x: gx, y: gy, label: '' };
            if (n.type === 'p1') finalPieces.push({ id: `p1-${gId}`, player: 1, node: gId, isKing: false }); 
            if (n.type === 'p2') finalPieces.push({ id: `p2-${gId}`, player: 2, node: gId, isKing: false });
        });

        // 2. Generate Lines with strict topology repair
        
        // Helper: geometry check (Grid Coords) - Strict Integer Collinearity
        const isBetween = (c, a, b) => { 
            // Cross product of integers must be exactly 0 for collinearity
            const cross = (c.y - a.y) * (b.x - a.x) - (c.x - a.x) * (b.y - a.y);
            if (cross !== 0) return false; 
            
            const dot = (c.x - a.x) * (b.x - a.x) + (c.y - a.y) * (b.y - a.y);
            if (dot <= 0) return false; // Exclude strict start point or behind
            
            const sqLen = (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y);
            if (dot >= sqLen) return false; // Exclude strict end point or beyond
            
            return true;
        };

        const dist = (a, b) => Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2);

        // Convert current editor lines to Grid Coordinates first
        const rawGridSegments = editorLines.map((seg, idx) => {
            const n1 = editorNodes[seg[0]];
            const n2 = editorNodes[seg[1]];
            if (!n1 || !n2) return null; 
            if (seg[0] === seg[1]) return null; // Ignore self-loops
            
            const a = { x: toGrid(n1.x), y: toGrid(n1.y), id: `${toGrid(n1.x)},${toGrid(n1.y)}` };
            const b = { x: toGrid(n2.x), y: toGrid(n2.y), id: `${toGrid(n2.x)},${toGrid(n2.y)}` };
            
            // Normalize order for key gen
            const [first, second] = [a.id, b.id].sort();
            return { a, b, idx, key: `${first}|${second}` };
        }).filter(s => s !== null);

        // Dedup Initial Raw Segments
        const uniqueRawKeys = new Set();
        const dedupedRawSegments = [];
        rawGridSegments.forEach(seg => {
            if (!uniqueRawKeys.has(seg.key)) {
                uniqueRawKeys.add(seg.key);
                dedupedRawSegments.push(seg);
            }
        });

        const allGridNodes = Object.entries(finalNodes).map(([id, n]) => ({ ...n, id }));
        let splitsFound = 0;
        let processedSegments = [];

        dedupedRawSegments.forEach(seg => {
            // Find all nodes that lie on this segment (excluding endpoints)
            const intersections = allGridNodes.filter(n => {
                if (n.id === seg.a.id || n.id === seg.b.id) return false;
                return isBetween(n, seg.a, seg.b);
            });

            if (intersections.length > 0) {
                 splitsFound++;
            }

            // Sort by distance from A
            intersections.sort((n1, n2) => dist(seg.a, n1) - dist(seg.a, n2));

            // Create sub-segments
            let current = seg.a;
            intersections.forEach(inter => {
                processedSegments.push([current.id, inter.id]);
                current = inter;
            });
            processedSegments.push([current.id, seg.b.id]);
        });

        // Final Dedup Processing
        const uniqueSegs = new Set();
        const cleanSegments = [];
        processedSegments.forEach(([id1, id2]) => {
            if (id1 === id2) return; 
            const key = [id1, id2].sort().join('|');
            if (!uniqueSegs.has(key)) {
                uniqueSegs.add(key);
                cleanSegments.push([id1, id2]);
            }
        });

        // Alert user if significant changes/cleanups occurred
        if (rawGridSegments.length !== dedupedRawSegments.length || splitsFound > 0) {
            console.log(`Graph Optimization: Removed ${rawGridSegments.length - dedupedRawSegments.length} dupes, Split ${splitsFound} lines.`);
        }

        let finalLines = [];
        try {
             finalLines = convertSegmentsToChains(cleanSegments);
        } catch (err) {
             console.error("Chain conversion failed:", err);
             finalLines = cleanSegments;
        }

        const config = { nodes: finalNodes, lines: finalLines, pieces: finalPieces, segments: cleanSegments };
        onSave(config);
    };

    if (!isOpen) return null;

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[100] flex flex-col items-center justify-center backdrop-blur-xl ${theme === 'light' ? 'bg-white/90' : 'bg-black/90'}`}
        >
            <div className="absolute top-4 right-4 z-[110]">
                <button onClick={onClose} className={`p-3 rounded-full ${theme === 'light' ? 'bg-neutral-100 hover:bg-neutral-200' : 'bg-neutral-800 hover:bg-neutral-700'}`}>
                    <X size={24} className={colors.text} />
                </button>
            </div>

            <div className="mb-6 text-center">
                <h2 className={`text-3xl font-bold uppercase tracking-widest ${colors.text}`}>Board Editor</h2>
                <p className={`text-xs uppercase tracking-wider opacity-60 mt-2 ${colors.subtext}`}>Drag to draw lines • Click to place pieces</p>
                
                {/* Error Banner */}
                <AnimatePresence>
                    {errorMessage && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-4 px-4 py-2 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2"
                        >
                           <span>⚠️ {errorMessage}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Editor Canvas */}
            <div 
                ref={editorRef}
                className={`relative shadow-2xl rounded-xl border overflow-hidden cursor-none ${theme === 'light' ? 'bg-white border-neutral-200' : 'bg-neutral-900 border-neutral-800'}`}
                style={{ width: 600, height: 600 }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            >
                {/* Grid Background */}
                <div className={`absolute inset-0 opacity-10 ${theme === 'light' ? 'bg-[radial-gradient(#000_1px,transparent_1px)]' : 'bg-[radial-gradient(#fff_1px,transparent_1px)]'} [background-size:60px_60px]`} />

                <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
                    {/* Existing Lines */}
                    {editorLines.map((line, i) => {
                        const [startId, endId] = line;
                        const n1 = editorNodes[startId];
                        const n2 = editorNodes[endId];
                        if (!n1 || !n2) return null;
                        return (
                            <line 
                                key={i} 
                                x1={n1.x} y1={n1.y} 
                                x2={n2.x} y2={n2.y} 
                                stroke={theme === 'light' ? '#262626' : '#e5e5e5'} 
                                strokeWidth="6" 
                                strokeLinecap="round" 
                            />
                        );
                    })}
                    {/* Dragging Line */}
                    {dragState && (
                        <line 
                            x1={dragState.startX} 
                            y1={dragState.startY} 
                            x2={dragState.current.x}
                            y2={dragState.current.y}
                            stroke={theme === 'light' ? '#3b82f6' : '#60a5fa'} 
                            strokeWidth="4" 
                            strokeDasharray="10,5" 
                            strokeLinecap="round" 
                        />
                    )}
                </svg>
                
                {/* Ghost Cursor (Movable Point Placer) (Only show if tool is NOT piece, OR if it is piece but valid)
                    Actually, we just show specific cursors based on tool/validity.
                */}
                {!dragState && (
                    <>
                        {/* Standard Cursor for Draw/Node/Erase */}
                        {(editTool === 'line' || editTool === 'node' || editTool === 'erase') && (
                             <div 
                                className={`absolute pointer-events-none w-6 h-6 -ml-3 -mt-3 rounded-full border-2 
                                ${editTool === 'erase' ? 'border-red-500 bg-red-500/20' : 'border-yellow-400 bg-yellow-400/20'} 
                                z-50 transition-all duration-75`}
                                style={{ left: editorCursor.x, top: editorCursor.y }}
                             >
                                 {editTool === 'erase' && <Trash2 size={16} className="text-red-500 absolute -top-[2px] -left-[2px]" />}
                             </div>
                        )}

                        {/* Smart Ghost for Pieces (P1/P2) */}
                        {(editTool === 'p1' || editTool === 'p2') && (
                             <div 
                                className="absolute pointer-events-none z-50 -ml-4 -mt-4 transition-all duration-75"
                                style={{ left: editorCursor.x, top: editorCursor.y }}
                             >
                                 {/* Check Validity */}
                                 {editorNodes[`${editorCursor.x},${editorCursor.y}`] ? (
                                    <div className={`w-8 h-8 rounded-full border-2 opacity-60
                                        ${editTool === 'p1' ? 'bg-blue-500 border-white' : 'bg-red-500 border-white'}`} 
                                    />
                                 ) : (
                                    <div className="w-8 h-8 flex items-center justify-center bg-red-500/10 rounded-full">
                                        <Ban size={24} className="text-red-500" />
                                    </div>
                                 )}
                             </div>
                        )}
                    </>
                )}

                {/* Nodes */}
                {Object.entries(editorNodes).map(([id, n]) => (
                    <div 
                        key={id} 
                        className={`absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 transition-transform hover:scale-150 z-20 
                        ${n.type === 'empty' ? (theme === 'light' ? 'bg-neutral-900 border-white' : 'bg-white border-neutral-900') : ''}
                        ${n.type === 'p1' ? 'bg-blue-500 border-white' : ''}
                        ${n.type === 'p2' ? 'bg-red-500 border-white' : ''}`}
                        style={{ left: n.x, top: n.y }}
                    >
                            {n.type === 'p1' && <div className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-bold">1</div>}
                            {n.type === 'p2' && <div className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-bold">2</div>}
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className={`mt-8 flex gap-4 p-2 rounded-2xl border shadow-xl ${theme === 'light' ? 'bg-white border-neutral-200' : 'bg-zinc-900 border-zinc-800'}`}>
                {[
                    { id: 'node', icon: Circle, label: 'Node' },
                    { id: 'line', icon: PenTool, label: 'Draw' },
                    { id: 'p1', icon: User, label: 'P1' },
                    { id: 'p2', icon: User, label: 'P2', color: 'text-red-500' }, 
                    { id: 'erase', icon: Trash2, label: 'Erase' },
                ].map(tool => (
                    <button
                        key={tool.id}
                        onClick={() => { setEditTool(tool.id); sounds.playClick(); }}
                        className={`p-4 rounded-xl flex flex-col items-center gap-1 min-w-[80px] transition-all
                        ${editTool === tool.id 
                            ? (theme === 'light' ? 'bg-neutral-900 text-white' : 'bg-white text-black') 
                            : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                    >
                        <tool.icon size={20} className={tool.color || ''} />
                        <span className="text-[10px] uppercase font-bold tracking-wider">{tool.label}</span>
                    </button>
                ))}
                
                <div className={`w-[1px] ${theme === 'light' ? 'bg-neutral-200' : 'bg-neutral-800'}`} />

                 {/* Clear Button */}
                 <button
                    onClick={handleClear}
                    className={`p-4 rounded-xl flex flex-col items-center gap-1 min-w-[80px] hover:bg-red-500/10 text-red-500 transition-all`}
                    title="Clear Board"
                >
                    <RotateCcw size={20} />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Clear</span>
                </button>

                <button
                    onClick={handleHardReset}
                    className={`p-4 rounded-xl flex flex-col items-center gap-1 min-w-[80px] hover:bg-neutral-500/10 text-neutral-500 transition-all`}
                    title="Factory Reset (Fix Bugs)"
                >
                    <RotateCcw size={20} />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Reset</span>
                </button>

                <button
                    onClick={handleSave}
                    className={`p-4 rounded-xl flex flex-col items-center gap-1 min-w-[80px] bg-green-500 text-white hover:bg-green-600 transition-all`}
                >
                    <Save size={20} />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Save</span>
                </button>
            </div>
        </motion.div>
    );
};

export default BoardEditor;
