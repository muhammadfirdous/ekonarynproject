import 'dotenv/config';
import app from './app';
import { assertProductionEnv } from './utils/startup';

assertProductionEnv();

const PORT = process.env.API_PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Eko Naryn API running on port ${PORT}`);
});
