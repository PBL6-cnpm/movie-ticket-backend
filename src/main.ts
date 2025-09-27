import { createApp } from './app';

async function main() {
  let app = await createApp();
  app = await app.init();
  await app.listen(process.env.SERVER_PORT, '0.0.0.0');
}

main().catch((err) => {
  console.error('Error starting the application:', err);
});
