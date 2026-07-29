"use strict";

const emeraldData = require("../data/emerald-fr.json");

const SAVE_BLOCK_1_POINTER = Number.parseInt(emeraldData.saveBlock1PointerAddress, 16);
const SAVE_BLOCK_2_POINTER = 0x03005D90;
const POKEDEX_OWNED_OFFSET = 0x28;
const POKEDEX_FLAG_BYTES = 0x34;
const EWRAM_START = 0x02000000;
const EWRAM_END = 0x02040000;

function readLocationFromBuffers(pointerBuffer, saveBlockBuffer) {
  if (!Buffer.isBuffer(pointerBuffer) || pointerBuffer.length < 4) {
    throw new Error("Le pointeur de sauvegarde est incomplet.");
  }

  if (!Buffer.isBuffer(saveBlockBuffer) || saveBlockBuffer.length < 8) {
    throw new Error("Les données de position sont incomplètes.");
  }

  const saveBlockAddress = pointerBuffer.readUInt32LE(0);
  if (saveBlockAddress < EWRAM_START || saveBlockAddress + 8 > EWRAM_END) {
    throw new Error(
      `Pointeur de sauvegarde invalide (0x${saveBlockAddress.toString(16).toUpperCase()}).`
    );
  }

  return {
    saveBlockAddress,
    x: saveBlockBuffer.readInt16LE(0),
    y: saveBlockBuffer.readInt16LE(2),
    group: saveBlockBuffer[4],
    map: saveBlockBuffer[5]
  };
}

function readPointer(pointerBuffer, label) {
  if (!Buffer.isBuffer(pointerBuffer) || pointerBuffer.length < 4) {
    throw new Error(`Le pointeur ${label} est incomplet.`);
  }

  const address = pointerBuffer.readUInt32LE(0);
  if (address < EWRAM_START || address >= EWRAM_END) {
    throw new Error(
      `Pointeur ${label} invalide (0x${address.toString(16).toUpperCase()}).`
    );
  }
  return address;
}

function isCaught(ownedFlags, nationalDexNumber) {
  const flag = nationalDexNumber - 1;
  const byteIndex = Math.floor(flag / 8);
  const mask = 1 << (flag % 8);
  return byteIndex >= 0
    && byteIndex < ownedFlags.length
    && (ownedFlags[byteIndex] & mask) !== 0;
}

function addCaptureStatus(methods, ownedFlags) {
  return methods.map((method) => ({
    ...method,
    pokemon: method.pokemon.map((pokemon) => ({
      ...pokemon,
      caught: isCaught(ownedFlags, pokemon.dexNumber)
    }))
  }));
}

async function getEmeraldEncounters(retroArch) {
  const status = await retroArch.getStatus();
  if (status.state === "CONTENTLESS") {
    const error = new Error("Aucun jeu n’est lancé dans RetroArch.");
    error.code = "NO_CONTENT";
    throw error;
  }

  const [saveBlock1PointerBuffer, saveBlock2PointerBuffer] = await Promise.all([
    retroArch.readMemory(SAVE_BLOCK_1_POINTER, 4),
    retroArch.readMemory(SAVE_BLOCK_2_POINTER, 4)
  ]);
  const saveBlock1Address = readPointer(saveBlock1PointerBuffer, "SaveBlock1");
  const saveBlock2Address = readPointer(saveBlock2PointerBuffer, "SaveBlock2");

  if (saveBlock1Address + 8 > EWRAM_END || saveBlock2Address + POKEDEX_OWNED_OFFSET + POKEDEX_FLAG_BYTES > EWRAM_END) {
    const error = new Error(
      "La RAM lue ne correspond pas à Pokémon Version Émeraude (France)."
    );
    error.code = "WRONG_GAME";
    throw error;
  }

  const [saveBlockBuffer, ownedFlags] = await Promise.all([
    retroArch.readMemory(saveBlock1Address, 8),
    retroArch.readMemory(saveBlock2Address + POKEDEX_OWNED_OFFSET, POKEDEX_FLAG_BYTES)
  ]);
  const location = readLocationFromBuffers(saveBlock1PointerBuffer, saveBlockBuffer);
  const area = emeraldData.maps[`${location.group}:${location.map}`];

  if (!area) {
    const error = new Error(
      `Carte inconnue (${location.group}:${location.map}). Vérifie que la ROM est bien la version française originale.`
    );
    error.code = "UNKNOWN_MAP";
    throw error;
  }

  return {
    game: emeraldData.game,
    location: {
      name: area.name,
      group: location.group,
      map: location.map,
      x: location.x,
      y: location.y
    },
    methods: addCaptureStatus(area.methods, ownedFlags),
    notes: area.notes,
    retroarch: status,
    romMatches: !status.crc32 || status.crc32 === emeraldData.romCrc32,
    expectedCrc32: emeraldData.romCrc32,
    updatedAt: new Date().toISOString()
  };
}

module.exports = {
  SAVE_BLOCK_1_POINTER,
  SAVE_BLOCK_2_POINTER,
  addCaptureStatus,
  getEmeraldEncounters,
  isCaught,
  readLocationFromBuffers
};
