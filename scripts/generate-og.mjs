import { chromium } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const output = path.join(root, 'public', 'og-image.png')

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; overflow: hidden;
    background:
      radial-gradient(900px 480px at 88% 18%, rgba(176, 141, 87, .22), transparent 62%),
      radial-gradient(700px 520px at 6% 92%, rgba(31, 59, 44, .14), transparent 65%),
      #f6f1e7;
    font-family: Georgia, 'Times New Roman', serif;
    color: #1f3b2c;
  }
  .frame {
    position: absolute; inset: 26px; border: 1px solid rgba(31, 59, 44, .18);
  }
  .content {
    position: absolute; inset: 0; padding: 0 88px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .brand { max-width: 620px; }
  .eyebrow {
    font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; font-weight: 600;
    letter-spacing: .34em; text-transform: uppercase; color: #8a6a3b; margin-bottom: 30px;
  }
  .wordmark {
    font-size: 118px; letter-spacing: .16em; line-height: .95; font-weight: 400;
  }
  .rule { width: 132px; height: 2px; background: #b08d57; margin: 34px 0 24px; }
  .tagline {
    font-family: 'Segoe UI', Arial, sans-serif; font-size: 19px; font-weight: 500;
    letter-spacing: .42em; text-transform: uppercase; color: #1f3b2c;
  }
  .sub {
    font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; letter-spacing: .16em;
    text-transform: uppercase; color: rgba(31, 59, 44, .62); margin-top: 22px;
  }
  .site {
    position: absolute; left: 88px; bottom: 62px;
    font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; letter-spacing: .18em;
    text-transform: uppercase; color: #8a6a3b;
  }
  .art { position: relative; width: 360px; height: 420px; }
  .halo {
    position: absolute; inset: 10px 20px 40px; border-radius: 50%;
    background: radial-gradient(circle at 42% 36%, rgba(255,255,255,.85), rgba(176,141,87,.16) 58%, transparent 72%);
  }
  .leaf { position: absolute; opacity: .9; }
</style>
</head>
<body>
  <div class="frame"></div>
  <div class="content">
    <div class="brand">
      <div class="eyebrow">Sunka Herbal Tea</div>
      <div class="wordmark">SUNKA</div>
      <div class="rule"></div>
      <div class="tagline">Herbal Tea</div>
      <div class="sub">Infusiones naturales del Perú</div>
    </div>
    <div class="art">
      <div class="halo"></div>
      <svg class="leaf" style="left: -18px; top: 66px;" width="84" height="132" viewBox="0 0 84 132" fill="none">
        <path d="M42 4C18 34 8 62 12 94c3 22 16 34 30 34s27-12 30-34c4-32-6-60-30-90Z" fill="#2f513c" opacity=".16"/>
        <path d="M42 12v108" stroke="#1f3b2c" stroke-width="1.6" opacity=".38"/>
      </svg>
      <svg class="leaf" style="right: -8px; top: 8px; transform: rotate(38deg);" width="66" height="104" viewBox="0 0 66 104" fill="none">
        <path d="M33 3C14 27 6 49 9 74c2 17 12 27 24 27s22-10 24-27c3-25-5-47-24-71Z" fill="#b08d57" opacity=".28"/>
        <path d="M33 10v84" stroke="#8a6a3b" stroke-width="1.4" opacity=".45"/>
      </svg>
      <svg style="position:absolute; right: 26px; bottom: 26px;" width="270" height="270" viewBox="0 0 270 270" fill="none">
        <ellipse cx="135" cy="238" rx="96" ry="14" fill="#1f3b2c" opacity=".10"/>
        <path d="M54 108h162v34c0 51-33 82-81 82s-81-31-81-82v-34Z" fill="#fbf7ef" stroke="#1f3b2c" stroke-width="3"/>
        <path d="M216 120h14c16 0 27 11 27 25s-11 25-27 25h-14" stroke="#1f3b2c" stroke-width="3"/>
        <ellipse cx="135" cy="108" rx="81" ry="21" fill="#e8dfcd" stroke="#1f3b2c" stroke-width="3"/>
        <ellipse cx="135" cy="108" rx="64" ry="15" fill="#7a4a2b"/>
        <path d="M108 168h54l-7 22c-2 7-8 11-15 11h-10c-7 0-13-4-15-11l-7-22Z" fill="#b08d57" opacity=".55"/>
        <path d="M118 66c-9-12 9-18 0-32M135 62c-9-12 9-18 0-32M152 66c-9-12 9-18 0-32" stroke="#1f3b2c" stroke-width="2.4" stroke-linecap="round" opacity=".34"/>
        <path d="M196 150c12 10 12 26 0 36" stroke="#b08d57" stroke-width="2" stroke-dasharray="3 6" opacity=".7"/>
        <rect x="192" y="140" width="26" height="40" rx="4" fill="#b08d57" transform="rotate(12 205 160)"/>
      </svg>
    </div>
  </div>
  <div class="site">sunka.pe</div>
</body>
</html>`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: output, type: 'png' })
await browser.close()

console.log(`OG image generated at ${output}`)
