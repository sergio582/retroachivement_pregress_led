"use strict";

const teamData = require("../data/emerald-team.json");

const PLAYER_PARTY_COUNT_ADDRESS = 0x020244E9;
const PLAYER_PARTY_ADDRESS = 0x020244EC;
const PARTY_SIZE = 6;
const POKEMON_SIZE = 100;
const SECURE_OFFSET = 32;
const SECURE_LENGTH = 48;

// Position du bloc "Growth" pour chacune des 24 permutations des données chiffrées.
const GROWTH_SUBSTRUCT_INDEX = [
  0, 0, 0, 0, 0, 0,
  1, 1, 2, 3, 2, 3,
  1, 1, 2, 3, 2, 3,
  1, 1, 2, 3, 2, 3
];

const CHARACTER_MAP = new Map([
  [0x00, " "],
  [0x01, "À"], [0x02, "Á"], [0x03, "Â"], [0x04, "Ç"],
  [0x05, "È"], [0x06, "É"], [0x07, "Ê"], [0x08, "Ë"],
  [0x09, "Ì"], [0x0B, "Î"], [0x0C, "Ï"], [0x0D, "Ò"],
  [0x0E, "Ó"], [0x0F, "Ô"], [0x10, "Œ"], [0x11, "Ù"],
  [0x12, "Ú"], [0x13, "Û"], [0x14, "Ñ"], [0x15, "ß"],
  [0x16, "à"], [0x17, "á"], [0x19, "ç"], [0x1A, "è"],
  [0x1B, "é"], [0x1C, "ê"], [0x1D, "ë"], [0x1E, "ì"],
  [0x20, "î"], [0x21, "ï"], [0x22, "ò"], [0x23, "ó"],
  [0x24, "ô"], [0x25, "œ"], [0x26, "ù"], [0x27, "ú"],
  [0x28, "û"], [0x29, "ñ"], [0x2A, "º"], [0x2B, "ª"],
  [0x2D, "&"], [0x2E, "+"], [0x35, "="], [0x36, ";"],
  [0x51, "¿"], [0x52, "¡"], [0x5B, "%"], [0x5C, "("],
  [0x5D, ")"], [0x68, "â"], [0x6F, "í"],
  [0x85, "<"], [0x86, ">"],
  [0xAB, "!"], [0xAC, "?"], [0xAD, "."], [0xAE, "-"],
  [0xAF, "·"], [0xB0, "…"], [0xB1, "“"], [0xB2, "”"],
  [0xB3, "‘"], [0xB4, "’"], [0xB5, "♂"], [0xB6, "♀"],
  [0xB7, "¥"], [0xB8, ","], [0xB9, "×"], [0xBA, "/"],
  [0xF0, ":"], [0xF1, "Ä"], [0xF2, "Ö"], [0xF3, "Ü"],
  [0xF4, "ä"], [0xF5, "ö"], [0xF6, "ü"]
]);

for (let index = 0; index <= 9; index += 1) {
  CHARACTER_MAP.set(0xA1 + index, String(index));
}
for (let index = 0; index < 26; index += 1) {
  CHARACTER_MAP.set(0xBB + index, String.fromCharCode(65 + index));
  CHARACTER_MAP.set(0xD5 + index, String.fromCharCode(97 + index));
}

function decodeGameString(buffer) {
  let result = "";
  for (const byte of buffer) {
    if (byte === 0xFF) break;
    result += CHARACTER_MAP.get(byte) || "";
  }
  return result.trim();
}

function decryptSecureData(buffer, personality, otId) {
  const decrypted = Buffer.alloc(SECURE_LENGTH);
  const key = (personality ^ otId) >>> 0;

  for (let offset = 0; offset < SECURE_LENGTH; offset += 4) {
    decrypted.writeUInt32LE(
      (buffer.readUInt32LE(SECURE_OFFSET + offset) ^ key) >>> 0,
      offset
    );
  }
  return decrypted;
}

function secureChecksum(buffer) {
  let checksum = 0;
  for (let offset = 0; offset < SECURE_LENGTH; offset += 2) {
    checksum = (checksum + buffer.readUInt16LE(offset)) & 0xFFFF;
  }
  return checksum;
}

function pokemonStatus(status, hp) {
  if (hp === 0) return { id: "ko", emoji: "💀", label: "K.O." };
  if ((status & 0x7) !== 0) return { id: "sleep", emoji: "💤", label: "Endormi" };
  if ((status & 0x88) !== 0) return { id: "poison", emoji: "🤢", label: "Empoisonné" };
  if ((status & 0x10) !== 0) return { id: "burn", emoji: "🔥", label: "Brûlé" };
  if ((status & 0x20) !== 0) return { id: "freeze", emoji: "🧊", label: "Gelé" };
  if ((status & 0x40) !== 0) return { id: "paralysis", emoji: "⚡", label: "Paralysé" };
  return { id: "healthy", emoji: "🟢", label: "En forme" };
}

function decodePokemon(buffer, slot) {
  if (!Buffer.isBuffer(buffer) || buffer.length < POKEMON_SIZE) {
    throw new Error(`Les données du Pokémon ${slot + 1} sont incomplètes.`);
  }

  const personality = buffer.readUInt32LE(0);
  const otId = buffer.readUInt32LE(4);
  const decrypted = decryptSecureData(buffer, personality, otId);
  const growthOffset = GROWTH_SUBSTRUCT_INDEX[personality % 24] * 12;
  const internalSpeciesId = decrypted.readUInt16LE(growthOffset);

  if (internalSpeciesId === 0) return null;
  if (secureChecksum(decrypted) !== buffer.readUInt16LE(28)) {
    const error = new Error(`La somme de contrôle du Pokémon ${slot + 1} est invalide.`);
    error.code = "EMERALD_PARTY_CHECKSUM";
    throw error;
  }

  const isEgg = (buffer[19] & 0x04) !== 0 || internalSpeciesId === teamData.egg.internalId;
  const species = isEgg ? teamData.egg : teamData.species[internalSpeciesId];
  if (!species) {
    const error = new Error(`Espèce interne inconnue (${internalSpeciesId}).`);
    error.code = "EMERALD_PARTY_SPECIES";
    throw error;
  }

  const decodedNickname = decodeGameString(buffer.subarray(8, 18));
  const speciesName = species.name;
  const nickname = decodedNickname
    && decodedNickname.localeCompare(speciesName, "fr", { sensitivity: "base" }) !== 0
    ? decodedNickname
    : null;
  const hp = buffer.readUInt16LE(86);
  const maxHp = buffer.readUInt16LE(88);
  const heldItemId = decrypted.readUInt16LE(growthOffset + 2);

  return {
    slot,
    internalSpeciesId,
    dexNumber: species.dexNumber || null,
    speciesName,
    nickname,
    sprite: species.sprite,
    level: buffer[84],
    hp,
    maxHp,
    hpPercent: maxHp > 0 ? Math.round((Math.min(hp, maxHp) / maxHp) * 100) : 0,
    status: pokemonStatus(buffer.readUInt32LE(80), hp),
    hasHeldItem: heldItemId !== 0,
    isEgg
  };
}

function decodeParty(buffer, partyCount = PARTY_SIZE) {
  if (!Buffer.isBuffer(buffer) || buffer.length < PARTY_SIZE * POKEMON_SIZE) {
    throw new Error("Les données de l’équipe sont incomplètes.");
  }
  if (!Number.isInteger(partyCount) || partyCount < 0 || partyCount > PARTY_SIZE) {
    const error = new Error(`Nombre de Pokémon invalide dans l’équipe (${partyCount}).`);
    error.code = "EMERALD_PARTY_COUNT";
    throw error;
  }

  const party = [];
  for (let slot = 0; slot < partyCount; slot += 1) {
    const offset = slot * POKEMON_SIZE;
    const pokemon = decodePokemon(buffer.subarray(offset, offset + POKEMON_SIZE), slot);
    if (pokemon) party.push(pokemon);
  }
  return party;
}

async function getEmeraldParty(retroArch) {
  const status = await retroArch.getStatus();
  if (status.state === "CONTENTLESS") {
    const error = new Error("Aucun jeu n’est lancé dans RetroArch.");
    error.code = "NO_CONTENT";
    throw error;
  }

  const countBuffer = await retroArch.readMemory(PLAYER_PARTY_COUNT_ADDRESS, 1);
  const buffer = await retroArch.readMemory(
    PLAYER_PARTY_ADDRESS,
    PARTY_SIZE * POKEMON_SIZE
  );
  const partyCount = countBuffer[0];

  return {
    game: "Pokémon Version Émeraude (France)",
    party: decodeParty(buffer, partyCount),
    retroarch: status,
    updatedAt: new Date().toISOString()
  };
}

module.exports = {
  GROWTH_SUBSTRUCT_INDEX,
  PARTY_SIZE,
  PLAYER_PARTY_ADDRESS,
  PLAYER_PARTY_COUNT_ADDRESS,
  POKEMON_SIZE,
  decodeGameString,
  decodeParty,
  decodePokemon,
  decryptSecureData,
  getEmeraldParty,
  pokemonStatus,
  secureChecksum
};
