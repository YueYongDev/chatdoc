import { useEffect, useState } from 'react';
import eventEmitter from './eventEmitter';

export default function userIdKey() {
  const [userId, setUserId] = useState(null);

  const getUserId = () => {
    const userId = JSON.parse(localStorage.getItem('settings') as string)?.userId || null;
    setUserId(userId);
  };

  useEffect(() => {
    getUserId();

    eventEmitter.on('refreshSettings', getUserId);
    return () => {
      eventEmitter.off('refreshSettings', getUserId);
    };
  }, []);

  return userId;
}
