#!/usr/bin/env python3
"""Fetch TIMPS PostCards stats from the GoatCounter API and write stats.json.

Called by .github/workflows/stats.yml. Reads from env:
  GOATCOUNTER_CODE      site subdomain, e.g. "sandeep1729"
  GOATCOUNTER_API_KEY   API key (GoatCounter account -> top menu -> API)
  GOATCOUNTER_TZ        site timezone, default Asia/Kolkata
"""
import datetime
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
import zoneinfo

CODE = os.environ.get("GOATCOUNTER_CODE", "")
API_KEY = os.environ.get("GOATCOUNTER_API_KEY", "")
TZ = os.environ.get("GOATCOUNTER_TZ", "Asia/Kolkata")

INSTALL_PATH = "/install"
EARLIEST = datetime.date(2020, 1, 1)


def api(path):
    req = urllib.request.Request(
        "https://%s.goatcounter.com/api/v0%s" % (CODE, path),
        headers={"Authorization": "Bearer %s" % API_KEY,
                 "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.load(resp)


def fmt(dt):
    return urllib.parse.quote(dt.strftime("%Y-%m-%dT%H:%M:%S%z"))


def main():
    if not CODE or not API_KEY:
        print("stats_gen: GOATCOUNTER_CODE / GOATCOUNTER_API_KEY missing; skipping")
        return

    tz = zoneinfo.ZoneInfo(TZ)
    now = datetime.datetime.now(tz)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    hour_start = now.replace(minute=0, second=0, microsecond=0)

    try:
        total = api("/stats/total?start=%s&end=%s" % (fmt(today_start), fmt(hour_start)))
        hits = api(
            "/stats/hits?start=%s&end=%s&daily=true&path_by_name=true&include_paths=%s"
            % (fmt(datetime.datetime.combine(EARLIEST, datetime.time(), tz)),
               fmt(hour_start),
               urllib.parse.quote(INSTALL_PATH))
        )
    except urllib.error.HTTPError as e:
        print("stats_gen: API error %s: %s" % (e.code, e.read().decode()[:300]))
        sys.exit(1)

    today = 0
    online_now = 0
    for s in total.get("stats") or []:
        today += s.get("daily", 0)
        hourly = s.get("hourly") or []
        if len(hourly) > now.hour:
            online_now += hourly[now.hour]

    installs_today = 0
    installs_total = 0
    for h in hits.get("hits") or []:
        installs_total += h.get("count", 0)
        for s in h.get("stats") or []:
            installs_today += s.get("daily", 0)

    stats = {
        "online_now": online_now,
        "today": today,
        "installs_today": installs_today,
        "installs_total": installs_total,
        "updated_at": now.strftime("%Y-%m-%dT%H:%M:%S%z"),
    }

    with open("stats.json", "w") as f:
        json.dump(stats, f, indent=2)
    print("stats_gen: wrote stats.json %s" % json.dumps(stats))


if __name__ == "__main__":
    main()
