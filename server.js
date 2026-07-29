"use strict";

require("dotenv").config();

const express = require("express");
const path = require("path");
const retroArchClient = require("./lib/retroarch");
const { getEmeraldEncounters } = require("./lib/emerald");

const app = express();
const PORT = Number.parseInt(process.env.PORT || "3000", 10);
const RA_USERNAME = (process.env.RA_USERNAME || "").trim();
const RA_WEB_API_KEY = (process.env.RA_WEB_API_KEY || "").trim();
const MODE = (process.env.MODE || "hardcore").toLowerCase();
const CACHE_SECONDS = Math.max(Number.parseInt(process.env.CACHE_SECONDS || "15", 10), 5);
const RETROARCH_HOST = (process.env.RETROARCH_HOST || "127.0.0.1").trim();
const RETROARCH_PORT = Number.parseInt(process.env.RETROARCH_PORT || "55355", 10);
const RA_BASE_URL = "https://retroachievements.org/API";

let cache = { expiresAt: 0, data: null };
let simulationEventId = 0;

function requireConfiguration() {
  if (!RA_USERNAME || !RA_WEB_API_KEY) {
    const error = new Error("RA_USERNAME ou RA_WEB_API_KEY manque dans le fichier .env.");
    error.statusCode = 500;
    throw error;
  }

  if (!["hardcore", "softcore"].includes(MODE)) {
    const error = new Error('MODE doit valoir "hardcore" ou "softcore" dans le fichier .env.');
    error.statusCode = 500;
    throw error;
  }
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "RA-Progress-Overlay/1.0",
      Accept: "application/json"
    },
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new Error(`RetroAchievements a répondu ${response.status} ${response.statusText}.`);
  }

  return response.json();
}

async function getProgress() {
  requireConfiguration();

  const now = Date.now();
  if (cache.data && cache.expiresAt > now) return cache.data;

  const profileUrl = new URL(`${RA_BASE_URL}/API_GetUserProfile.php`);
  profileUrl.searchParams.set("u", RA_USERNAME);
  profileUrl.searchParams.set("y", RA_WEB_API_KEY);

  const profile = await fetchJson(profileUrl);
  const gameId = Number(profile.LastGameID);

  if (!Number.isFinite(gameId) || gameId <= 0) {
    throw new Error("Aucun jeu récent n’a été trouvé sur ce compte.");
  }

  const progressUrl = new URL(`${RA_BASE_URL}/API_GetGameInfoAndUserProgress.php`);
  progressUrl.searchParams.set("g", String(gameId));
  progressUrl.searchParams.set("u", RA_USERNAME);
  progressUrl.searchParams.set("y", RA_WEB_API_KEY);

  const game = await fetchJson(progressUrl);
  const total = Number(game.NumAchievements || 0);
  const unlocked = MODE === "hardcore"
    ? Number(game.NumAwardedToUserHardcore || 0)
    : Number(game.NumAwardedToUser || 0);

  const safeUnlocked = Math.min(Math.max(unlocked, 0), Math.max(total, 0));
  const percentage = total > 0 ? (safeUnlocked / total) * 100 : 0;
  const earnedDateField = MODE === "hardcore" ? "DateEarnedHardcore" : "DateEarned";
  const latestAchievement = Object.values(game.Achievements || {})
    .filter((achievement) => achievement[earnedDateField])
    .sort((first, second) =>
      new Date(second[earnedDateField]).getTime() - new Date(first[earnedDateField]).getTime()
    )[0];

  const data = {
    username: RA_USERNAME,
    mode: MODE,
    gameId,
    gameTitle: game.Title || "Jeu inconnu",
    unlocked: safeUnlocked,
    total,
    percentage: Number(percentage.toFixed(2)),
    latestAchievement: latestAchievement
      ? {
          title: latestAchievement.Title || "Trophée sans nom",
          earnedAt: latestAchievement[earnedDateField]
        }
      : null,
    updatedAt: new Date().toISOString()
  };

  cache = { data, expiresAt: now + CACHE_SECONDS * 1000 };
  return data;
}

app.disable("x-powered-by");
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/progress", async (_request, response) => {
  try {
    const data = await getProgress();
    response.set("Cache-Control", "no-store").json({ ok: true, ...data, simulationEventId });
  } catch (error) {
    console.error(error);
    response.status(error.statusCode || 502).json({
      ok: false,
      error: error.message || "Erreur inconnue."
    });
  }
});

app.get("/api/emerald/encounters", async (_request, response) => {
  const client = {
    getStatus: () => retroArchClient.getStatus({
      host: RETROARCH_HOST,
      port: RETROARCH_PORT
    }),
    readMemory: (address, length) => retroArchClient.readMemory(address, length, {
      host: RETROARCH_HOST,
      port: RETROARCH_PORT
    })
  };

  try {
    const data = await getEmeraldEncounters(client);
    response.set("Cache-Control", "no-store").json({ ok: true, ...data });
  } catch (error) {
    console.error(`[Overlay Émeraude] ${error.message}`);
    response.status(503).json({
      ok: false,
      code: error.code || "EMERALD_READ_ERROR",
      error: error.message || "Impossible de lire Pokémon Émeraude."
    });
  }
});

app.post("/api/simulate-trophy", (_request, response) => {
  simulationEventId += 1;
  response.set("Cache-Control", "no-store").json({ ok: true, simulationEventId });
});

app.listen(PORT, "127.0.0.1", () => {
  console.log("");
  console.log("Overlay RetroAchievements lancé.");
  console.log(`OBS : http://127.0.0.1:${PORT}`);
  console.log(`Mode : ${MODE}`);
  console.log(`Rencontres Émeraude : http://127.0.0.1:${PORT}/emerald.html`);
  console.log("");
});
