const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");
const fs = require("fs");
const simpleGit = require("simple-git");

const TOKEN = process.env.BOT_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PORT = process.env.PORT || 3000;
const DATA_FILE = "whitelist.json";
const REPO = "maybedelusional"; // 🔥 change to your GitHub username/repo
const BRANCH = "main";             // or "master" depending on your repo

// --- Load existing whitelist ---
let WHITELIST = [];
if (fs.existsSync(DATA_FILE)) {
  WHITELIST = JSON.parse(fs.readFileSync(DATA_FILE));
  console.log("✅ Loaded whitelist:", WHITELIST);
}

// --- Save whitelist + push to GitHub ---
async function saveWhitelist() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(WHITELIST, null, 2));

  const git = simpleGit();
  try {
    await git.add(DATA_FILE);
    await git.commit("Update whitelist.json");
    await git.push(
      `https://x-access-token:${GITHUB_TOKEN}@github.com/${REPO}.git`,
      BRANCH
    );
    console.log("✅ Whitelist pushed to GitHub");
  } catch (err) {
    console.error("❌ Failed to push whitelist:", err.message);
  }
}

// --- Express API ---
const app = express();
app.use(express.json());

app.get("/whitelist", (req, res) => {
  res.json({ users: WHITELIST });
});

// --- Discord Bot ---
const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

bot.once("ready", () => {
  console.log(`🤖 SigmaLine Bot logged in as ${bot.user.tag}`);
});

bot.on("messageCreate", async (msg) => {
  if (!msg.content.startsWith("!sigmaline")) return;

  const [cmd, action, username] = msg.content.split(" ");

  if (action === "add" && username) {
    if (!WHITELIST.includes(username)) {
      WHITELIST.push(username);
      await saveWhitelist();
      msg.reply(`✅ ${username} added to SigmaLine whitelist`);
    } else {
      msg.reply(`⚠️ ${username} is already whitelisted`);
    }
  }

  if (action === "remove" && username) {
    WHITELIST = WHITELIST.filter(u => u !== username);
    await saveWhitelist();
    msg.reply(`❌ ${username} removed from SigmaLine whitelist`);
  }

  if (action === "list") {
    msg.reply(
      "📋 SigmaLine Whitelist: " +
        (WHITELIST.length > 0 ? WHITELIST.join(", ") : "none")
    );
  }
});

bot.login(TOKEN);

// --- Start API server ---
app.listen(PORT, () => console.log(`🌐 SigmaLine API running on port ${PORT}`));
