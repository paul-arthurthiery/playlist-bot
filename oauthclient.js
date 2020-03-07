const { google } = require('googleapis');
const protocol = process.env.NODE_ENV === 'production' ? require('https') : require('http')
const opn = require('open');
const destroyer = require('server-destroy');
const util = require('util');

const port = process.env.PORT || 3000;

const sampleClient = async ({ refreshToken, scopes, redirectUri, clientId, clientSecret }) => {
    // validate the redirectUri.  This is a frequent cause of confusion.
  if (!redirectUri) {
      throw new Error('invalid redirect uri');
    }
    // create an oAuth client to authorize the API call
    const oAuth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
    
    if(!refreshToken){
      if(!scopes){throw new Error('scopes are need on first run')}
      const generatedRefreshToken = await loadRefreshToken(oAuth2Client, scopes, redirectUri);
      throw new Error(`Add this to your .env: 
      REFRESH_TOKEN=${util.inspect(generatedRefreshToken.refresh_token)}`)
    }

    oAuth2Client.setCredentials({
      refresh_token: refreshToken
    })
    return oAuth2Client;
}

const loadRefreshToken = async (oAuth2Client, scopes, redirectUri) => new Promise((resolve, reject) => {
  const redirectUriObj = new URL(redirectUri);
    // grab the url that will be used for authorization
    const authorizeUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes.join(' '),
    });
    const server = protocol
      .createServer(async (req, res) => {
        try {
          if (req.url.includes(redirectUriObj.pathname)) {
            const tokenCode = new URL(req.url, redirectUriObj.href)
            .searchParams.get('code');
              res.end(
              'Authentication successful! Please return to the console.'
            );
            server.destroy();
            const { tokens } = await oAuth2Client.getToken(tokenCode);
            resolve(tokens)
          }
        } catch (e) {
          reject(e);
        }
      })
      .listen(port, () => {
          // open the browser to the authorize url to start the workflow
        opn(authorizeUrl, { wait: false }).then(cp => cp.unref());
      });
    destroyer(server);
});
module.exports = sampleClient;
