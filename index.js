const dotenv = require('dotenv');
dotenv.config()
const Telegraf = require('telegraf');
const { REFRESH_TOKEN, BOT_TOKEN, PLAYLIST_ID } = process.env;

const bot = new Telegraf(BOT_TOKEN)
// initialize the Youtube API library

const initBot = () => {
  bot.start((ctx) => ctx.reply('No, you start'))
  bot.hears(videoIdRegex, async (ctx) => {
    await addVideoToPlaylist(ctx.message.text);
    return ctx.reply(`Added video to youtube playlist: https://www.youtube.com/playlist?list=${PLAYLIST_ID}`);
  })
  bot.launch();
}
