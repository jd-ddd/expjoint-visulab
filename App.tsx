import React, { useState } from 'react';
import { JOINT_DATA } from './constants';
import { JointType, SimulationState } from './types';
import { BellowsVisualizer } from './components/BellowsVisualizer';
import { Controls } from './components/Controls';
import { Assistant } from './components/Assistant';
import { ChevronRight, Settings, Activity } from 'lucide-react';

const App: React.FC = () => {
  const [selectedJointType, setSelectedJointType] = useState<JointType>(JointType.AXIAL);
  const [simState, setSimState] = useState<SimulationState>({
    axial: 0,
    lateral: 0,
    angular: 0,
    showCrossSection: true,
    pressure: 0
  });

  const selectedJoint = JOINT_DATA.find(j => j.id === selectedJointType) || JOINT_DATA[0];

  const handleJointChange = (type: JointType) => {
    setSelectedJointType(type);
    // Reset incompatible states
    const newJoint = JOINT_DATA.find(j => j.id === type);
    setSimState(prev => ({
      ...prev,
      axial: newJoint?.allowedDeformation.axial ? prev.axial : 0,
      lateral: newJoint?.allowedDeformation.lateral ? prev.lateral : 0,
      angular: newJoint?.allowedDeformation.angular ? prev.angular : 0,
    }));
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-eng-900 text-gray-100 font-sans">
      {/* Header */}
      <header className="h-16 border-b border-eng-700 bg-eng-900 flex items-center px-6 justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Activity className="text-eng-accent" />
          <h1 className="text-xl font-bold tracking-wide">ExpJoint <span className="text-eng-accent font-light">VisuLab</span></h1>
        </div>
        <div className="text-xs text-eng-500 font-mono hidden md:block">
           v1.2.0 | 兼容 EJMA 标准 (EJMA Standards Compatible)
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar: Selection */}
        <aside className="w-64 bg-eng-800 border-r border-eng-700 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-xs font-semibold text-eng-500 uppercase tracking-wider mb-4">膨胀节类型 (Joint Types)</h2>
            <div className="space-y-2">
              {JOINT_DATA.map(joint => (
                <button
                  key={joint.id}
                  onClick={() => handleJointChange(joint.id)}
                  className={`w-full text-left p-3 rounded-lg text-sm transition-all flex items-center justify-between group
                    ${selectedJointType === joint.id 
                      ? 'bg-eng-700 text-white shadow-md border border-eng-600' 
                      : 'text-eng-400 hover:bg-eng-700/50 hover:text-gray-200'
                    }`}
                >
                  <span>{joint.name.split('(')[0]}</span>
                  {selectedJointType === joint.id && <ChevronRight size={14} className="text-eng-accent" />}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto p-4 border-t border-eng-700">
            <div className="text-xs text-eng-500 mb-2">当前规格说明:</div>
            <div className="bg-eng-900 p-3 rounded border border-eng-700">
              <h4 className="font-semibold text-sm mb-1 text-gray-200">{selectedJoint.name}</h4>
              <p className="text-xs text-gray-400 leading-relaxed line-clamp-4">
                {selectedJoint.description}
              </p>
            </div>
          </div>
        </aside>

        {/* Center: Visualization */}
        <main className="flex-1 flex flex-col relative bg-eng-900">
          <div className="absolute top-4 left-4 z-10 bg-eng-800/80 backdrop-blur px-3 py-1 rounded border border-eng-600 text-xs font-mono text-eng-highlight">
            模式: {simState.showCrossSection ? '剖面图 (SECTION)' : '实体渲染 (SOLID)'}
          </div>
          
          <BellowsVisualizer type={selectedJointType} simState={simState} />
          
          {/* Bottom Info Bar */}
          <div className="h-12 bg-eng-800 border-t border-eng-700 flex items-center px-6 gap-8 text-xs text-eng-400 shrink-0">
             <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${simState.axial !== 0 ? 'bg-yellow-500' : 'bg-eng-600'}`}></div>
               轴向载荷 (Axial)
             </div>
             <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${simState.lateral !== 0 ? 'bg-orange-500' : 'bg-eng-600'}`}></div>
               剪切应力 (Shear)
             </div>
             <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${simState.pressure > 20 ? 'bg-red-500' : 'bg-green-500'}`}></div>
               压力状态 (Pressure)
             </div>
          </div>
        </main>

        {/* Right Panel: Controls & AI */}
        <aside className="w-80 bg-eng-800 border-l border-eng-700 flex flex-col shrink-0">
           <div className="flex-1 overflow-hidden flex flex-col h-1/2 border-b border-eng-700">
             <Controls joint={selectedJoint} simState={simState} setSimState={setSimState} />
           </div>
           <div className="flex-1 overflow-hidden h-1/2">
             <Assistant selectedJoint={selectedJoint} simState={simState} />
           </div>
        </aside>

      </div>
    </div>
  );
};

export default App;