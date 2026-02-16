# GAS source placement

Place existing Google Apps Script files in `gas/src/`.

- `.gs` files
- `.html` files

## Vercel embed deploy

This repository now includes a Vercel embed page at the project root (`index.html`).

### 1) Deploy GAS Web App

1. In Apps Script, deploy as Web App (`/exec` URL).
2. Execute as: `Me`.
3. Access: `Anyone with the link` (or your intended audience).
4. `doGet()` already includes `ALLOWALL`, so iframe embedding is enabled.

### 2) Deploy to Vercel

1. Import this repository into Vercel.
2. Framework preset: `Other` (static).
3. Deploy.

### 3) Open embedded app

- Access your Vercel URL.
- Enter GAS Web App URL and click load.
- Or open directly with query:
  - `https://<your-vercel-domain>/?gasUrl=https://script.google.com/macros/s/<DEPLOY_ID>/exec`
