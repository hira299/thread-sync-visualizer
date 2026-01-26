
export enum ThreadStatus {
  IDLE = 'IDLE',
  WAITING_SEMAPHORE = 'WAITING_SEMAPHORE',
  WAITING_MUTEX = 'WAITING_MUTEX',
  CRITICAL_SECTION = 'CRITICAL_SECTION',
  WORKING = 'WORKING',
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  sender: 'PRODUCER' | 'CONSUMER' | 'SYSTEM';
  message: string;
}

export interface ThreadInfo {
  id: number;
  type: 'PRODUCER' | 'CONSUMER';
  status: ThreadStatus;
}

export interface SimulationState {
  buffer: number[];
  bufferSize: number;
  producers: ThreadInfo[];
  consumers: ThreadInfo[];
  isMutexLocked: boolean;
  emptyCount: number;
  fullCount: number;
  producedCount: number;
  consumedCount: number;
  logs: LogEntry[];
  isRunning: boolean;
  producerSpeed: number;
  consumerSpeed: number;
  numProducers: number;
  numConsumers: number;
}
