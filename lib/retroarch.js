"use strict";

const dgram = require("dgram");

class RetroArchError extends Error {
  constructor(message, code, cause) {
    super(message, { cause });
    this.name = "RetroArchError";
    this.code = code;
  }
}

function sendCommand(command, options = {}) {
  const host = options.host || "127.0.0.1";
  const port = options.port || 55355;
  const timeoutMs = options.timeoutMs || 900;

  return new Promise((resolve, reject) => {
    const socket = dgram.createSocket("udp4");
    let finished = false;

    function finish(error, response) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      socket.close();
      if (error) reject(error);
      else resolve(response);
    }

    const timer = setTimeout(() => {
      finish(new RetroArchError(
        "RetroArch ne répond pas. Active Paramètres > Réseau > Commandes réseau.",
        "RETROARCH_TIMEOUT"
      ));
    }, timeoutMs);

    socket.once("error", (error) => {
      finish(new RetroArchError(
        `Connexion UDP à RetroArch impossible : ${error.message}`,
        "RETROARCH_SOCKET",
        error
      ));
    });

    socket.once("message", (message) => {
      finish(null, message.toString("utf8").trim());
    });

    socket.send(Buffer.from(command, "utf8"), port, host, (error) => {
      if (error) {
        finish(new RetroArchError(
          `Commande RetroArch impossible : ${error.message}`,
          "RETROARCH_SEND",
          error
        ));
      }
    });
  });
}

function parseMemoryResponse(response, expectedLength, command = "READ_CORE_MEMORY") {
  const parts = response.split(/\s+/);

  if (parts[0] !== command) {
    throw new RetroArchError(
      `Cette version de RetroArch ne prend pas en charge ${command}.`,
      "RETROARCH_UNSUPPORTED"
    );
  }

  if (parts[2] === "-1") {
    throw new RetroArchError(
      `Lecture de la mémoire refusée par RetroArch : ${parts.slice(3).join(" ") || "erreur inconnue"}.`,
      "RETROARCH_MEMORY"
    );
  }

  const bytes = parts.slice(2).map((value) => Number.parseInt(value, 16));
  if (
    bytes.length < expectedLength
    || bytes.some((value) => !Number.isInteger(value) || value < 0 || value > 255)
  ) {
    throw new RetroArchError(
      "RetroArch a renvoyé une réponse mémoire incomplète.",
      "RETROARCH_RESPONSE"
    );
  }

  return Buffer.from(bytes.slice(0, expectedLength));
}

async function readCoreMemory(address, length, options) {
  const addressHex = address.toString(16).toUpperCase();
  const response = await sendCommand(`READ_CORE_MEMORY ${addressHex} ${length}`, options);
  return parseMemoryResponse(response, length);
}

function systemToAchievementAddress(address) {
  if (address >= 0x03000000 && address < 0x03008000) {
    return address - 0x03000000;
  }

  if (address >= 0x02000000 && address < 0x02040000) {
    return address - 0x02000000 + 0x8000;
  }

  throw new RetroArchError(
    `L’adresse GBA 0x${address.toString(16).toUpperCase()} n’est pas une adresse RAM prise en charge.`,
    "RETROARCH_MEMORY"
  );
}

async function readAchievementMemory(address, length, options) {
  const achievementAddress = systemToAchievementAddress(address);
  const addressHex = achievementAddress.toString(16).toUpperCase();
  const response = await sendCommand(`READ_CORE_RAM ${addressHex} ${length}`, options);
  return parseMemoryResponse(response, length, "READ_CORE_RAM");
}

async function readMemory(address, length, options) {
  try {
    return await readCoreMemory(address, length, options);
  } catch (error) {
    if (!["RETROARCH_TIMEOUT", "RETROARCH_UNSUPPORTED", "RETROARCH_MEMORY"].includes(error.code)) {
      throw error;
    }

    try {
      return await readAchievementMemory(address, length, options);
    } catch (fallbackError) {
      if (fallbackError.code === "RETROARCH_TIMEOUT") {
        throw new RetroArchError(
          "La lecture RAM nécessite une version récente de RetroArch ou l’activation de RetroAchievements dans RetroArch.",
          "RETROARCH_UNSUPPORTED",
          fallbackError
        );
      }
      throw fallbackError;
    }
  }
}

async function getStatus(options) {
  const response = await sendCommand("GET_STATUS", options);

  if (response === "GET_STATUS CONTENTLESS") {
    return { state: "CONTENTLESS", system: null, game: null, crc32: null };
  }

  const match = response.match(
    /^GET_STATUS (PLAYING|PAUSED) ([^,]+),([^,]+),crc32=([0-9A-Fa-f]+)$/
  );
  if (!match) {
    throw new RetroArchError(
      "Réponse d’état RetroArch non reconnue.",
      "RETROARCH_RESPONSE"
    );
  }

  return {
    state: match[1],
    system: match[2],
    game: match[3],
    crc32: match[4].toUpperCase()
  };
}

module.exports = {
  RetroArchError,
  getStatus,
  parseMemoryResponse,
  readMemory,
  systemToAchievementAddress,
  sendCommand
};
