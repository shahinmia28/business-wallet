import { useEffect, useState } from 'react';
import { initDB } from '../database/db';

export const useSQLite = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await initDB();
      setReady(true);
    })();
  }, []);

  return ready;
};
