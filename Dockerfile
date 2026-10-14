FROM node:18-alpine

WORKDIR /app

# This project is plain HTML/CSS/JS with no package manifest, lockfile,
# dependencies, or production build step.
COPY server.js ./server.js
COPY outputs/dima-site/index.html outputs/dima-site/app.js outputs/dima-site/styles.css ./public/

EXPOSE 10000

CMD ["node", "server.js"]
