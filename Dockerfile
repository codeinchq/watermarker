####################################################################################################
# WATERMARKER
####################################################################################################
FROM --platform=$TARGETPLATFORM node:lts-slim AS watermarker

ENV PORT=3000
ENV NODE_ENV=production
WORKDIR /app


####################################################################################################
# WATERMARKER dev
####################################################################################################
FROM watermarker AS watermarker-dev

ENV NODE_ENV=development
RUN npm install --global nodemon

EXPOSE $PORT
ENTRYPOINT ["nodemon", "main.mjs"]


####################################################################################################
# WATERMARKER prod
####################################################################################################
FROM watermarker AS watermarker-prod

COPY main.mjs /app/
COPY package.json /app/
COPY package-lock.json /app/
RUN mkdir -p /app/temp
RUN npm install --omit=dev

EXPOSE $PORT
ENTRYPOINT ["node", "main.mjs"]