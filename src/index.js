const CopilotServer = require('./server');

// サーバーの設定
const config = {
    port: process.env.PORT || 3000
};

// サーバーの起動
const server = new CopilotServer(config);
server.start();
