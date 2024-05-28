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

const heatmap = new Heatmap({
  container: document.getElementById("heatmap-container")!,
});

heatmap.setData([
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
