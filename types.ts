
export enum AppState {
  TREE = 'TREE',
  EXPLODE = 'EXPLODE'
}

export enum InteractionState {
  IDLE = 'IDLE',
  CHANGE_PHOTO = 'CHANGE_PHOTO',
  CLUSTERING = 'CLUSTERING',
  APPROACHING = 'APPROACHING'
}

export interface ParticleData {
  position: [number, number, number];
  targetPosition: [number, number, number];
  explodePosition: [number, number, number];
  size: number;
}

export interface PhotoData {
  id: number;
  url: string;
  position: [number, number, number];
}

export interface GestureData {
  isFist: boolean; 
  isOkGesture: boolean; 
  isPointing: boolean; 
  isOpenPalm: boolean; 
  handX: number; 
  handY: number; 
  pointerX: number; 
  pointerY: number; 
  isActive: boolean;
  velocityX?: number; // Added for swipe detection
}
