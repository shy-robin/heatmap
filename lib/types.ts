export interface HeatmapConfig {
  container: HTMLElement | string;
  width?: number;
  height?: number;
  radius?: number;
  gradient?: Record<string | number, string>;
  maxOpacity?: number;
  minOpacity?: number;
  maxValue?: number;
  minValue?: number;
  opacity?: number;
  blur?: number;
  xField?: string;
  yField?: string;
  valueField?: string;
  handleExtremaChange?: (data: ExtremaData) => void;
}

export interface HeatmapPoint {
  x: number;
  y: number;
  value: number;
}

export interface ExtremaData {
  min: number;
  max: number;
  gradient: Record<string | number, string>;
}
