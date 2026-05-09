import 'dotenv/config';
import app from './app';
import { assertProductionEnv } from './utils/startup';

assertProductionEnv();

// Railway (and most PaaSes) inject PORT at runtime; fall back to API_PORT
// for local + Docker Compose deploys, then to 4000 as the dev default.
const PORT = process.env.PORT || process.env.API_PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Eko Naryn API running on port ${PORT}`);
});
