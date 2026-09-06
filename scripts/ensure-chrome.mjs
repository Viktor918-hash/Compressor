// На Vercel/CI браузер для пре-рендерингу постачає @sparticuz/chromium
// (див. vite.config.js), тому качати повний Chrome там не потрібно —
// це лише сповільнює білд. Локально (у розробників) лишаємо старий
// поведінковий шлях: перед білдом переконуємось, що Chrome для puppeteer
// встановлено.
if (!process.env.VERCEL && !process.env.CI) {
  const { execSync } = await import("node:child_process");
  execSync("npx puppeteer browsers install chrome", { stdio: "inherit" });
}
