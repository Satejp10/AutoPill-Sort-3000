export enum PillType {
  RED = 'RED', // Hopper A
  BLUE = 'BLUE' // Hopper B
}

export interface SlotData {
  id: string;
  dayIndex: number; // 0-6 (Mon-Sun)
  isNight: boolean; // false = morning, true = night
  redCount: number;
  blueCount: number;
  label: string;
}

export interface FlyingPillData {
  id: string;
  type: PillType;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}
