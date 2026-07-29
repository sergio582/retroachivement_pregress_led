"use strict";

const assert = require("node:assert");
const emeraldData = require("../data/emerald-fr.json");

const battleFrontierMaps = Object.values(emeraldData.maps)
  .filter((map) => map.id.startsWith("MAP_BATTLE_FRONTIER_"));
const englishWords = /\b(outside|west|east|tower|dome|partner|pre|pyramid|arena|factory|pike|three|path|wild|mons|ranking|lounge\d*|scotts|gate|lobby|corridor|room|top|final)\b/i;
const untranslated = battleFrontierMaps
  .filter((map) => englishWords.test(map.name))
  .map((map) => `${map.id} => ${map.name}`);

assert.strictEqual(battleFrontierMaps.length, 47, "La liste des lieux de la Zone de Combat a changé.");
assert.deepStrictEqual(
  untranslated,
  [],
  `Lieux de la Zone de Combat encore en anglais :\n${untranslated.join("\n")}`
);
assert.strictEqual(
  battleFrontierMaps.find((map) => map.id.endsWith("BATTLE_TOWER_LOBBY"))?.name,
  "Zone de Combat — Tour de Combat — hall"
);
assert.strictEqual(
  battleFrontierMaps.find((map) => map.id.endsWith("BATTLE_PIKE_ROOM_WILD_MONS"))?.name,
  "Zone de Combat — Reptile de Combat — salle des Pokémon sauvages"
);

console.log("Traductions de la Zone de Combat : OK");
