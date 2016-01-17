
var oauth = {};
var token;

var gitOAuth = require('simple-oauth2')({
  clientID: process.env.GITHUBID,
  clientSecret: process.env.GITHUBSECRET,
  site: 'https://github.com/login',
  tokenPath: '/oauth/access_token',
  authorizationPath: '/oauth/authorize',
  revocationPath: '/oauth2/revoke'
});

// Authorization uri definition
var gitAuthorizationUri = gitOAuth.authCode.authorizeURL({
  redirect_uri: 'http://localhost:3000/loginsuccess/',
  // redirect_uri: 'http://sigmatic.io/loginsuccess/',
  scope: 'repo',
  state: '$%`^6~auyPi78%#jTsoiBDg$^'
});

oauth.login = function (req, res) {
  res.send('Hello<br><a href="/githubauth">Log in with Github</a>');
};

// Initial page redirecting to Github
oauth.githubauth = function (req, res) {
  console.log('redirecting to github');
    res.redirect(gitAuthorizationUri);
};

// Callback service parsing the authorization token and asking for the access token
oauth.loginsuccess = function (req, res) {
  var code = req.query.code;
  console.log('Received auth code from github:', code);
  var getToken = gitOAuth.authCode.getToken({
    code: code,
    redirect_uri: 'http://localhost:3000/loginsuccess/'
    // redirect_uri: 'http://sigmatic.io/loginsuccess/'
  // }, makeToken);
  })
  .then(function(result) {
    token = gitOAuth.accessToken.create(result);
    console.log("Toten",token);
    res.send('All logged in!');
  })
  .catch(function(error) {
    console.error("Token retrieval failed", error);
  });
};

oauth.logout = function(req, res) {
  if(token === undefined) {
    return res.json({message: "You were not logged in."})
  }

  token.revoke('access_token')
    .then(function revokeRefresh() {
      // Revoke the refresh token
      return token.revoke('refresh_token');
    })
    .then(function tokenRevoked() {
      console.log('Token revoked');
      return res.json({message: 'All logged out.'})
    })
    .catch(function logError(error) {
      console.log('Error revoking token.', error.message);
      return res.json({message: 'Error revoking token.'})
    });
}

oauth.check = function(req, res) {
  return res.json({
    token: token,
    // expired: token.expired()
  });
}

module.exports = oauth;