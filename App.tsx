
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Cpu, 
  ShieldCheck, 
  ShieldAlert, 
  Activity,
  TrendingUp,
  Zap,
  Layers,
  Users,
  Gauge,
  Terminal,
  Server,
  Info,
  ChevronRight,
  Database,
  Link
} from 'lucide-react';
import { ThreadStatus, SimulationState, LogEntry, ThreadInfo } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<SimulationState>({
    buffer: [],
    bufferSize: 8,
    producers: [],
    consumers: [],
    isMutexLocked: false,
    emptyCount: 8,
    fullCount: 0,
    producedCount: 0,
    consumedCount: 0,
    logs: [],
    isRunning: false,
    producerSpeed: 1000,
    consumerSpeed: 1500,
    numProducers: 2,
    numConsumers: 2,
  });

  const [simMode, setSimMode] = useState<'normal' | 'fast-p' | 'fast-c'>('normal');

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    setState(prev => ({
      ...prev,
      producers: Array.from({ length: prev.numProducers }, (_, i) => ({
        id: i + 1,
        type: 'PRODUCER',
        status: prev.isRunning ? (prev.producers[i]?.status || ThreadStatus.IDLE) : ThreadStatus.IDLE
      })),
      consumers: Array.from({ length: prev.numConsumers }, (_, i) => ({
        id: i + 1 + 10,
        type: 'CONSUMER',
        status: prev.isRunning ? (prev.consumers[i]?.status || ThreadStatus.IDLE) : ThreadStatus.IDLE
      }))
    }));
  }, [state.numProducers, state.numConsumers, state.isRunning]);

  const activeLoops = useRef<Set<string>>(new Set());

  const addLog = useCallback((sender: LogEntry['sender'], message: string) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      sender,
      message,
    };
    setState(prev => ({
      ...prev,
      logs: [newLog, ...prev.logs].slice(0, 50)
    }));
  }, []);

  const resetSimulation = () => {
    activeLoops.current.clear();
    setState(prev => ({
      ...prev,
      buffer: [],
      isMutexLocked: false,
      emptyCount: prev.bufferSize,
      fullCount: 0,
      producedCount: 0,
      consumedCount: 0,
      logs: [],
      isRunning: false,
      producers: prev.producers.map(t => ({ ...t, status: ThreadStatus.IDLE })),
      consumers: prev.consumers.map(t => ({ ...t, status: ThreadStatus.IDLE })),
    }));
    addLog('SYSTEM', 'Kernel memory wipe successful. System standby.');
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const updateThreadStatus = (type: 'PRODUCER' | 'CONSUMER', id: number, status: ThreadStatus) => {
    setState(prev => ({
      ...prev,
      [type === 'PRODUCER' ? 'producers' : 'consumers']: prev[type === 'PRODUCER' ? 'producers' : 'consumers'].map(t => 
        t.id === id ? { ...t, status } : t
      )
    }));
  };

  const producerLoop = async (id: number) => {
    const loopKey = `P-${id}`;
    if (activeLoops.current.has(loopKey)) return;
    activeLoops.current.add(loopKey);

    while (stateRef.current.isRunning) {
      if (!stateRef.current.producers.some(p => p.id === id)) break;

      addLog('PRODUCER', `Thread 0x${id.toString(16).toUpperCase()} requesting EMPTY SEMAPHORE.`);
      updateThreadStatus('PRODUCER', id, ThreadStatus.WAITING_SEMAPHORE);
      while (stateRef.current.isRunning && stateRef.current.emptyCount <= 0) await sleep(200);
      if (!stateRef.current.isRunning) break;

      setState(prev => ({ ...prev, emptyCount: Math.max(0, prev.emptyCount - 1) }));
      updateThreadStatus('PRODUCER', id, ThreadStatus.WAITING_MUTEX);
      while (stateRef.current.isRunning && stateRef.current.isMutexLocked) await sleep(200);
      if (!stateRef.current.isRunning) {
        setState(prev => ({ ...prev, emptyCount: prev.emptyCount + 1 }));
        break;
      }

      setState(prev => ({ ...prev, isMutexLocked: true }));
      updateThreadStatus('PRODUCER', id, ThreadStatus.CRITICAL_SECTION);
      addLog('PRODUCER', `Thread 0x${id.toString(16).toUpperCase()} obtained MUTEX LOCK.`);
      await sleep(stateRef.current.producerSpeed / 2);

      const newItem = Math.floor(Math.random() * 90) + 10;
      addLog('PRODUCER', `Thread 0x${id.toString(16).toUpperCase()} produced data item [${newItem}].`);
      setState(prev => ({
        ...prev,
        buffer: [...prev.buffer, newItem],
        producedCount: prev.producedCount + 1,
        isMutexLocked: false,
        fullCount: prev.fullCount + 1
      }));
      
      updateThreadStatus('PRODUCER', id, ThreadStatus.WORKING);
      await sleep(stateRef.current.producerSpeed);
    }
    updateThreadStatus('PRODUCER', id, ThreadStatus.IDLE);
    activeLoops.current.delete(loopKey);
  };

  const consumerLoop = async (id: number) => {
    const loopKey = `C-${id}`;
    if (activeLoops.current.has(loopKey)) return;
    activeLoops.current.add(loopKey);

    while (stateRef.current.isRunning) {
      if (!stateRef.current.consumers.some(c => c.id === id)) break;

      addLog('CONSUMER', `Thread 0x${id.toString(16).toUpperCase()} requesting FULL SEMAPHORE.`);
      updateThreadStatus('CONSUMER', id, ThreadStatus.WAITING_SEMAPHORE);
      while (stateRef.current.isRunning && stateRef.current.fullCount <= 0) await sleep(200);
      if (!stateRef.current.isRunning) break;

      setState(prev => ({ ...prev, fullCount: Math.max(0, prev.fullCount - 1) }));
      updateThreadStatus('CONSUMER', id, ThreadStatus.WAITING_MUTEX);
      while (stateRef.current.isRunning && stateRef.current.isMutexLocked) await sleep(200);
      if (!stateRef.current.isRunning) {
        setState(prev => ({ ...prev, fullCount: prev.fullCount + 1 }));
        break;
      }

      setState(prev => ({ ...prev, isMutexLocked: true }));
      updateThreadStatus('CONSUMER', id, ThreadStatus.CRITICAL_SECTION);
      addLog('CONSUMER', `Thread 0x${id.toString(16).toUpperCase()} obtained MUTEX LOCK.`);
      await sleep(stateRef.current.consumerSpeed / 2);

      setState(prev => {
        const [consumed, ...rest] = prev.buffer;
        addLog('CONSUMER', `Thread 0x${id.toString(16).toUpperCase()} consumed data item [${consumed}].`);
        return {
          ...prev,
          buffer: rest,
          consumedCount: prev.consumedCount + 1,
          isMutexLocked: false,
          emptyCount: prev.emptyCount + 1
        };
      });
      
      updateThreadStatus('CONSUMER', id, ThreadStatus.WORKING);
      await sleep(stateRef.current.consumerSpeed);
    }
    updateThreadStatus('CONSUMER', id, ThreadStatus.IDLE);
    activeLoops.current.delete(loopKey);
  };

  useEffect(() => {
    if (state.isRunning) {
      for (let i = 0; i < state.numProducers; i++) producerLoop(state.producers[i].id);
      for (let i = 0; i < state.numConsumers; i++) consumerLoop(state.consumers[i].id);
    }
  }, [state.isRunning]);

  useEffect(() => {
    if (simMode === 'fast-p') setState(prev => ({ ...prev, producerSpeed: 500, consumerSpeed: 2000 }));
    else if (simMode === 'fast-c') setState(prev => ({ ...prev, producerSpeed: 2000, consumerSpeed: 500 }));
    else setState(prev => ({ ...prev, producerSpeed: 1000, consumerSpeed: 1200 }));
  }, [simMode]);

  return (
    <div className="h-screen bg-[#020203] text-[#e4e4e7] p-4 flex flex-col gap-4 overflow-hidden selection:bg-cyan-500/30 font-sans relative">
      {/* Visual background elements for "Amazing" look */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-scan"></div>
      </div>

      <header className="relative flex items-center justify-between shrink-0 z-10 px-2 border-b border-zinc-800/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            <Cpu className="text-cyan-400" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-[0.2em] text-zinc-100 uppercase italic">
              THREAD<span className="text-cyan-500">SYNC</span> <span className="text-[10px] not-italic text-zinc-500 tracking-widest font-black ml-2">CORE-OS VISUALIZER</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-1.5 rounded-full bg-cyan-950/20 border border-cyan-500/30 flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_#22d3ee]"></div>
             <span className="text-[10px] font-black tracking-widest text-cyan-400 uppercase">KERNEL-RT ACTIVE</span>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-12 gap-4 flex-1 min-h-0 z-10">
        {/* LEFT COLUMN: System Config & Registry */}
        <div className="col-span-3 flex flex-col gap-4 min-h-0">
          <section className="bg-[#0b0b0d] border border-zinc-800 p-5 rounded-[2rem] flex flex-col gap-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Settings size={64} className="animate-spin-slow" />
            </div>
            <h3 className="text-zinc-500 font-black flex items-center gap-2 uppercase text-[10px] tracking-[0.2em]">
              <Settings size={14} className="text-cyan-500" /> SYSTEM PARAMETERS
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-zinc-400 text-[9px] uppercase font-black tracking-widest">SHARED BUFFER CAPACITY</label>
                  <span className="text-cyan-400 font-black text-xl leading-none mono">{state.bufferSize}</span>
                </div>
                <input 
                  type="range" min="1" max="12" step="1"
                  value={state.bufferSize}
                  onChange={(e) => {
                    const newSize = parseInt(e.target.value);
                    const oldSize = state.bufferSize;
                    setState(prev => ({
                      ...prev,
                      bufferSize: newSize,
                      emptyCount: Math.max(0, prev.emptyCount + (newSize - oldSize)),
                      buffer: prev.buffer.slice(0, newSize)
                    }));
                  }}
                  className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-zinc-500 text-[8px] font-black uppercase tracking-widest block">PRODUCER COUNT</span>
                  <select 
                    value={state.numProducers}
                    onChange={(e) => setState(prev => ({ ...prev, numProducers: parseInt(e.target.value) }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-[10px] text-white font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                  >
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Threads</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <span className="text-zinc-500 text-[8px] font-black uppercase tracking-widest block">CONSUMER COUNT</span>
                  <select 
                    value={state.numConsumers}
                    onChange={(e) => setState(prev => ({ ...prev, numConsumers: parseInt(e.target.value) }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-[10px] text-white font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                  >
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Threads</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-zinc-500 text-[8px] font-black uppercase tracking-widest block">SCHEDULING STRATEGY</span>
                <div className="grid grid-cols-3 gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                  {(['normal', 'fast-p', 'fast-c'] as const).map(m => (
                    <button key={m} onClick={() => setSimMode(m)} className={`py-2 text-[8px] font-black rounded-lg transition-all ${simMode === m ? 'bg-zinc-800 text-cyan-400 shadow-lg ring-1 ring-white/5' : 'text-zinc-600 hover:text-zinc-400'}`}>
                      {m === 'normal' ? 'BALANCED' : m === 'fast-p' ? 'PROD+' : 'CONS+'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-[#0b0b0d] border border-zinc-800 p-5 rounded-[2rem] flex-1 flex flex-col min-h-0 shadow-2xl">
            <h3 className="text-zinc-500 font-black mb-4 flex items-center gap-2 uppercase text-[10px] tracking-[0.2em]">
              <Users size={14} className="text-cyan-500" /> PROCESS REGISTRY
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
              {[...state.producers, ...state.consumers].map((t, idx) => (
                <div key={idx} className="bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800 flex items-center justify-between group transition-all hover:border-zinc-700 hover:bg-zinc-900">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${t.type === 'PRODUCER' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                      {t.type === 'PRODUCER' ? <Zap size={14} /> : <TrendingUp size={14} />}
                    </div>
                    <div>
                      <span className="text-[10px] font-black block text-zinc-200">{t.type} {t.type === 'PRODUCER' ? t.id : t.id - 10}</span>
                      <span className="text-[8px] text-zinc-600 mono font-bold uppercase tracking-tighter">PID: 0x{t.id.toString(16).padStart(2, '0').toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-lg border border-transparent tracking-widest ${getStatusStyle(t.status)}`}>
                      {t.status.replace(/_/g, ' ')}
                    </span>
                    {t.status !== ThreadStatus.IDLE && (
                       <div className="w-10 h-1 bg-zinc-800 rounded-full overflow-hidden">
                         <div className={`h-full animate-pulse-progress ${t.type === 'PRODUCER' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                       </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* MIDDLE COLUMN: Buffer and Semaphores */}
        <div className="col-span-6 flex flex-col gap-4 min-h-0">
          <div className="grid grid-cols-3 gap-4 shrink-0">
            <div className="bg-[#0b0b0d] border border-zinc-800 p-5 rounded-[2rem] flex flex-col items-center justify-center text-center shadow-xl group transition-all hover:bg-zinc-900/80">
              <span className="text-[9px] uppercase font-black text-zinc-500 mb-1 tracking-widest">EMPTY SEMAPHORE</span>
              <div className="text-4xl font-black text-cyan-400 mono tracking-tighter group-hover:scale-110 transition-transform">{state.emptyCount}</div>
              <span className="text-[7px] text-zinc-600 uppercase mt-1 font-bold">AVAIL SLOTS</span>
            </div>
            <div className="bg-[#0b0b0d] border border-zinc-800 p-5 rounded-[2rem] flex flex-col items-center justify-center text-center shadow-xl group transition-all hover:bg-zinc-900/80">
              <span className="text-[9px] uppercase font-black text-zinc-500 mb-1 tracking-widest">FULL SEMAPHORE</span>
              <div className="text-4xl font-black text-rose-500 mono tracking-tighter group-hover:scale-110 transition-transform animate-pulse">{state.fullCount}</div>
              <span className="text-[7px] text-zinc-600 uppercase mt-1 font-bold">FILLED SLOTS</span>
            </div>
            <div className={`bg-[#0b0b0d] border ${state.isMutexLocked ? 'border-rose-500/50 bg-rose-500/5' : 'border-cyan-500/30'} p-5 rounded-[2rem] flex flex-col items-center justify-center text-center shadow-xl transition-all duration-500`}>
              <span className="text-[9px] uppercase font-black text-zinc-500 mb-1 tracking-widest">MUTUAL EXCLUSION LOCK</span>
              <div className="flex items-center justify-center gap-3">
                {state.isMutexLocked ? (
                  <ShieldAlert size={28} className="text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]" />
                ) : (
                  <ShieldCheck size={28} className="text-cyan-500" />
                )}
                <span className={`text-[10px] font-black tracking-[0.2em] ${state.isMutexLocked ? 'text-rose-500' : 'text-cyan-500'}`}>{state.isMutexLocked ? 'LOCKED' : 'FREE'}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-[#0b0b0d]/50 border border-zinc-800/80 rounded-[3rem] p-8 flex flex-col relative min-h-0 shadow-inner group overflow-hidden backdrop-blur-sm">
             {/* Center Glow */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-cyan-500/5 blur-[120px] pointer-events-none rounded-full"></div>

             <div className="flex flex-col items-center gap-1 shrink-0 z-10 mb-10">
                <div className="flex items-center gap-3">
                  <Database className="text-cyan-500" size={18} />
                  <h2 className="text-zinc-100 font-black text-xs tracking-[0.6em] uppercase">GLOBAL SHARED DATA BUFFER</h2>
                </div>
                <div className="w-48 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mt-2"></div>
             </div>

             <div className="flex-1 flex flex-wrap justify-center items-center content-center gap-8 md:gap-12 z-10 max-w-4xl mx-auto overflow-y-auto custom-scrollbar px-6 pb-6">
                {Array.from({ length: state.bufferSize }).map((_, idx) => {
                  const item = state.buffer[idx];
                  const isActive = item !== undefined;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-4 group">
                      <div 
                        className={`w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] border-2 flex items-center justify-center transition-all duration-700 relative ${
                          isActive 
                            ? 'bg-cyan-500/10 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.2)] scale-110 rotate-12' 
                            : 'bg-black/40 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {isActive ? (
                          <div className="flex flex-col items-center animate-in zoom-in spin-in-12 duration-500">
                             <span className="text-white font-black text-2xl mono tracking-tighter drop-shadow-lg">{item}</span>
                          </div>
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 group-hover:bg-zinc-600 transition-colors"></div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border border-black flex items-center justify-center text-[6px] font-bold ${isActive ? 'bg-cyan-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                          {idx}
                        </div>
                      </div>
                      <span className="text-[7px] text-zinc-600 font-black mono uppercase tracking-widest whitespace-nowrap opacity-60">SLOT ADDRESS_{idx.toString().padStart(2, '0')}</span>
                    </div>
                  );
                })}
             </div>

             {/* Counters Pinned Bottom */}
             <div className="mt-auto border-t border-zinc-800/40 pt-10 flex items-center justify-center gap-16 md:gap-24 shrink-0 z-10">
                <div className="flex flex-col items-center group">
                   <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2 group-hover:text-emerald-500 transition-colors">
                     <Zap size={12} className="text-emerald-500" /> TOTAL PRODUCED
                   </span>
                   <span className="text-4xl font-black text-white mono leading-none drop-shadow-xl">{state.producedCount}</span>
                </div>
                <div className="w-[1px] h-12 bg-zinc-800"></div>
                <div className="flex flex-col items-center group">
                   <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2 group-hover:text-rose-500 transition-colors">
                     <TrendingUp size={12} className="text-rose-500" /> TOTAL CONSUMED
                   </span>
                   <span className="text-4xl font-black text-white mono leading-none drop-shadow-xl">{state.consumedCount}</span>
                </div>
             </div>
             
             <div className="mt-10 bg-black/40 border border-zinc-800/60 p-4 rounded-2xl flex items-center gap-4 text-[9px] text-zinc-500 leading-relaxed max-w-2xl mx-auto backdrop-blur-md shadow-2xl shrink-0 border-l-cyan-500 border-l-2">
               <Info size={20} className="text-cyan-500 shrink-0" />
               <p className="italic uppercase tracking-wider"><span className="text-zinc-300 font-bold">KERNEL ADVISORY:</span> SEMAPHORES SYNCHRONIZE RESOURCE ACCESS SIGNALS; THE MUTUAL EXCLUSION LOCK GUARANTEES ATOMIC OPERATIONS WITHIN THE CRITICAL MEMORY SECTION.</p>
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Logs */}
        <div className="col-span-3 flex flex-col gap-4 min-h-0">
          <section className="bg-[#0b0b0d] border border-zinc-800 rounded-[2rem] flex flex-col h-full overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/20">
              <h3 className="text-zinc-500 font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                <Terminal size={14} className="text-cyan-500" /> KERNEL LOGS
              </h3>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                 <span className="text-[7px] text-emerald-500 font-black tracking-widest uppercase">LOGS ACTIVE</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar min-h-0">
              {state.logs.map((log) => (
                <div key={log.id} className="animate-in slide-in-from-right-4 duration-500 border-l-2 border-zinc-800/50 pl-4 py-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-lg uppercase tracking-tighter ${
                      log.sender === 'PRODUCER' ? 'bg-emerald-500/10 text-emerald-500' :
                      log.sender === 'CONSUMER' ? 'bg-rose-500/10 text-rose-500' : 'bg-cyan-500/10 text-cyan-400'
                    }`}>
                      {log.sender}
                    </span>
                    <span className="text-[7px] text-zinc-600 mono font-bold">{log.timestamp.toLocaleTimeString([], { hour12: false, hour:'2-digit', minute:'2-digit', second:'2-digit'})}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-medium italic opacity-80 leading-relaxed">"{log.message}"</p>
                </div>
              ))}
              {state.logs.length === 0 && (
                 <div className="text-center py-20 opacity-10">
                    <Activity size={48} className="mx-auto mb-4" />
                    <span className="text-[10px] font-black tracking-[0.3em] uppercase">Kernel Idle State</span>
                 </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <footer className="shrink-0 flex items-center gap-4 h-20">
        <div className="w-1/4 h-full flex items-center gap-4 bg-[#0b0b0d] border border-zinc-800 p-4 rounded-[1.5rem] shadow-xl">
           <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
             <Layers size={18} className="text-cyan-500" />
           </div>
           <div>
              <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest block mb-1">MEMORY ALLOCATION</span>
              <div className="flex items-center gap-3">
                 <span className="text-xs text-zinc-100 font-black mono tracking-widest">{Math.round((state.buffer.length / state.bufferSize) * 100)}%</span>
                 <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-cyan-500 transition-all duration-1000" 
                      style={{ width: `${(state.buffer.length / state.bufferSize) * 100}%` }}
                    ></div>
                 </div>
              </div>
           </div>
        </div>

        <div className="flex-1 h-full flex items-center justify-between bg-[#0b0b0d] border border-zinc-800 px-8 rounded-[1.5rem] shadow-xl">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
               <Gauge size={18} className="text-indigo-400" />
             </div>
             <div>
                <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest block mb-1">SCHEDULER STATUS</span>
                <span className="text-xs text-zinc-100 font-black tracking-widest uppercase">CORE_X64_REALTIME</span>
             </div>
           </div>

           <div className="flex items-center gap-4">
              <button 
                onClick={() => setState(prev => ({ ...prev, isRunning: !prev.isRunning }))}
                className={`flex items-center gap-3 px-8 py-3 rounded-2xl font-black transition-all active:scale-95 shadow-lg group ${
                  state.isRunning 
                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30 hover:bg-rose-500/20' 
                    : 'bg-cyan-500 text-cyan-950 hover:bg-cyan-400 border border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                }`}
              >
                {state.isRunning ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                <span className="text-[10px] tracking-[0.2em] uppercase">{state.isRunning ? 'TERMINATE' : 'INITIALIZE'}</span>
              </button>
              <button 
                onClick={resetSimulation} 
                className="p-3 bg-zinc-900 text-zinc-500 rounded-2xl border border-zinc-800 hover:text-white hover:border-zinc-600 transition-all active:rotate-180 duration-500"
                title="Reset Simulation"
              >
                <RotateCcw size={18} />
              </button>
           </div>
        </div>

        <div className="w-1/4 h-full flex items-center justify-end px-6">
          <div className="flex flex-col items-end gap-1">
            <span className="text-[8px] text-zinc-600 font-black tracking-widest uppercase">RUNTIME ID</span>
            <div className="px-4 py-2 bg-[#0b0b0d] rounded-xl border border-zinc-800 text-cyan-400 font-black mono text-xs shadow-lg uppercase tracking-widest">
              0X{Math.random().toString(36).substring(7).toUpperCase()}E2B
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        .animate-scan { animation: scan 15s linear infinite; }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
        @keyframes pulse-progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-pulse-progress { animation: pulse-progress 0.8s ease-in-out infinite; }
        input[type=range]::-webkit-slider-thumb {
          width: 16px;
          height: 16px;
          background: #22d3ee;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 15px rgba(34, 211, 238, 0.5);
          appearance: none;
          border: 2px solid #000;
        }
      `}</style>
    </div>
  );
};

const getStatusStyle = (status: ThreadStatus) => {
  switch (status) {
    case ThreadStatus.IDLE: return 'bg-zinc-800 text-zinc-600 border-zinc-700 opacity-40';
    case ThreadStatus.WORKING: return 'bg-emerald-500/20 text-emerald-400 border-emerald-400/30';
    case ThreadStatus.WAITING_SEMAPHORE: return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case ThreadStatus.WAITING_MUTEX: return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    case ThreadStatus.CRITICAL_SECTION: return 'bg-rose-500/20 text-rose-500 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse font-black italic';
    default: return 'bg-zinc-900 text-zinc-500 border-zinc-800';
  }
};

export default App;
