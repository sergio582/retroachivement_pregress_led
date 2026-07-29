"use strict"

require("dotenv").config()

const express = require("express")
const path = require("path")
const retroArchClient = require("./lib/retroarch")
const { addEncounterSprites, getEmeraldEncounters } = require("./lib/emerald")
const { getEmeraldParty } = require("./lib/emerald-team")
const emeraldData = require("./data/emerald-fr.json")
const emeraldTeamData = require("./data/emerald-team.json")

const app = express()
const PORT = Number.parseInt(process.env.PORT || "3000", 10)
const RA_USERNAME = (process.env.RA_USERNAME || "").trim()
const RA_WEB_API_KEY = (process.env.RA_WEB_API_KEY || "").trim()
const MODE = (process.env.MODE || "hardcore").toLowerCase()
const CACHE_SECONDS = Math.max(Number.parseInt(process.env.CACHE_SECONDS || "15", 10), 5)
const RETROARCH_HOST = (process.env.RETROARCH_HOST || "127.0.0.1").trim()
const RETROARCH_PORT = Number.parseInt(process.env.RETROARCH_PORT || "55355", 10)
const RA_BASE_URL = "https://retroachievements.org/API"

let cache = { expiresAt: 0, data: null }
let simulationEventId = 0

const TEAM_TEST_STATUSES = [
	{ id: "healthy", emoji: "🟢", label: "En forme" },
	{ id: "sleep", emoji: "💤", label: "Endormi" },
	{ id: "poison", emoji: "🤢", label: "Empoisonné" },
	{ id: "burn", emoji: "🔥", label: "Brûlé" },
	{ id: "freeze", emoji: "🧊", label: "Gelé" },
	{ id: "paralysis", emoji: "⚡", label: "Paralysé" },
	{ id: "ko", emoji: "💀", label: "K.O." },
]
const TEAM_TEST_NICKNAMES = ["Biscotte", "Bulle", "Éclair", "Moka", "Nova", "Pixel", "Plume", "Volt"]

function randomInteger(minimum, maximum) {
	return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum
}

function createRandomTeamPreview() {
	const pool = Object.values(emeraldTeamData.species)
	const partySize = randomInteger(1, 6)
	const party = []

	for (let slot = 0; slot < partySize; slot += 1) {
		const speciesIndex = randomInteger(0, pool.length - 1)
		const species = pool.splice(speciesIndex, 1)[0]
		const status = TEAM_TEST_STATUSES[randomInteger(0, TEAM_TEST_STATUSES.length - 1)]
		const maxHp = randomInteger(24, 320)
		const hp = status.id === "ko" ? 0 : randomInteger(1, maxHp)

		party.push({
			slot,
			internalSpeciesId: species.internalId,
			dexNumber: species.dexNumber,
			speciesName: species.name,
			nickname: Math.random() < 0.45 ? TEAM_TEST_NICKNAMES[randomInteger(0, TEAM_TEST_NICKNAMES.length - 1)] : null,
			sprite: species.sprite,
			level: randomInteger(1, 100),
			hp,
			maxHp,
			hpPercent: Math.round((hp / maxHp) * 100),
			status,
			hasHeldItem: Math.random() < 0.4,
			isEgg: false,
		})
	}

	return party
}

function createRetroArchClient() {
	return {
		getStatus: () =>
			retroArchClient.getStatus({
				host: RETROARCH_HOST,
				port: RETROARCH_PORT,
			}),
		readMemory: (address, length) =>
			retroArchClient.readMemory(address, length, {
				host: RETROARCH_HOST,
				port: RETROARCH_PORT,
			}),
	}
}

function requireConfiguration() {
	if (!RA_USERNAME || !RA_WEB_API_KEY) {
		const error = new Error("RA_USERNAME ou RA_WEB_API_KEY manque dans le fichier .env.")
		error.statusCode = 500
		throw error
	}

	if (!["hardcore", "softcore"].includes(MODE)) {
		const error = new Error('MODE doit valoir "hardcore" ou "softcore" dans le fichier .env.')
		error.statusCode = 500
		throw error
	}
}

async function fetchJson(url) {
	const response = await fetch(url, {
		headers: {
			"User-Agent": "RA-Progress-Overlay/1.0",
			Accept: "application/json",
		},
		signal: AbortSignal.timeout(10000),
	})

	if (!response.ok) {
		throw new Error(`RetroAchievements a répondu ${response.status} ${response.statusText}.`)
	}

	return response.json()
}

async function getProgress() {
	requireConfiguration()

	const now = Date.now()
	if (cache.data && cache.expiresAt > now) return cache.data

	const profileUrl = new URL(`${RA_BASE_URL}/API_GetUserProfile.php`)
	profileUrl.searchParams.set("u", RA_USERNAME)
	profileUrl.searchParams.set("y", RA_WEB_API_KEY)

	const profile = await fetchJson(profileUrl)
	const gameId = Number(profile.LastGameID)

	if (!Number.isFinite(gameId) || gameId <= 0) {
		throw new Error("Aucun jeu récent n’a été trouvé sur ce compte.")
	}

	const progressUrl = new URL(`${RA_BASE_URL}/API_GetGameInfoAndUserProgress.php`)
	progressUrl.searchParams.set("g", String(gameId))
	progressUrl.searchParams.set("u", RA_USERNAME)
	progressUrl.searchParams.set("y", RA_WEB_API_KEY)

	const game = await fetchJson(progressUrl)
	const total = Number(game.NumAchievements || 0)
	const unlocked = MODE === "hardcore" ? Number(game.NumAwardedToUserHardcore || 0) : Number(game.NumAwardedToUser || 0)

	const safeUnlocked = Math.min(Math.max(unlocked, 0), Math.max(total, 0))
	const percentage = total > 0 ? (safeUnlocked / total) * 100 : 0
	const earnedDateField = MODE === "hardcore" ? "DateEarnedHardcore" : "DateEarned"
	const latestAchievement = Object.values(game.Achievements || {})
		.filter((achievement) => achievement[earnedDateField])
		.sort((first, second) => new Date(second[earnedDateField]).getTime() - new Date(first[earnedDateField]).getTime())[0]

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
					earnedAt: latestAchievement[earnedDateField],
				}
			: null,
		updatedAt: new Date().toISOString(),
	}

	cache = { data, expiresAt: now + CACHE_SECONDS * 1000 }
	return data
}

app.disable("x-powered-by")
app.use(express.static(path.join(__dirname, "public")))

app.get("/api/progress", async (_request, response) => {
	try {
		const data = await getProgress()
		response.set("Cache-Control", "no-store").json({ ok: true, ...data, simulationEventId })
	} catch (error) {
		console.error(error)
		response.status(error.statusCode || 502).json({
			ok: false,
			error: error.message || "Erreur inconnue.",
		})
	}
})

app.get("/api/emerald/encounters", async (_request, response) => {
	try {
		const data = await getEmeraldEncounters(createRetroArchClient())
		response.set("Cache-Control", "no-store").json({ ok: true, ...data })
	} catch (error) {
		console.error(`[Overlay Émeraude] ${error.message}`)
		response.status(503).json({
			ok: false,
			code: error.code || "EMERALD_READ_ERROR",
			error: error.message || "Impossible de lire Pokémon Émeraude.",
		})
	}
})

app.get("/api/emerald/team", async (_request, response) => {
	try {
		const data = await getEmeraldParty(createRetroArchClient())
		response.set("Cache-Control", "no-store").json({ ok: true, ...data })
	} catch (error) {
		console.error(`[Équipe Émeraude] ${error.message}`)
		response.status(503).json({
			ok: false,
			code: error.code || "EMERALD_PARTY_READ_ERROR",
			error: error.message || "Impossible de lire l’équipe Pokémon.",
		})
	}
})

app.get("/api/emerald/test/team", (_request, response) => {
	response.set("Cache-Control", "no-store").json({
		ok: true,
		party: createRandomTeamPreview(),
	})
})

app.get("/api/emerald/test/max-encounters", (_request, response) => {
	const area = Object.values(emeraldData.maps).reduce((currentMax, candidate) => {
		const currentCount = currentMax.methods.reduce((total, method) => total + method.pokemon.length, 0)
		const candidateCount = candidate.methods.reduce((total, method) => total + method.pokemon.length, 0)
		return candidateCount > currentCount ? candidate : currentMax
	})

	const methods = addEncounterSprites(area.methods).map((method) => ({
		...method,
		pokemon: method.pokemon.map((pokemon) => ({
			...pokemon,
			caught: pokemon.dexNumber % 2 === 0,
		})),
	}))

	response.set("Cache-Control", "no-store").json({
		ok: true,
		location: { name: area.name },
		methods,
		notes: area.notes,
		romMatches: true,
	})
})

app.post("/api/simulate-trophy", (_request, response) => {
	simulationEventId += 1
	response.set("Cache-Control", "no-store").json({ ok: true, simulationEventId })
})

app.listen(PORT, "127.0.0.1", () => {
	console.log("")
	console.log("Overlay RetroAchievements lancé")
	console.log(`Barre de progression trophées: http://127.0.0.1:${PORT}`)
	console.log(`Led GBA : http://127.0.0.1:${PORT}/led.html`)
	console.log(`Mode : ${MODE}`)
	console.log("")
	console.log("Overlay Pokémon Emeraude lancé")
	console.log(`Lieux : http://127.0.0.1:${PORT}/emerald.html`)
	console.log(`Équipe pkmn : http://127.0.0.1:${PORT}/team.html`)
	console.log("")
	console.log("Maintenence")
	console.log(`Page de test : http://127.0.0.1:${PORT}/test.html`)
})
