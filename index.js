const dotenv = require('dotenv');
dotenv.config()
const Telegraf = require('telegraf');
const { google } = require('googleapis');
const sampleClient = require('./oauthclient');

const videoIdRegex = /(?:youtube\.com\/watch\?v=|youtu.be\/)(.*)/;
const { REFRESH_TOKEN, BOT_TOKEN, PLAYLIST_ID } = process.env;

const bot = new Telegraf(BOT_TOKEN)
// initialize the Youtube API library
let youtube;


const addVideoToPlaylist = async (url) => {
  const insertPayload = {
    part: 'snippet',
    resource: {
      snippet: {
        playlistId: PLAYLIST_ID,
        position: 0,
        resourceId: {
          kind: 'youtube#video',
          videoId: url.match(videoIdRegex)[1]
        }
      }
    }
  }
  return youtube.playlistItems.insert(insertPayload);
}

const initBot = () => {
  bot.start((ctx) => ctx.reply('No, you start'))
  bot.hears(videoIdRegex, async (ctx) => {
    await addVideoToPlaylist(ctx.message.text);
    return ctx.reply(`Added video to youtube playlist: https://www.youtube.com/playlist?list=${PLAYLIST_ID}`);
  })
  bot.launch();
}

(async () => {
    youtube = google.youtube({
      version: 'v3',
      auth: await sampleClient({ refresh_token: REFRESH_TOKEN, scopes: ['https://www.googleapis.com/auth/youtube'] }),
    })
})().then(initBot);