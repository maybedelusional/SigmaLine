const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");
const fs = require("fs");

const TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;
const DATA_FILE = "whitelist.json";

// Load existing whitelist
let WHITELIST = [];
if (fs.existsSync(DATA_FILE)) {
  WHITELIST = JSON.parse(fs.readFileSync(DATA_FILE));
}

// Save whitelist
function saveWhitelist() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(WHITELIST, null, 2));
}

// Express API
const app = express();
app.use(express.json());

// Endpoint Roblox will call
app.get("/whitelist", (req, res) => {
  res.json({ users: WHITELIST });
});

// Discord bot
const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

bot.on("ready", () => {
  console.log(`🤖 SigmaLine Bot logged in as ${bot.user.tag}`);
});

bot.on("messageCreate", async (msg) => {
  if (!msg.content.startsWith("!sigmaline")) return;

  const [cmd, action, username] = msg.content.split(" ");

  if (action === "add" && username) {
    if (!WHITELIST.includes(username)) {
      WHITELIST.push(username);
      saveWhitelist();
      msg.reply(`✅ ${username} added to SigmaLine whitelist`);
    } else {
      msg.reply(`⚠️ ${username} is already whitelisted`);
    }
  }

  if (action === "remove" && username) {
    WHITELIST = WHITELIST.filter(u => u !== username);
    saveWhitelist();
    msg.reply(`❌ ${username} removed from SigmaLine whitelist`);
  }

  if (action === "list") {
    msg.reply("📋 SigmaLine Whitelist: " + (WHITELIST.length > 0 ? WHITELIST.join(", ") : "none"));
  }
});

bot.login(TOKEN);

// Start API server
app.listen(PORT, () => console.log(`🌐 SigmaLine API running on port ${PORT}`));
