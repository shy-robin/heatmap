import "./style.css";
import typescriptLogo from "./typescript.svg";
import { setupCounter } from "../lib/main";
import { Heatmap } from "../lib/heatmap";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <a href="https://vitejs.dev" target="_blank">
      <img src="/vite.svg" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1>Vite + TypeScript</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
  </div>
`;

setupCounter(document.querySelector<HTMLButtonElement>("#counter")!);

// TODO:
// 1. tooltip 位置及优化动画
// 2. 动态筛选热力范围
// 3. 冻结弹窗
// 4. 滚动页面
// 5. 保存热力图
const container = document.getElementById("heatmap-container");
const heatmap = new Heatmap({
  container: container!,
});

heatmap.setData([
  {
    x: 100,
    y: 100,
    value: 1120,
  },
  {
    x: 100,
    y: 100,
    value: 120,
  },
  {
    x: 100,
    y: 100,
    value: 120,
  },
  {
    x: 220,
    y: 220,
    value: 30,
  },
  {
    x: 450,
    y: 450,
    value: 130,
  },
  {
    x: 220,
    y: 220,
    value: 110,
  },
  {
    x: 240,
    y: 240,
    value: 110,
  },
  {
    x: 200,
    y: 200,
    value: 110,
  },
]);

container?.addEventListener("mousemove", (e) => {
  const x = e.clientX - container.offsetLeft;
  const y = e.clientY - container.offsetTop;

  const value = heatmap.getValueAt({ x, y });
  const dynamicValue = heatmap.getDynamicValueAt({ x, y });

  const tooltip = document.querySelector(".tooltip");
  tooltip.style.setProperty("--tooltip-x", x + "px");
  tooltip.style.setProperty("--tooltip-y", y + "px");

  tooltip.innerHTML = `
<p>value: ${value}</p>
<p>dynamic value: ${dynamicValue}</p>
`;

  // tooltip.style.left = x + "px";
  // tooltip.style.top = y + "px";
});
