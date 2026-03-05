import 'dotenv/config';
import app from './app';

const PORT = process.env.API_PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Eko Naryn API running on port ${PORT}`);
});
