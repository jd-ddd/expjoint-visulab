import React, { useState, useEffect, useRef } from 'react';
import { SimulationState, JointConfig } from '../types';
import { RefreshCw, Maximize2, MoveHorizontal, Gauge, Play, Pause } from 'lucide-react';

interface ControlsProps {
  joint: JointConfig;
  simState: SimulationState;
  setSimState: React.Dispatch<React.SetStateAction<SimulationState>>;
}

export const Controls: React.FC<ControlsProps> = ({ joint, simState, setSimState }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const timeRef = useRef<number>(0);
  const animationRef = useRef<number>(0);

  const handleChange = (key: keyof SimulationState, value: number) => {
    setSimState(prev => ({ ...prev, [key]: value }));
  };

  // Animation Loop
  useEffect(() => {
    if (isAnimating) {
      const animate = () => {
        timeRef.current += 0.03; // Speed
        const t = timeRef.current;
        
        setSimState(prev => {
          const newState = { ...prev };
          
          // Sine wave oscillation for allowed parameters
          if (joint.allowedDeformation.axial) {
            // Oscillate between -40% and 40%
            newState.axial = Math.sin(t) * 40;
          } else {
            newState.axial = 0;
          }

          if (joint.allowedDeformation.lateral) {
            // Oscillate 0 to 80% (Absolute value sine for one direction, or just sine for +/-)
            // Usually lateral is offset from center. Let's do +/- 50%
            newState.lateral = Math.abs(Math.sin(t)) * 60;
          } else {
            newState.lateral = 0;
          }

          if (joint.allowedDeformation.angular) {
            // Oscillate -15 to 15 deg
            newState.angular = Math.sin(t) * 15;
          } else {
            newState.angular = 0;
          }

          return newState;
        });

        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animationRef.current);
    }

    return () => cancelAnimationFrame(animationRef.current);
  }, [isAnimating, joint]);

  // Stop animation if joint type changes
  useEffect(() => {
    setIsAnimating(false);
    timeRef.current = 0;
  }, [joint.id]);

  const Slider = ({ 
    label, 
    value, 
    min, 
    max, 
    unit, 
    prop, 
    disabled,
    icon: Icon,
    step
  }: { 
    label: string, 
    value: number, 
    min: number, 
    max: number, 
    unit: string, 
    prop: keyof SimulationState,
    disabled: boolean,
    icon: any,
    step: number
  }) => (
    <div className={`mb-4 transition-opacity ${disabled ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
      <div className="flex justify-between items-center mb-1 text-sm text-gray-300">
        <span className="flex items-center gap-2"><Icon size={14} /> {label}</span>
        <span className="font-mono text-eng-highlight">{value.toFixed(1)}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => handleChange(prop, parseFloat(e.target.value))}
        className="w-full h-2 bg-eng-700 rounded-lg appearance-none cursor-pointer accent-eng-accent"
        disabled={disabled}
      />
    </div>
  );

  return (
    <div className="p-6 bg-eng-800 border-t border-eng-700 lg:border-t-0 lg:border-l h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6 border-b border-eng-600 pb-3">
        <h3 className="text-lg font-semibold text-white">仿真控制参数</h3>
        <button
          onClick={() => setIsAnimating(!isAnimating)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all shadow-lg ${
            isAnimating 
              ? 'bg-eng-accent text-white shadow-eng-accent/20 ring-1 ring-white/20' 
              : 'bg-eng-700 text-gray-300 hover:bg-eng-600 hover:text-white'
          }`}
        >
          {isAnimating ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
          {isAnimating ? '停止演示' : '自动往复演示'}
        </button>
      </div>
      
      <Slider 
        label="轴向变形 (Axial)" 
        value={simState.axial} 
        min={-50} 
        max={50} 
        step={0.1}
        unit="%" 
        prop="axial"
        disabled={!joint.allowedDeformation.axial || isAnimating}
        icon={Maximize2}
      />

      <Slider 
        label="横向位移 (Lateral)" 
        value={simState.lateral} 
        min={0} 
        max={100} 
        step={0.1}
        unit="%" 
        prop="lateral"
        disabled={!joint.allowedDeformation.lateral || isAnimating}
        icon={MoveHorizontal}
      />

      <Slider 
        label="角向旋转 (Angular)" 
        value={simState.angular} 
        min={-20} 
        max={20} 
        step={0.1}
        unit="°" 
        prop="angular"
        disabled={!joint.allowedDeformation.angular || isAnimating}
        icon={RefreshCw}
      />

      <div className="my-6 border-t border-eng-600"></div>

      <Slider 
        label="内部压力 (Pressure)" 
        value={simState.pressure} 
        min={0} 
        max={50} 
        step={1}
        unit=" bar" 
        prop="pressure"
        disabled={false}
        icon={Gauge}
      />

      <div className="mt-6 flex items-center gap-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            checked={simState.showCrossSection} 
            onChange={(e) => setSimState(prev => ({ ...prev, showCrossSection: e.target.checked }))}
            className="sr-only peer" 
          />
          <div className="w-11 h-6 bg-eng-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-eng-accent"></div>
          <span className="ml-3 text-sm font-medium text-gray-300">查看内部剖面 (Cross-Section)</span>
        </label>
      </div>

      <div className="mt-8 p-4 bg-eng-700/50 rounded-lg text-xs text-gray-400">
        <p className="mb-2 font-semibold text-gray-200">变形图例说明:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>轴向: 压缩 (-) / 拉伸 (+)</li>
          <li>横向: 垂直于流向的剪切运动</li>
          <li>角向: 围绕铰链/万向环的弯曲</li>
        </ul>
      </div>
    </div>
  );
};