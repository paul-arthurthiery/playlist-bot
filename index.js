require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? './.env' : './.env.test' });
const Telegraf = require('telegraf');
const { google } = require('googleapis');
const sampleClient = require('./oauthclient');
const express = require('express');


const app = express();
app.get('/', (req, res) => res.send('Hello World!'));

const port = process.env.PORT || 3000;

const youtubeUrlRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)(\S*)/
const getVideoId = (text) => {
  const youtubeUrlSection = text.match(youtubeUrlRegex)[0];
  const url = new URL(`https://${youtubeUrlSection}`);
  return url.searchParams.get('v') || url.pathname.slice(1);
}
const { REFRESH_TOKEN, BOT_TOKEN, PLAYLIST_ID, REDIRECT_URI, CLIENT_ID, CLIENT_SECRET } = process.env;

const bot = new Telegraf(BOT_TOKEN)
// initialize the Youtube API library
let youtube;


const addVideoToPlaylist = async (videoId) => {
  const insertPayload = {
    part: 'snippet',
    resource: {
      snippet: {
        playlistId: PLAYLIST_ID,
        position: 0,
        resourceId: {
          kind: 'youtube#video',
          videoId,
        }
      }
    }
  }
  return youtube.playlistItems.insert(insertPayload);
}

const initBot = () => {
  const botResponseVideo = async (ctx, isGroup) => {
    const videoId = getVideoId(ctx.message?.text);
    await addVideoToPlaylist(videoId);
    return ctx.reply(`${isGroup ? `@${ctx.message.from.username} ` : ''}Added video https://www.youtube.com/watch?v=${videoId} to youtube playlist: https://www.youtube.com/playlist?list=${PLAYLIST_ID}`);
  };
  bot.start((ctx) => ctx.reply('No, you start'));
  bot.command('content', (ctx) => botResponseVideo(ctx, true));
  bot.hears(getVideoId, (ctx) => botResponseVideo(ctx, false));
  bot.telegram.getMe().then((botInfo) => {
    bot.options.username = botInfo.username;
  });
  app.listen(port, () => console.log(`Bot running on port ${port}!`));
  bot.launch();
}

(async () => {
    youtube = google.youtube({
      version: 'v3',
      auth: await sampleClient({ refreshToken: REFRESH_TOKEN, scopes: ['https://www.googleapis.com/auth/youtube'], redirectUri: REDIRECT_URI, clientId: CLIENT_ID, clientSecret: CLIENT_SECRET }),
    })
})().then(initBot);