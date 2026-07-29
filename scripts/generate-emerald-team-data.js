"use strict";

const fs = require("fs");
const path = require("path");

const SOURCE_ROOT = process.env.POKEEMERALD_SOURCE;
const PROJECT_ROOT = path.join(__dirname, "..");
const OUTPUT = path.join(PROJECT_ROOT, "data", "emerald-team.json");
const SPRITE_OUTPUT = path.join(PROJECT_ROOT, "public", "assets", "pokemon");

if (!SOURCE_ROOT) {
  throw new Error("POKEEMERALD_SOURCE doit pointer vers une copie du dépôt pret/pokeemerald.");
}

const speciesConstantsPath = path.join(
  SOURCE_ROOT,
  "include",
  "constants",
  "species.h"
);
const pokemonGraphics = path.join(SOURCE_ROOT, "graphics", "pokemon");

function speciesSlug(constantName) {
  return constantName.toLowerCase().replaceAll("_", "-");
}

function findPartyIcon(constantName) {
  const directory = path.join(pokemonGraphics, constantName.toLowerCase());
  const candidates = [
    path.join(directory, "icon.png"),
    path.join(directory, "normal", "icon.png"),
    path.join(directory, "a", "icon.png")
  ];
  return candidates.find((candidate) => fs.existsSync(candidate));
}

async function fetchFrenchSpecies(slug, retries = 3) {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${slug}`, {
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw new Error(`PokéAPI ${response.status} pour ${slug}`);

    const data = await response.json();
    return {
      dexNumber: data.id,
      name: data.names.find((entry) => entry.language.name === "fr")?.name
        || data.name
    };
  } catch (error) {
    if (retries <= 1) throw error;
    return fetchFrenchSpecies(slug, retries - 1);
  }
}

async function mapWithConcurrency(values, concurrency, callback) {
  const results = new Array(values.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex++;
      results[index] = await callback(values[index]);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

async function main() {
  const existingData = fs.existsSync(OUTPUT)
    ? JSON.parse(fs.readFileSync(OUTPUT, "utf8"))
    : null;
  const constants = fs.readFileSync(speciesConstantsPath, "utf8");
  const species = [...constants.matchAll(/^#define SPECIES_([A-Z0-9_]+)\s+(\d+)$/gm)]
    .map((match) => ({
      constantName: match[1],
      internalId: Number(match[2])
    }))
    .filter(({ constantName, internalId }) =>
      internalId >= 1
      && internalId <= 411
      && !constantName.startsWith("OLD_UNOWN_")
    );

  const records = await mapWithConcurrency(species, 12, async (entry) => {
    const slug = speciesSlug(entry.constantName);
    const localized = existingData?.species?.[entry.internalId]
      || await fetchFrenchSpecies(slug);
    const spriteSource = findPartyIcon(entry.constantName);
    const spriteFile = `${entry.internalId}.png`;

    if (!spriteSource) {
      throw new Error(`Sprite introuvable pour ${entry.constantName}`);
    }

    fs.copyFileSync(spriteSource, path.join(SPRITE_OUTPUT, spriteFile));
    return {
      internalId: entry.internalId,
      dexNumber: localized.dexNumber,
      name: localized.name,
      sprite: `/assets/pokemon/${spriteFile}`
    };
  });

  const eggSource = path.join(pokemonGraphics, "egg", "icon.png");
  fs.copyFileSync(eggSource, path.join(SPRITE_OUTPUT, "egg.png"));

  const byInternalId = Object.fromEntries(
    records
      .sort((first, second) => first.internalId - second.internalId)
      .map((record) => [record.internalId, record])
  );

  fs.writeFileSync(
    OUTPUT,
    `${JSON.stringify({
      generatedFrom: "pret/pokeemerald et PokéAPI",
      species: byInternalId,
      egg: {
        internalId: 412,
        name: "Œuf",
        sprite: "/assets/pokemon/egg.png"
      }
    }, null, 2)}\n`
  );

  console.log(`${records.length} espèces et leurs sprites ont été générés.`);
}

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.mkdirSync(SPRITE_OUTPUT, { recursive: true });

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
