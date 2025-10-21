# Werewolf Game API

Node.js backend served at **https://game.impious.io**

## 🔧 Run Locally

Build and run the API container:

```bash
docker build -t werewolf-game:dev ./game-api
docker run -p 3000:3000 -e NODE_ENV=production werewolf-game:dev
