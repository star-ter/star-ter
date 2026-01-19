import { type ChartItem } from './charts';

export interface Source {
  tool: string;
  displayName: string;
  source: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Source[];
  chartItems?: ChartItem[];
  isStreaming?: boolean;
}

export interface Thread {
  id: string;
  title: string;
  createdAt: Date;
}

// 좌표 타입
export type Coordinate = [number, number];

// 폴리곤 타입
export type PolygonData =
  | {
      type: 'Polygon';
      coordinates: Coordinate[][];
    }
  | {
      type: 'MultiPolygon';
      coordinates: Coordinate[][][];
    };
