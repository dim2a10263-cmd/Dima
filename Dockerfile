FROM node:18-alpine

WORKDIR /app

# This project is plain HTML/CSS/JS with no package manifest, lockfile,
# dependencies, or production build step.
COPY server.js ./server.js
COPY index.html app.js styles.css ./public/

EXPOSE 10000

CMD ["node", "server.js"]
