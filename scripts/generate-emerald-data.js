"use strict";

const fs = require("fs");
const path = require("path");

const SOURCE_ROOT = process.env.POKEEMERALD_SOURCE;
const OUTPUT = path.join(__dirname, "..", "data", "emerald-fr.json");

if (!SOURCE_ROOT) {
  throw new Error("POKEEMERALD_SOURCE doit pointer vers une copie du dépôt pret/pokeemerald.");
}

const encountersPath = path.join(SOURCE_ROOT, "src", "data", "wild_encounters.json");
const mapGroupsPath = path.join(SOURCE_ROOT, "data", "maps", "map_groups.json");
const encountersFile = JSON.parse(fs.readFileSync(encountersPath, "utf8"));
const mapGroupsFile = JSON.parse(fs.readFileSync(mapGroupsPath, "utf8"));

const METHOD_FIELDS = {
  land_mons: { id: "land", label: "Herbes" },
  water_mons: { id: "surf", label: "Surf" },
  rock_smash_mons: { id: "rock-smash", label: "Éclate-Roc" }
};

const PLACE_NAMES = {
  ABANDONED_SHIP: "Épave",
  ALTERING_CAVE: "Grotte Métamo",
  ARTISAN_CAVE: "Grotte Atelier",
  BATTLE_FRONTIER: "Zone de Combat",
  CAVE_OF_ORIGIN: "Grotte Origine",
  DESERT_UNDERPASS: "Voie du Désert",
  DEWFORD_TOWN: "Myokara",
  EVER_GRANDE_CITY: "Éternara",
  FALLARBOR_TOWN: "Autéquia",
  FIERY_PATH: "Chemin Ardent",
  FORTREE_CITY: "Cimetronelle",
  GRANITE_CAVE: "Grotte Granite",
  JAGGED_PASS: "Sentier Sinuroc",
  LAVARIDGE_TOWN: "Vermilava",
  LILYCOVE_CITY: "Nénucrique",
  LITTLEROOT_TOWN: "Bourg-en-Vol",
  MAGMA_HIDEOUT: "Planque Magma",
  MAUVILLE_CITY: "Lavandia",
  METEOR_FALLS: "Site Météore",
  MIRAGE_TOWER: "Tour Mirage",
  MOSSDEEP_CITY: "Algatia",
  MT_PYRE: "Mont Mémoria",
  NEW_MAUVILLE: "New Lavandia",
  OLDALE_TOWN: "Rosyères",
  PACIFIDLOG_TOWN: "Pacifiville",
  PETALBURG_CITY: "Clémenti",
  PETALBURG_WOODS: "Bois Clémenti",
  RUSTBORO_CITY: "Mérouville",
  RUSTURF_TUNNEL: "Tunnel Mérazon",
  SAFARI_ZONE: "Parc Safari",
  SEAFLOOR_CAVERN: "Caverne Fondmer",
  SHOAL_CAVE: "Grotte Tréfonds",
  SKY_PILLAR: "Pilier Céleste",
  SLATEPORT_CITY: "Poivressel",
  SOOTOPOLIS_CITY: "Atalanopolis",
  UNDERWATER_SOOTOPOLIS_CITY: "Atalanopolis — sous-marin",
  UNDERWATER: "Sous-marin",
  VERDANTURF_TOWN: "Vergazon",
  VICTORY_ROAD: "Route Victoire"
};

const DETAIL_NAMES = {
  BATTLE_ARENA_BATTLE_ROOM: "Dojo de Combat — salle de combat",
  BATTLE_ARENA_CORRIDOR: "Dojo de Combat — couloir",
  BATTLE_ARENA_LOBBY: "Dojo de Combat — hall",
  BATTLE_DOME_BATTLE_ROOM: "Dôme de Combat — salle de combat",
  BATTLE_DOME_CORRIDOR: "Dôme de Combat — couloir",
  BATTLE_DOME_LOBBY: "Dôme de Combat — hall",
  BATTLE_DOME_PRE_BATTLE_ROOM: "Dôme de Combat — salle d'attente",
  BATTLE_FACTORY_BATTLE_ROOM: "Usine de Combat — salle de combat",
  BATTLE_FACTORY_LOBBY: "Usine de Combat — hall",
  BATTLE_FACTORY_PRE_BATTLE_ROOM: "Usine de Combat — salle d'attente",
  BATTLE_PALACE_BATTLE_ROOM: "Palace de Combat — salle de combat",
  BATTLE_PALACE_CORRIDOR: "Palace de Combat — couloir",
  BATTLE_PALACE_LOBBY: "Palace de Combat — hall",
  BATTLE_PIKE_CORRIDOR: "Reptile de Combat — couloir",
  BATTLE_PIKE_LOBBY: "Reptile de Combat — hall",
  BATTLE_PIKE_ROOM_FINAL: "Reptile de Combat — salle finale",
  BATTLE_PIKE_ROOM_NORMAL: "Reptile de Combat — salle normale",
  BATTLE_PIKE_ROOM_WILD_MONS: "Reptile de Combat — salle des Pokémon sauvages",
  BATTLE_PIKE_THREE_PATH_ROOM: "Reptile de Combat — salle des trois chemins",
  BATTLE_PYRAMID_FLOOR: "Pyramide de Combat — étage",
  BATTLE_PYRAMID_LOBBY: "Pyramide de Combat — hall",
  BATTLE_PYRAMID_TOP: "Pyramide de Combat — sommet",
  BATTLE_ROOM: "salle de combat",
  BATTLE_TOWER_BATTLE_ROOM: "Tour de Combat — salle de combat",
  BATTLE_TOWER_CORRIDOR: "Tour de Combat — couloir",
  BATTLE_TOWER_ELEVATOR: "Tour de Combat — ascenseur",
  BATTLE_TOWER_LOBBY: "Tour de Combat — hall",
  BATTLE_TOWER_MULTI_BATTLE_ROOM: "Tour de Combat — salle de combat Multi",
  BATTLE_TOWER_MULTI_CORRIDOR: "Tour de Combat — couloir Multi",
  BATTLE_TOWER_MULTI_PARTNER_ROOM: "Tour de Combat — salle du partenaire Multi",
  BATTLE_TENT_BATTLE_ROOM: "salle de combat de la Tente",
  BATTLE_TENT_CORRIDOR: "couloir de la Tente de Combat",
  BATTLE_TENT_LOBBY: "hall de la Tente de Combat",
  BIKE_SHOP: "magasin de vélos",
  BRENDANS_HOUSE: "maison de Brice",
  CONTEST_HALL: "salle de Concours",
  CONTEST_LOBBY: "hall des Concours",
  CORRIDOR: "couloir",
  CUTTERS_HOUSE: "maison du Coupeur",
  DEPARTMENT_STORE: "Centre Commercial",
  ENTRANCE: "entrée",
  EXCHANGE_SERVICE_CORNER: "Service d'Échange",
  EXTERIOR: "extérieur",
  FRIENDSHIP_RATERS_HOUSE: "maison de l'Évaluatrice d'amitié",
  GAME_CORNER: "Casino",
  GYM: "Arène",
  HARBOR: "port",
  HIDDEN_FLOOR_CORRIDORS: "couloirs cachés",
  HOUSE: "maison",
  ICE_ROOM: "salle de glace",
  INNER_ROOM: "salle intérieure",
  INSIDE: "intérieur",
  LAB: "laboratoire",
  LOBBY: "hall",
  LOWER_ROOM: "salle basse",
  LOUNGE1: "salon 1",
  LOUNGE2: "salon 2",
  LOUNGE3: "salon 3",
  LOUNGE4: "salon 4",
  LOUNGE5: "salon 5",
  LOUNGE6: "salon 6",
  LOUNGE7: "salon 7",
  LOUNGE8: "salon 8",
  LOUNGE9: "salon 9",
  MART: "Boutique Pokémon",
  MAYS_HOUSE: "maison de Flora",
  MOVE_DELETERS_HOUSE: "maison de l'Effaceur de Capacités",
  MOVE_RELEARNERS_HOUSE: "maison du Maître des Capacités",
  NAME_RATERS_HOUSE: "maison du Spécialiste des Noms",
  OCEANIC_MUSEUM: "Musée Océanographique",
  POKEMON_CENTER: "Centre Pokémon",
  POKEMON_FAN_CLUB: "Fan Club Pokémon",
  POKEMON_SCHOOL: "École de Dresseurs",
  PROFESSOR_BIRCHS_LAB: "laboratoire du Professeur Seko",
  RANKING_HALL: "Maison de Classement",
  RECEPTION_GATE: "accueil",
  ROOMS: "cabines",
  SPACE_CENTER: "Centre Spatial",
  SCOTTS_HOUSE: "maison de Scott",
  STEVENS_CAVE: "grotte de Pierre",
  STEVENS_HOUSE: "maison de Pierre",
  STEVENS_ROOM: "salle de Pierre",
  STAIRS_ROOM: "escaliers",
  SUMMIT: "sommet",
  WALLYS_HOUSE: "maison de Timmy",
  OUTSIDE_EAST: "extérieur est",
  OUTSIDE_WEST: "extérieur ouest"
};

const DETAIL_WORDS = {
  BATTLE: "combat",
  BEAUTY: "Beauté",
  CABLE: "téléphérique",
  CAPTAINS: "capitaine",
  COOL: "Sang-froid",
  CORRIDORS: "couloirs",
  CUTE: "Grâce",
  ELEVATOR: "ascenseur",
  END: "sortie",
  FLOOR: "étage",
  HALL: "salle",
  HIDDEN: "caché",
  HOUSE: "maison",
  LOUNGE: "salon",
  MART: "Boutique",
  MUSEUM: "musée",
  NORMAL: "normale",
  OFFICE: "bureau",
  OUTSIDE: "extérieur",
  PUZZLE: "énigme",
  RECEPTION: "réception",
  REST: "repos",
  ROOF: "toit",
  ROOFTOP: "toit",
  ROOM: "salle",
  ROOMS: "salles",
  SHOP: "boutique",
  SMART: "Intelligence",
  SOUTHEAST: "sud-est",
  TOUGH: "Robustesse",
  UNDERWATER: "sous-marin",
  UNUSED: "inutilisé"
};

const FIELD_RATES = new Map();
const mapEncounters = encountersFile.wild_encounter_groups.find((group) => group.for_maps);

for (const field of mapEncounters.fields) {
  FIELD_RATES.set(field.type, field);
}

function toMapConstant(mapName) {
  const snakeCase = mapName
    .replace(/([A-Z])([A-Z][a-z])/g, "$1_$2")
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .toUpperCase();
  return `MAP_${snakeCase}`;
}

function buildMapIds() {
  const ids = new Map();
  const groups = mapGroupsFile.group_order.map((key) => [key, mapGroupsFile[key]]);

  groups.forEach(([, maps], groupId) => {
    maps.forEach((mapName, mapId) => {
      ids.set(toMapConstant(mapName), { group: groupId, map: mapId });
    });
  });

  return ids;
}

function humanizeDetail(detail) {
  if (!detail) return "";
  if (DETAIL_NAMES[detail]) return DETAIL_NAMES[detail];
  if (/^(B?\d+F|\d+R)$/.test(detail)) return detail;
  if (/^ROOM\d+$/.test(detail)) return `salle ${detail.slice(4)}`;

  const floorMatch = detail.match(/^(.+)_(B?\d+F|\d+R)$/);
  if (floorMatch) return `${humanizeDetail(floorMatch[1])} — ${floorMatch[2]}`;

  const houseMatch = detail.match(/^HOUSE(\d+)$/);
  if (houseMatch) return `maison ${houseMatch[1]}`;

  const flatMatch = detail.match(/^FLAT(\d+)(?:_(B?\d+F))?$/);
  if (flatMatch) {
    return `immeuble ${flatMatch[1]}${flatMatch[2] ? ` — ${flatMatch[2]}` : ""}`;
  }

  return detail
    .split("_")
    .map((word) => DETAIL_WORDS[word] || word.toLowerCase())
    .join(" ");
}

function locationName(mapConstant) {
  const raw = mapConstant.replace(/^MAP_/, "");
  const route = raw.match(/^ROUTE(\d+)(?:_(.+))?$/);
  if (route) {
    const detail = humanizeDetail(route[2]);
    return detail ? `Route ${route[1]} — ${detail}` : `Route ${route[1]}`;
  }

  const underwaterRoute = raw.match(/^UNDERWATER_ROUTE(\d+)$/);
  if (underwaterRoute) return `Route ${underwaterRoute[1]} — sous-marin`;

  const prefix = Object.keys(PLACE_NAMES)
    .sort((first, second) => second.length - first.length)
    .find((candidate) => raw === candidate || raw.startsWith(`${candidate}_`));

  if (!prefix) {
    return raw
      .toLowerCase()
      .replaceAll("_", " ")
      .replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
  }

  const detail = humanizeDetail(raw.slice(prefix.length).replace(/^_/, ""));
  return detail ? `${PLACE_NAMES[prefix]} — ${detail}` : PLACE_NAMES[prefix];
}

function speciesSlug(speciesConstant) {
  return speciesConstant.replace(/^SPECIES_/, "").toLowerCase().replaceAll("_", "-");
}

async function loadFrenchSpeciesName(speciesConstant) {
  const slug = speciesSlug(speciesConstant);
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${slug}`, {
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) throw new Error(`PokéAPI ${response.status} pour ${slug}`);
  const data = await response.json();
  return {
    name: data.names.find((entry) => entry.language.name === "fr")?.name
      || slug.replaceAll("-", " "),
    dexNumber: data.id
  };
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

function aggregateMons(mons, weights, frenchNames, indexes = mons.map((_, index) => index)) {
  const aggregated = new Map();

  indexes.forEach((slotIndex) => {
    const mon = mons[slotIndex];
    const key = mon.species;
    const current = aggregated.get(key) || {
      name: frenchNames.get(key).name,
      dexNumber: frenchNames.get(key).dexNumber,
      minLevel: mon.min_level,
      maxLevel: mon.max_level,
      rate: 0
    };

    current.minLevel = Math.min(current.minLevel, mon.min_level);
    current.maxLevel = Math.max(current.maxLevel, mon.max_level);
    current.rate += weights[slotIndex];
    aggregated.set(key, current);
  });

  return [...aggregated.values()]
    .sort((first, second) => second.rate - first.rate || first.name.localeCompare(second.name, "fr"));
}

function standardMethods(entry, frenchNames) {
  const methods = [];

  for (const [fieldName, method] of Object.entries(METHOD_FIELDS)) {
    if (!entry[fieldName]) continue;
    const field = FIELD_RATES.get(fieldName);
    methods.push({
      ...method,
      encounterRate: entry[fieldName].encounter_rate,
      pokemon: aggregateMons(entry[fieldName].mons, field.encounter_rates, frenchNames)
    });
  }

  if (entry.fishing_mons) {
    const field = FIELD_RATES.get("fishing_mons");
    const rods = [
      ["old-rod", "Canne", field.groups.old_rod],
      ["good-rod", "Super Canne", field.groups.good_rod],
      ["super-rod", "Méga Canne", field.groups.super_rod]
    ];

    for (const [id, label, indexes] of rods) {
      methods.push({
        id,
        label,
        encounterRate: entry.fishing_mons.encounter_rate,
        pokemon: aggregateMons(
          entry.fishing_mons.mons,
          field.encounter_rates,
          frenchNames,
          indexes
        )
      });
    }
  }

  return methods;
}

async function main() {
  const mapIds = buildMapIds();
  const uniqueSpecies = [...new Set(
    mapEncounters.encounters.flatMap((entry) =>
      Object.keys({ ...METHOD_FIELDS, fishing_mons: true })
        .flatMap((fieldName) => entry[fieldName]?.mons || [])
        .map((mon) => mon.species)
    )
  )].sort();

  const names = await mapWithConcurrency(uniqueSpecies, 12, async (species) => [
    species,
    await loadFrenchSpeciesName(species)
  ]);
  const frenchNames = new Map(names);
  const maps = {};

  for (const [mapConstant, id] of mapIds) {
    maps[`${id.group}:${id.map}`] = {
      id: mapConstant,
      name: locationName(mapConstant),
      methods: [],
      notes: []
    };
  }

  // La Grotte Métamo possède neuf tables événementielles. Sans événement officiel,
  // la première table (Nosferapti) est celle utilisée par la version commerciale.
  for (const entry of mapEncounters.encounters) {
    const id = mapIds.get(entry.map);
    if (!id) throw new Error(`Identifiant de carte introuvable pour ${entry.map}`);
    const key = `${id.group}:${id.map}`;
    if (maps[key].methods.length > 0) continue;

    maps[key] = {
      id: entry.map,
      name: locationName(entry.map),
      methods: standardMethods(entry, frenchNames),
      notes: entry.map === "MAP_ROUTE119"
        ? ["Barpau peut remplacer une rencontre à la pêche sur six cases spéciales de la Route 119."]
        : []
    };
  }

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, `${JSON.stringify({
    game: "Pokémon Version Émeraude (France)",
    romCrc32: "A3FDCCB1",
    saveBlock1PointerAddress: "03005D8C",
    generatedFrom: "pret/pokeemerald",
    maps
  }, null, 2)}\n`);

  console.log(`${Object.keys(maps).length} cartes et ${uniqueSpecies.length} Pokémon écrits dans ${OUTPUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
