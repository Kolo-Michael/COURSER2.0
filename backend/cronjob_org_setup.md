# Keeping the Render API warm with cron-job.org

cron-job.org is a free cloud cron service that pings a URL on a
schedule. It runs on their servers (not your laptop), so the Render
instance stays warm even when your machine is off.

## Why

Render free-tier instances sleep after ~15 minutes of inactivity. The
first request after a sleep pays a cold start (30-60s). A ping every 5
minutes prevents that.

## What the ping targets

- URL: `https://courser-api-18uo.onrender.com/api/ping`
- Method: GET
- Expected response: HTTP `200` with an **empty body (0 bytes)**

Use `/api/ping` (not `/api/health`) for cron-job.org. cron-job.org
aborts a job with `Failed (output too large)` when a URL returns more
than ~4 KB of body data. `/api/ping` returns nothing, so every ping is
green. `/api/health` is fine for UptimeRobot/browser checks but is not
the cron-job.org target.

## Why it still shows "output too large" sometimes

Even with `/api/health`, cron-job.org can intermittently fail with
`Failed (output too large)` when the Render instance is **asleep**:
Render's load balancer answers with a large HTML 502 "cold start" page
*before* the request reaches the app, and cron-job.org chokes on that
body. This is a known cron-job.org + Render free-tier interaction
(cron-job.org issue #438). Mitigations:

1. Use `/api/ping` (zero-byte) — this only helps for responses that
   reach the app; the 502 cold-start page is emitted by Render itself.
2. Ping every 1 minute so the instance never falls asleep in the first
   place (free tier minimum is 1 minute). A sleeping instance pays a
   cold start on the ping that wakes it anyway.
3. Accept the occasional red entry after long idle gaps — it is the
   wake-up ping doing its job; the very next ping succeeds.

## Setup steps (in the browser)

1. Go to <https://cron-job.org/en/> and create a free account (email +
   password). Verify the email.
2. From the dashboard, click **Cronjobs** then **Create Cronjob**.
3. Configure:
   - **Name**: `COURSER2.0 Render keepalive`
   - **URL**: `https://courser-api-18uo.onrender.com/api/ping`
   - **Execution method**: `GET`
   - **Execution schedule**: Every 1 minute
     (keeps the instance awake; 5 minutes is acceptable but lets Render
     fall asleep between pings, which triggers the cold-start 502 page)
   - **Request settings** (advanced, optional): leave defaults. The
     service follows the 30-second timeout by default.
   - **Post to URL / save response**: disabled (not needed).
4. Click **Create Cronjob**, then toggle the job **Enabled** on.

## Verify

- On the job's **Reports** tab you should see green entries every
  minute with HTTP status `200`.

## Notes

- Free tier: up to 10 cron jobs; each job may fire every 1 minute or
  less frequently. A 1-minute interval (~1440 pings/day) is far inside
  the free allowance.
- cron-job.org pings come from datacenters; a couple of red entries are
  normal if Render is mid-restart. If you see repeated failures, check
  `backend/keepalive.py` output or the Render dashboard logs.
- If you prefer your own machine's scheduler instead of a cloud service:
  - Windows: `ping_render_loop.bat` (continuous 15s loop) or Task
    Scheduler running `keepalive.py --loop --interval 300`.
  - Linux/macOS: `ping_render.sh` via cron (`crontab_render`).
- Environment variable override: `RENDER_HEALTH_URL` or `HEALTH_URL`
  if the URL ever changes.
