import { SNAP_THRESHOLD } from '../config/constants';

// Round value to nearest grid threshold
// Round value to nearest grid threshold
export const snap = (v) => Math.round(v / SNAP_THRESHOLD) * SNAP_THRESHOLD;

// Helper: Convert separate segments [[a,b], [b,c]] into chains [[a,b,c]]
export const convertSegmentsToChains = (segments) => {
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
