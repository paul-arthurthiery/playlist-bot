const { google } = require('googleapis');
const url = require('url');
const fs = require('fs');
const path = require('path');
const http = require('http');
const opn = require('open');
const destroyer = require('server-destroy');
const util = require('util');

const keyPath = path.join(__dirname, 'oauth2.keys.json');
let keys = {
  redirect_uris: ['http://localhost:3000/oauth2callback'],
};
if (fs.existsSync(keyPath)) {
  const keyFile = require(keyPath);
  keys = keyFile.web;
}

const sampleClient = async ({refresh_token, scopes}) => {
    // validate the redirectUri.  This is a frequent cause of confusion.
    if (!keys.redirect_uris || keys.redirect_uris.length === 0) {
      throw new Error('invalid redirect uri');
    }
    const redirectUri = keys.redirect_uris[keys.redirect_uris.length - 1];
    const parts = new url.URL(redirectUri);
    if (
      redirectUri.length === 0 ||
      parts.port !== '3000' ||
      parts.hostname !== 'localhost' ||
      parts.pathname !== '/oauth2callback'
    ) {
      throw new Error('invalid redirect uri');
    }

    // create an oAuth client to authorize the API call
    const oAuth2Client = new google.auth.OAuth2(
      keys.client_id,
      keys.client_secret,
      redirectUri
    );
    
    if(!refresh_token){
      if(!scopes){throw new Error('scopes are need on first run')}
      const generatedRefreshToken = await loadRefreshToken(oAuth2Client, scopes);
      throw new Error(`Add this to your .env: 
      REFRESH_TOKEN=${util.inspect(generatedRefreshToken.refresh_token)}`)
    }

    oAuth2Client.setCredentials({
      refresh_token
    })
    return oAuth2Client;
}

const loadRefreshToken = async (oAuth2Client, scopes) => new Promise((resolve, reject) => {
    // grab the url that will be used for authorization
    const authorizeUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes.join(' '),
    });
    const server = http
      .createServer(async (req, res) => {
        try {
          if (req.url.indexOf('/oauth2callback') > -1) {
            const qs = new url.URL(req.url, 'http://localhost:3000')
            .searchParams;
              res.end(
              'Authentication successful! Please return to the console.'
            );
            server.destroy();
            const { tokens } = await oAuth2Client.getToken(qs.get('code'));
            resolve(tokens)
          }
        } catch (e) {
          reject(e);
        }
      })
      .listen(3000, () => {
        // open the browser to the authorize url to start the workflow
        opn(authorizeUrl, { wait: false }).then(cp => cp.unref());
      });
    destroyer(server);
});
module.exports = sampleClient;
