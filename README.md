### Hosted Page API

#### This project will contain all necessary APIs required for Hosted Page.

## How to work

# For Localhost environment.

- Copy content `.env.develop.example` to `.env` or copy and replace name of `.env.develop.example` to `.env`: `cp .env.develop.example .env`

- Change env value follow your environment like database information.

- Install dependency packages: `yarn`

- Start server: `yarn start:dev`

# For Development/production environment.

- Pull code from Github to develop server

- Copy content `.env.develop.example` to `.env` or copy and replace name of `.env.develop.example` to `.env`: `cp .env.develop.example .env`

- Change env value follow developement enviroment

- Install dependency packages: `yarn`

- Build code: `yarn build`

- Install pm2 if it's not existed on server (Optional): `npm install -g pm2`

- Start server: `pm2 start dist/main.js --name main`

- Restart server after re-build: `pm2 restart main` or `pm2 restart {id}`

## License

Nest is [MIT licensed](LICENSE).
