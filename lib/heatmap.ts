import { HeatmapConfig, HeatmapPoint } from "./types";

export class Heatmap {
  protected container: HTMLElement;
  protected width: number;
  protected height: number;
  protected radius: number;
  protected gradient: Record<string | number, string>;
  protected blur: number;
  protected maxAlpha: number;
  protected minAlpha: number;
  protected maxValue: number;
  protected minValue: number;
  protected alpha: number;
  protected xField: string;
  protected yField: string;
  protected valueField: string;
  protected renderBoundaries = [Infinity, Infinity, -Infinity, -Infinity];
  protected canvas: HTMLCanvasElement;
  protected shadowCanvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D | null;
  protected shadowCtx: CanvasRenderingContext2D | null;
  protected palette: Uint8ClampedArray;
  protected pointTemplate: HTMLCanvasElement;
  protected points: HeatmapPoint[];

  constructor(config: HeatmapConfig) {
    const {
      container,
      radius = 40,
      width,
      height,
      gradient = {
        0.25: "rgb(0,0,255)",
        0.55: "rgb(0,255,0)",
        0.85: "yellow",
        1.0: "rgb(255,0,0)",
      },
      blur = 0.85,
      maxOpacity = 1,
      minOpacity = 0,
      maxValue = -1,
      minValue = -1,
      opacity = -1,
      xField = "x",
      yField = "y",
      valueField = "value",
    } = config;

    // config error
    if (minValue > maxValue) {
      throw new Error("minValue 大于 maxValue");
    }
    if (minOpacity > maxOpacity) {
      throw new Error("minOpacity 大于 maxOpacity");
    }

    this.radius = radius;
    this.gradient = gradient;
    this.blur = blur;
    this.maxAlpha = maxOpacity * 255;
    this.minAlpha = minOpacity * 255;
    this.maxValue = maxValue;
    this.minValue = minValue;
    this.alpha = opacity * 255;
    this.xField = xField;
    this.yField = yField;
    this.valueField = valueField;
    this.points = [];

    // init container
    if (typeof container === "string") {
      const el = document.querySelector(container);
      if (!el) {
        throw new Error("容器选择器不存在");
      }
      this.container = el as HTMLElement;
    } else {
      this.container = container;
    }

    // init size
    if (width === undefined || height === undefined) {
      const { width: w, height: h } = this.getElementSize(this.container);
      this.width = width === undefined ? w : width;
      this.height = height === undefined ? h : height;
    } else {
      this.width = width;
      this.height = height;
    }

    // init canvas
    this.canvas = this.createCanvas({
      width: this.width,
      height: this.height,
      className: "heatmap-canvas",
      cssText: "position:absolute;left:0;top:0;",
    });
    this.shadowCanvas = this.createCanvas({
      width: this.width,
      height: this.height,
      cssText: "position:absolute;left:0;top:0;",
    });
    this.ctx = this.canvas.getContext("2d");
    this.shadowCtx = this.shadowCanvas.getContext("2d");

    this.palette = this.createColorPalette();
    this.pointTemplate = this.createPointTemplate();
    this.container.appendChild(this.canvas);
  }

  protected getElementSize(element: HTMLElement) {
    const { width, height } = element.getBoundingClientRect();

    return {
      width,
      height,
    };
  }

  protected createCanvas(config: {
    width: number;
    height: number;
    className?: string;
    cssText?: string;
  }) {
    const { width, height, className, cssText } = config;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    className && (canvas.className = className);
    cssText && (canvas.style.cssText = cssText);

    return canvas;
  }

  /**
   * 获取颜色板信息
   * 宽 256px，高 1px，从左到右，颜色逐渐加深
   * 颜色透明通道的 alpha 值范围是 0 - 255，所以可以用 alpha 映射到颜色板的颜色
   */
  protected createColorPalette() {
    const startX = 0;
    const startY = 0;
    const endX = 256;
    const endY = 1;

    const paletteCanvas = this.createCanvas({
      width: endX,
      height: endY,
    });
    const paletteCtx = paletteCanvas.getContext("2d");
    if (!paletteCtx) {
      return new Uint8ClampedArray();
    }
    const gradient = paletteCtx.createLinearGradient(
      startX,
      startY,
      endX,
      endY
    );
    Object.entries(this.gradient).forEach(([offset, color]) => {
      gradient.addColorStop(+offset, color);
    });
    paletteCtx.fillStyle = gradient;
    paletteCtx.fillRect(startX, startY, endX, endY);

    // 依次存放每个像素点的 rgba 颜色信息，所以长度为 width * height * 4
    return paletteCtx.getImageData(startX, startY, endX, endY).data;
  }

  protected createPointTemplate() {
    const size = this.radius * 2;
    const blurFactor = 1 - this.blur;
    const x = this.radius;
    const y = this.radius;

    const templateCanvas = this.createCanvas({
      width: size,
      height: size,
    });
    const templateCtx = templateCanvas.getContext("2d");

    if (!templateCtx) {
      return templateCanvas;
    }

    if (blurFactor === 1) {
      templateCtx.beginPath();
      templateCtx.arc(x, y, this.radius, 0, 2 * Math.PI, false);
      templateCtx.fillStyle = "rgba(0, 0, 0, 1)";
      templateCtx.fill();
    } else {
      const gradient = templateCtx.createRadialGradient(
        x,
        y,
        this.radius * blurFactor,
        x,
        y,
        this.radius
      );
      gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      templateCtx.fillStyle = gradient;
      templateCtx.fillRect(0, 0, size, size);
    }

    return templateCanvas;
  }

  protected organizeData(points: Record<string, number>[]) {
    let max = 0;
    let min = 0;

    this.points = points.reduce<HeatmapPoint[]>((p, c) => {
      const x = c[this.xField];
      const y = c[this.yField];
      const value = c[this.valueField];

      if (
        x !== undefined &&
        y !== undefined &&
        value !== undefined &&
        value >= 0
      ) {
        p.push({
          x,
          y,
          value,
        });
        max = Math.max(value, max);
        min = Math.min(value, min);
      }

      return p;
    }, []);

    if (this.maxValue < 0) {
      this.maxValue = max;
    }
    if (this.minValue < 0) {
      this.minValue = min;
    }
  }

  protected drawAlpha() {
    this.points.forEach((point) => {
      if (!this.shadowCtx) return;

      const { x, y, value: v } = point;
      const value = Math.max(this.minValue, Math.min(this.maxValue, v));

      const startX = x - this.radius;
      const startY = y - this.radius;

      const templateAlpha =
        (value - this.minValue) / (this.maxValue - this.minValue);
      // 小于 0.01 的数据无法显示
      this.shadowCtx.globalAlpha = Math.max(0.01, templateAlpha);
      this.shadowCtx.drawImage(this.pointTemplate, startX, startY);

      this.updateRenderBoundaries(startX, startY);
    });
  }

  protected updateRenderBoundaries(startX: number, startY: number) {
    const size = this.radius * 2;
    const endX = startX + size;
    const endY = startY + size;

    this.renderBoundaries[0] = Math.min(this.renderBoundaries[0], startX);
    this.renderBoundaries[1] = Math.min(this.renderBoundaries[1], startY);
    this.renderBoundaries[2] = Math.max(this.renderBoundaries[2], endX);
    this.renderBoundaries[3] = Math.max(this.renderBoundaries[3], endY);
  }

  protected colorize() {
    if (!this.shadowCtx || !this.ctx) return;

    let startX = this.renderBoundaries[0];
    let startY = this.renderBoundaries[1];
    const boundaryWidth = this.renderBoundaries[2] - startX;
    const boundaryHeight = this.renderBoundaries[3] - startY;
    let imgWidth = 0;
    let imgHeight = 0;

    const outOfContainer =
      startX <= -boundaryWidth ||
      startX >= this.width ||
      startY <= -boundaryHeight ||
      startY >= this.height;
    if (outOfContainer) return;

    if (startX < 0) {
      imgWidth = Math.min(boundaryWidth + startX, this.width);
    } else {
      imgWidth =
        startX + boundaryWidth > this.width
          ? this.width - startX
          : boundaryWidth;
    }
    startX = Math.max(0, startX);

    if (startY < 0) {
      imgHeight = Math.min(boundaryHeight + startY, this.height);
    } else {
      imgHeight =
        startY + boundaryHeight > this.height
          ? this.height - startY
          : boundaryHeight;
    }
    startY = Math.max(0, startY);

    const img = this.shadowCtx.getImageData(
      startX,
      startY,
      imgWidth,
      imgHeight
    );
    const imgData = img.data;

    for (let i = 3; i < imgData.length; i += 4) {
      // 范围是 0 - 255
      const alpha = imgData[i];
      const offset = alpha * 4;

      let finalAlpha = 0;
      if (this.alpha < 0) {
        // 默认
        finalAlpha = Math.min(this.maxAlpha, Math.max(this.minAlpha, alpha));
      } else {
        finalAlpha = this.alpha;
      }

      // r
      imgData[i - 3] = this.palette[offset];
      // g
      imgData[i - 2] = this.palette[offset + 1];
      // b
      imgData[i - 1] = this.palette[offset + 2];
      // a
      imgData[i] = finalAlpha;
    }

    this.ctx.putImageData(img, startX, startY);
    this.renderBoundaries = [Infinity, Infinity, -Infinity, -Infinity];
  }

  setData(points: Record<string, number>[]) {
    this.organizeData(points);
    this.drawAlpha();
    this.colorize();
  }

  getDynamicValueAt(point: { x: number; y: number }) {
    if (!this.shadowCtx) {
      return 0;
    }

    const { x, y } = point;
    const img = this.shadowCtx.getImageData(x, y, 1, 1);
    const alpha = img.data[3];
    const ratio = alpha / 255;

    const value = Math.floor(Math.abs(this.maxValue - this.minValue) * ratio);

    return value;
  }

  getValueAt(point: { x: number; y: number }) {
    const { x, y } = point;

    return this.points.reduce((p, c) => {
      const { x: circleX, y: circleY, value } = c;

      const x2 = Math.pow(x - circleX, 2);
      const y2 = Math.pow(y - circleY, 2);
      const r2 = Math.pow(this.radius, 2);

      if (x2 + y2 < r2) {
        const ratio = 1 - Math.sqrt(x2 + y2) / this.radius;
        const val = Math.round(ratio * value);
        p += val;
      }

      return p;
    }, 0);
  }
}
