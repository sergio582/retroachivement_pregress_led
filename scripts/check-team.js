"use strict";

const assert = require("assert");
const {
  GROWTH_SUBSTRUCT_INDEX,
  POKEMON_SIZE,
  PLAYER_PARTY_ADDRESS,
  PLAYER_PARTY_COUNT_ADDRESS,
  decodeParty,
  decodePokemon,
  getEmeraldParty,
  pokemonStatus,
  secureChecksum
} = require("../lib/emerald-team");

function encodeName(name) {
  const bytes = Buffer.alloc(10, 0xFF);
  [...name].slice(0, 10).forEach((character, index) => {
    if (character >= "A" && character <= "Z") {
      bytes[index] = 0xBB + character.charCodeAt(0) - 65;
    } else {
      throw new Error(`Caractère de test non pris en charge : ${character}`);
    }
  });
  return bytes;
}

function createPokemon({
  personality,
  otId = 0x12345678,
  species,
  nickname,
  heldItem = 0,
  level = 20,
  hp = 50,
  maxHp = 60,
  status = 0
}) {
  const buffer = Buffer.alloc(POKEMON_SIZE);
  const decrypted = Buffer.alloc(48);
  const growthOffset = GROWTH_SUBSTRUCT_INDEX[personality % 24] * 12;
  const key = (personality ^ otId) >>> 0;

  buffer.writeUInt32LE(personality, 0);
  buffer.writeUInt32LE(otId, 4);
  encodeName(nickname).copy(buffer, 8);
  buffer[19] = 0x02;
  decrypted.writeUInt16LE(species, growthOffset);
  decrypted.writeUInt16LE(heldItem, growthOffset + 2);
  buffer.writeUInt16LE(secureChecksum(decrypted), 28);

  for (let offset = 0; offset < decrypted.length; offset += 4) {
    buffer.writeUInt32LE((decrypted.readUInt32LE(offset) ^ key) >>> 0, 32 + offset);
  }

  buffer.writeUInt32LE(status, 80);
  buffer[84] = level;
  buffer.writeUInt16LE(hp, 86);
  buffer.writeUInt16LE(maxHp, 88);
  return buffer;
}

const pikachuBuffer = createPokemon({
  personality: 7,
  species: 25,
  nickname: "SPARKY",
  heldItem: 13,
  level: 36,
  hp: 42,
  maxHp: 84,
  status: 0x40
});
const pikachu = decodePokemon(pikachuBuffer, 0);

assert.strictEqual(pikachu.speciesName, "Pikachu");
assert.strictEqual(pikachu.nickname, "SPARKY");
assert.strictEqual(pikachu.hasHeldItem, true);
assert.strictEqual(pikachu.level, 36);
assert.strictEqual(pikachu.hpPercent, 50);
assert.strictEqual(pikachu.status.id, "paralysis");

const koBuffer = createPokemon({
  personality: 22,
  species: 277,
  nickname: "ARCKO",
  hp: 0,
  maxHp: 45,
  status: 0
});
const partyBuffer = Buffer.alloc(POKEMON_SIZE * 6);
pikachuBuffer.copy(partyBuffer, 0);
koBuffer.copy(partyBuffer, POKEMON_SIZE);
const party = decodeParty(partyBuffer);

assert.strictEqual(party.length, 2);
assert.strictEqual(party[1].speciesName, "Arcko");
assert.strictEqual(party[1].nickname, null);
assert.strictEqual(party[1].status.id, "ko");
assert.deepStrictEqual(pokemonStatus(0x8, 20), {
  id: "poison",
  emoji: "🤢",
  label: "Empoisonné"
});

const corrupted = Buffer.from(pikachuBuffer);
corrupted[32] ^= 0x01;
assert.throws(
  () => decodePokemon(corrupted, 0),
  (error) => error.code === "EMERALD_PARTY_CHECKSUM"
);

const memoryReads = [];
getEmeraldParty({
  getStatus: async () => ({ state: "PLAYING", game: "Pokemon Emerald" }),
  readMemory: async (address, length) => {
    memoryReads.push({ address, length });
    if (address === PLAYER_PARTY_COUNT_ADDRESS) return Buffer.from([2]);
    if (address === PLAYER_PARTY_ADDRESS) return partyBuffer;
    throw new Error(`Lecture inattendue : 0x${address.toString(16)}`);
  }
}).then((result) => {
  assert.strictEqual(result.party.length, 2);
  assert.deepStrictEqual(memoryReads, [
    { address: PLAYER_PARTY_COUNT_ADDRESS, length: 1 },
    { address: PLAYER_PARTY_ADDRESS, length: POKEMON_SIZE * 6 }
  ]);
  console.log("Décodage de l’équipe Émeraude : OK");
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
