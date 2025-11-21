const Parse = require('parse/node');

function initParse() {
  const { PARSE_APP_ID, PARSE_JS_KEY, PARSE_SERVER_URL, PARSE_MASTER_KEY } = process.env;
  if (!PARSE_APP_ID || !PARSE_JS_KEY || !PARSE_SERVER_URL) {
    console.warn(
      'Parse não foi inicializado: defina PARSE_APP_ID, PARSE_JS_KEY e PARSE_SERVER_URL no .env.'
    );
    return;
  }
  Parse.initialize(PARSE_APP_ID, PARSE_JS_KEY);
  Parse.serverURL = PARSE_SERVER_URL;
  if (PARSE_MASTER_KEY) {
    Parse.masterKey = PARSE_MASTER_KEY;
  }
  // Necessário no ambiente Node para permitir uso de sessão no mesmo processo.
  Parse.User.enableUnsafeCurrentUser();
}

module.exports = { initParse };
