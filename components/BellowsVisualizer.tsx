import React from 'react';
import { SimulationState, JointType } from '../types';

interface BellowsVisualizerProps {
  type: JointType;
  simState: SimulationState;
}

export const BellowsVisualizer: React.FC<BellowsVisualizerProps> = ({ type, simState }) => {
  // Dimensions and Config
  const viewBoxW = 800;
  const viewBoxH = 500;
  const centerY = viewBoxH / 2;
  const bellowsRadius = 60; // Inner radius
  const convHeight = 25; // Height of convolution (amplitude)
  
  // Base Parameters
  const axialPx = (simState.axial / 100) * 40; 
  const baseAssemblyLen = 350;
  const currentTotalLen = baseAssemblyLen + (type === JointType.AXIAL || type === JointType.LATERAL ? axialPx : 0);

  // Type Flags
  const isUniversal = type === JointType.LATERAL;
  const isHinged = type === JointType.HINGED;
  const isGimbal = type === JointType.GIMBAL;

  // Layout Calculations
  const startX = (viewBoxW - currentTotalLen) / 2;
  
  // Deformations
  const lateralDisp = isUniversal || type === JointType.AXIAL ? (simState.lateral / 100) * 80 : 0;
  const angularRad = (simState.angular * Math.PI) / 180;
  
  // Helper to generate Accurate U-shaped Convolutions Path
  const generateBellowsStr = (length: number, count: number, isTop: boolean, direction: 'forward' | 'backward', bendAngle: number = 0) => {
    let d = "";
    const wPerConv = length / count;
    
    // Geometry Constants
    const rBase = bellowsRadius;
    const rPeak = bellowsRadius + convHeight;
    const yBaseOffset = isTop ? -rBase : rBase;
    const yPeakOffset = isTop ? -rPeak : rPeak;

    // Bending Constants
    const isBent = Math.abs(bendAngle) > 0.001;
    const R = isBent ? length / bendAngle : 0; 

    const transformPoint = (lx: number, ly: number) => {
        if (!isBent) {
            return { x: lx, y: ly };
        }
        const theta = (lx / length) * bendAngle;
        const r = R + ly;
        return { 
            x: r * Math.sin(theta), 
            y: R - r * Math.cos(theta)
        };
    };

    if (direction === 'forward') {
      const startPt = transformPoint(0, yBaseOffset);
      d += `M ${startPt.x} ${startPt.y} `;
      
      for (let i = 0; i < count; i++) {
        const s = i * wPerConv;
        const w = wPerConv;
        
        // Revised U-Shape Geometry
        // Use wider handles to create U-shape instead of Sine-shape
        const handleW = w * 0.35; // Increased from 0.1 to 0.35 for squarish U
        
        const x0 = s;
        const xPeak = s + w * 0.5;
        const xEnd = s + w;

        // Rise Curve (Base -> Peak)
        const cp1 = { x: x0 + handleW, y: yBaseOffset }; 
        const cp2 = { x: xPeak - handleW, y: yPeakOffset };
        const pPeak = { x: xPeak, y: yPeakOffset };
        
        // Fall Curve (Peak -> Base)
        const cp3 = { x: xPeak + handleW, y: yPeakOffset };
        const cp4 = { x: xEnd - handleW, y: yBaseOffset };
        const pEnd = { x: xEnd, y: yBaseOffset };

        const t_cp1 = transformPoint(cp1.x, cp1.y);
        const t_cp2 = transformPoint(cp2.x, cp2.y);
        const t_peak = transformPoint(pPeak.x, pPeak.y);
        
        const t_cp3 = transformPoint(cp3.x, cp3.y);
        const t_cp4 = transformPoint(cp4.x, cp4.y);
        const t_end = transformPoint(pEnd.x, pEnd.y);

        d += `C ${t_cp1.x} ${t_cp1.y}, ${t_cp2.x} ${t_cp2.y}, ${t_peak.x} ${t_peak.y} `;
        d += `C ${t_cp3.x} ${t_cp3.y}, ${t_cp4.x} ${t_cp4.y}, ${t_end.x} ${t_end.y} `;
      }
    } else {
      // Backward
      for (let i = count - 1; i >= 0; i--) {
        const s = i * wPerConv;
        const w = wPerConv;
        const handleW = w * 0.35;
        
        const xEnd = s; // Target (left)
        const xPeak = s + w * 0.5;
        const xStart = s + w; // Start (right)

        // Reverse logic
        const cp1 = { x: xStart - handleW, y: yBaseOffset };
        const cp2 = { x: xPeak + handleW, y: yPeakOffset };
        const pPeak = { x: xPeak, y: yPeakOffset };
        
        const cp3 = { x: xPeak - handleW, y: yPeakOffset };
        const cp4 = { x: xEnd + handleW, y: yBaseOffset };
        const pEnd = { x: xEnd, y: yBaseOffset };

        const t_cp1 = transformPoint(cp1.x, cp1.y);
        const t_cp2 = transformPoint(cp2.x, cp2.y);
        const t_peak = transformPoint(pPeak.x, pPeak.y);
        
        const t_cp3 = transformPoint(cp3.x, cp3.y);
        const t_cp4 = transformPoint(cp4.x, cp4.y);
        const t_end = transformPoint(pEnd.x, pEnd.y);

        d += `C ${t_cp1.x} ${t_cp1.y}, ${t_cp2.x} ${t_cp2.y}, ${t_peak.x} ${t_peak.y} `;
        d += `C ${t_cp3.x} ${t_cp3.y}, ${t_cp4.x} ${t_cp4.y}, ${t_end.x} ${t_end.y} `;
      }
    }
    return d;
  };

  // Generate Ribs for Solid View
  const generateSolidRibs = (length: number, count: number, angle: number = 0) => {
    const ribs = [];
    const wPerConv = length / count;
    const isBent = Math.abs(angle) > 0.001;
    const R = isBent ? length / angle : 0;

    for(let i=0; i<count; i++) {
       const midX = i * wPerConv + wPerConv * 0.5; // Peak
       const startX = i * wPerConv; // Valley Start
       // Valley End is next startX
       
       const getPt = (lx: number, ly: number) => {
         if(!isBent) return {x: lx, y: ly};
         const theta = (lx / length) * angle;
         const r = R + ly;
         return { x: r * Math.sin(theta), y: R - r * Math.cos(theta) };
       }

       // PEAK LINES (Lighter)
       // Top Peak
       let p1 = getPt(midX, -(bellowsRadius + convHeight));
       let p2 = getPt(midX, (bellowsRadius + convHeight));
       ribs.push(<path key={`peak-${i}`} d={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />);

       // VALLEY LINES (Darker)
       // Valley is at startX
       if (i > 0) { // Skip first edge
         let v1 = getPt(startX, -bellowsRadius);
         let v2 = getPt(startX, bellowsRadius);
         ribs.push(<path key={`valley-${i}`} d={`M ${v1.x} ${v1.y} L ${v2.x} ${v2.y}`} stroke="rgba(0,0,0,0.3)" strokeWidth="1" />);
       }
    }
    return ribs;
  };

  // Build Assembly Segments
  const segments = [];
  let rightFlangeTransform = { x: 0, y: 0, rot: 0 };
  let hardwarePivot = { x: currentTotalLen / 2, y: 0 }; // Default center

  if (isUniversal) {
    // Universal Kinematics (S-Curve)
    // Spool length fixed. Bellows length fixed.
    // To achieve Lateral Disp 'D' with 0 Angular Disp at ends.
    // Spool tilts by theta. Bellows bend by theta and -theta.
    
    const bellowsLen = currentTotalLen * 0.25;
    const spoolLen = currentTotalLen * 0.5;
    const totalEffectiveLen = bellowsLen * 2 + spoolLen;
    
    // Approx tilt angle for visual naturalness
    // D ~= L_total * sin(theta)
    const theta = Math.asin(Math.max(-0.8, Math.min(0.8, lateralDisp / totalEffectiveLen))); 
    const thetaDeg = theta * 180 / Math.PI;

    // Segment 1: Bellows. Starts 0,0. Curves UP to angle theta.
    segments.push({ 
      type: 'bellows', 
      isBent: true,
      angle: theta, 
      renderLen: bellowsLen,
      transform: `translate(0,0)`
    });

    // Calc End of Seg 1
    const R1 = Math.abs(theta) > 0.001 ? bellowsLen / theta : 0;
    const seg1End = Math.abs(theta) > 0.001 ? {
      x: R1 * Math.sin(theta),
      y: R1 - R1 * Math.cos(theta)
    } : { x: bellowsLen, y: 0 };

    // Segment 2: Spool. Straight pipe at angle theta.
    // Starts at seg1End.
    const spoolEnd = {
        x: seg1End.x + spoolLen * Math.cos(theta),
        y: seg1End.y + spoolLen * Math.sin(theta)
    };

    segments.push({ 
      type: 'spool', 
      x: seg1End.x, y: seg1End.y, 
      toX: spoolEnd.x, toY: spoolEnd.y,
      angle: thetaDeg
    });

    // Segment 3: Bellows. Starts at spoolEnd. Curves DOWN from theta to 0.
    // Local bend angle: -theta.
    // Important: My generateBellowsStr draws starting tangent to X-axis (0 deg).
    // The spool ends at angle theta.
    // So we translate to spoolEnd, rotate by theta, then draw bellows with bend -theta.
    
    segments.push({
      type: 'bellows',
      isBent: true,
      angle: -theta,
      renderLen: bellowsLen,
      transform: `translate(${spoolEnd.x}, ${spoolEnd.y}) rotate(${thetaDeg})`
    });

    // Calc End of Seg 3 (in global coords)
    // Local end of Seg 3
    const R3 = Math.abs(-theta) > 0.001 ? bellowsLen / (-theta) : 0;
    // Local coords (u,v)
    const u = Math.abs(-theta) > 0.001 ? R3 * Math.sin(-theta) : bellowsLen;
    const v = Math.abs(-theta) > 0.001 ? R3 - R3 * Math.cos(-theta) : 0;
    
    // Rotate (u,v) by theta and add to spoolEnd
    const finalX = spoolEnd.x + u * Math.cos(theta) - v * Math.sin(theta);
    const finalY = spoolEnd.y + u * Math.sin(theta) + v * Math.cos(theta);

    rightFlangeTransform = { x: finalX, y: finalY, rot: 0 }; 

  } else {
    // Single Unit (Axial/Hinged/Gimbal)
    // HINGED / GIMBAL Logic: Pivot around Hardware Center.
    
    let rot = simState.angular;
    let endX, endY;

    if (Math.abs(angularRad) > 0.001) {
       // Arc Chord calculation
       // If pivot is at (L/2, 0) relative to Start(0,0).
       // Actually, let's treat it as a pure arc of length L.
       const R = currentTotalLen / angularRad;
       
       // Center of curvature is at (0, R) relative to start tangent.
       // End point:
       endX = R * Math.sin(angularRad);
       endY = R - R * Math.cos(angularRad); 
       
       // If Hinged, the Hardware Pivot is physically at the middle of the chord? 
       // No, usually defined by the mechanical arms.
       // Let's assume the mechanical pivot is at the geometric "bulge" center for visual consistency.
       // Center of Arc:
       const midAngle = angularRad / 2;
       hardwarePivot = {
         x: R * Math.sin(midAngle),
         y: R - R * Math.cos(midAngle)
       };
       
       // Apply lateral shear if present (Axial/Gimbal might have some? No usually)
       endY += lateralDisp;
       hardwarePivot.y += lateralDisp / 2;

    } else {
       endX = currentTotalLen;
       endY = lateralDisp;
       hardwarePivot = { x: currentTotalLen/2, y: lateralDisp/2 };
    }

    segments.push({ 
        type: 'bellows', 
        isBent: Math.abs(angularRad) > 0.001,
        angle: angularRad,
        renderLen: currentTotalLen,
        transform: `translate(0,0)`
    });
    
    rightFlangeTransform = { x: endX, y: endY, rot: rot };
  }

  // Gradient definitions
  const defs = (
    <defs>
      <linearGradient id="metalGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#94a3b8" />
        <stop offset="40%" stopColor="#e2e8f0" />
        <stop offset="60%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
      <pattern id="hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="8" style={{stroke: '#38bdf8', strokeWidth: 1}} />
      </pattern>
    </defs>
  );

  return (
    <div className="w-full h-full flex items-center justify-center bg-eng-900 overflow-hidden relative">
      <svg width="100%" height="100%" viewBox={`0 0 ${viewBoxW} ${viewBoxH}`} preserveAspectRatio="xMidYMid meet">
        {defs}
        
        <g transform={`translate(${startX}, ${centerY})`}> 
          
          {segments.map((seg, i) => {
             let topFwd = "", botFwd = "", solidPath = "";
             
             if (seg.type === 'bellows') {
                const len = seg.renderLen;
                const angle = seg.angle || 0;
                const convCount = seg.conv || (isUniversal ? 5 : 10);
                
                topFwd = generateBellowsStr(len, convCount, true, 'forward', angle);
                botFwd = generateBellowsStr(len, convCount, false, 'forward', angle);
                const botBack = generateBellowsStr(len, convCount, false, 'backward', angle);
                
                // Closure line at the end
                let botEndX, botEndY;
                if(Math.abs(angle) > 0.001) {
                    const R = len / angle;
                    const rBot = R + bellowsRadius; // y offset +R
                    botEndX = rBot * Math.sin(angle);
                    botEndY = R - rBot * Math.cos(angle);
                } else {
                    botEndX = len;
                    botEndY = bellowsRadius;
                }
                
                solidPath = topFwd + `L ${botEndX} ${botEndY} ` + botBack + `Z`;
                
                const ribs = !simState.showCrossSection ? generateSolidRibs(len, convCount, angle) : null;

                return (
                 <g key={i} transform={seg.transform}>
                   {simState.showCrossSection ? (
                      <g>
                        <path d={topFwd} stroke="#38bdf8" strokeWidth="3" fill="none" />
                        <path d={botFwd} stroke="#38bdf8" strokeWidth="3" fill="none" />
                        <path d={solidPath} fill="url(#hatch)" opacity="0.15" stroke="none" />
                      </g>
                   ) : (
                      <g>
                        {/* Back face shading */}
                        <path d={solidPath} fill="#1e293b" stroke="none" transform="translate(0, -3)" opacity="0.5"/>
                        
                        {/* Main Body */}
                        <path 
                          d={solidPath}
                          fill="url(#metalGrad)" 
                          stroke="#475569"
                          strokeWidth="1"
                        />
                         {/* Ribs Overlay for 3D effect */}
                         <g opacity="0.7">{ribs}</g>

                        {/* Highlights */}
                        <path d={topFwd} stroke="white" strokeOpacity="0.2" strokeWidth="2" fill="none" />
                        <path d={botFwd} stroke="black" strokeOpacity="0.4" strokeWidth="2" fill="none" />
                      </g>
                   )}
                 </g>
               );
             }
             
             if (seg.type === 'spool') {
                const dx = seg.toX - seg.x;
                const dy = seg.toY - seg.y;
                const len = Math.sqrt(dx*dx + dy*dy);
                const angleDeg = seg.angle; 
                return (
                  <g key={i} transform={`translate(${seg.x}, ${seg.y}) rotate(${angleDeg})`}>
                    <rect x={-2} y={-bellowsRadius} width={len+4} height={bellowsRadius*2} fill="url(#metalGrad)" stroke="#334155" />
                    {!simState.showCrossSection && (
                        <>
                        <linearGradient id="pipeShine" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="0%" stopColor="white" stopOpacity="0.1"/>
                             <stop offset="40%" stopColor="white" stopOpacity="0.6"/>
                             <stop offset="60%" stopColor="black" stopOpacity="0.1"/>
                        </linearGradient>
                        <rect x={0} y={-bellowsRadius} width={len} height={bellowsRadius*2} fill="url(#pipeShine)" />
                        <line x1={0} y1={-bellowsRadius} x2={len} y2={-bellowsRadius} stroke="white" strokeOpacity="0.5" strokeWidth="1" />
                        <line x1={0} y1={bellowsRadius} x2={len} y2={bellowsRadius} stroke="black" strokeOpacity="0.5" strokeWidth="1" />
                        </>
                    )}
                  </g>
                );
             }
             return null;
          })}

          {/* End Flanges */}
          <g transform={`translate(0, 0)`}>
             <rect x={-20} y={-90} width={20} height={180} rx={2} fill="url(#metalGrad)" stroke="#475569" />
             <rect x={-40} y={-bellowsRadius} width={20} height={bellowsRadius*2} fill="#475569" />
          </g>

          <g transform={`translate(${rightFlangeTransform.x}, ${rightFlangeTransform.y}) rotate(${rightFlangeTransform.rot})`}>
             <rect x={0} y={-90} width={20} height={180} rx={2} fill="url(#metalGrad)" stroke="#475569" />
             <rect x={20} y={-bellowsRadius} width={20} height={bellowsRadius*2} fill="#475569" />
          </g>

          {/* Hardware Overlays - Dynamic Movement */}
          {isHinged && (
             <g pointerEvents="none">
                {/* Pivot Pin */}
                <g transform={`translate(${hardwarePivot.x}, ${hardwarePivot.y}) rotate(${simState.angular / 2})`}>
                    <circle cx={0} cy={0} r={14} fill="#cbd5e1" stroke="#334155" strokeWidth="2" />
                    <circle cx={0} cy={0} r={6} fill="#334155" />
                </g>

                {/* Left Arm (Fixed to Left) */}
                <path d={`M -10 -90 L ${hardwarePivot.x} ${hardwarePivot.y} L -10 90`} fill="none" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
                
                {/* Right Arm (Fixed to Right) */}
                <path d={`M ${rightFlangeTransform.x} ${rightFlangeTransform.y - 90} L ${hardwarePivot.x} ${hardwarePivot.y} L ${rightFlangeTransform.x} ${rightFlangeTransform.y + 90}`} fill="none" stroke="#64748b" strokeWidth="5" strokeLinecap="round" />
             </g>
          )}

          {isGimbal && (
             <g pointerEvents="none">
                 {/* Gimbal Ring moves to center and rotates half angle */}
                 <g transform={`translate(${hardwarePivot.x}, ${hardwarePivot.y}) rotate(${simState.angular / 2})`}>
                     <rect x={-40} y={-110} width={80} height={220} rx={12} fill="none" stroke="#475569" strokeWidth="8" />
                     {/* Pins */}
                     <circle cx={0} cy={-110} r={8} fill="#cbd5e1" stroke="#334155" />
                     <circle cx={0} cy={110} r={8} fill="#cbd5e1" stroke="#334155" />
                     <circle cx={-40} cy={0} r={8} fill="#94a3b8" stroke="#334155" />
                     <circle cx={40} cy={0} r={8} fill="#94a3b8" stroke="#334155" />
                 </g>
                 
                 {/* Arms */}
                 <path d={`M -10 0 L ${hardwarePivot.x - 40} ${hardwarePivot.y}`} stroke="#64748b" strokeWidth="4" strokeDasharray="4 2"/>
                 {/* Right arm connects Right Flange to Ring right side */}
                 <path d={`M ${rightFlangeTransform.x + 10} ${rightFlangeTransform.y} L ${hardwarePivot.x + 40} ${hardwarePivot.y}`} stroke="#64748b" strokeWidth="4" strokeDasharray="4 2"/>
             </g>
          )}

          {/* Flow Indicator */}
          <g transform="translate(-80, -120)" opacity="0.6">
             <text x="0" y="-15" fill="#38bdf8" fontSize="12" textAnchor="middle" style={{fontFamily: 'monospace'}}>FLOW</text>
             <line x1="-30" y1="0" x2="30" y2="0" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrowhead)" />
             <defs>
               <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                 <polygon points="0 0, 10 3.5, 0 7" fill="#38bdf8" />
               </marker>
             </defs>
          </g>

        </g>
      </svg>
      
      {/* Pressure Effect */}
      {simState.pressure > 0 && !simState.showCrossSection && (
         <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
             <div 
               className="w-3/4 h-1/2 rounded-full bg-red-500 blur-3xl opacity-0 transition-opacity duration-300" 
               style={{ opacity: simState.pressure / 200 }} 
             />
         </div>
      )}
    </div>
  );
};