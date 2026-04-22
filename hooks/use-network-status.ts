import { useEffect, useState } from 'react';

const LOCAL_IP = 'http://192.168.10.85:3000';

export function useNetworkStatus() {
  const [isLocalConnected, setIsLocalConnected] = useState<boolean>(false);
  const [networkType, setNetworkType] = useState<string>('Checking');

  useEffect(() => {
    let mounted = true;

    const checkNetwork = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const localResponse = await fetch(LOCAL_IP, { 
          method: 'GET',
          signal: controller.signal 
        });
        clearTimeout(timeoutId);
        
        if (mounted) {
          const localOk = localResponse.ok || localResponse.status === 401 || localResponse.status === 403;
          setIsLocalConnected(localOk);
          setNetworkType(localOk ? 'Connected' : 'Disconnected');
        }
      } catch (e) {
        if (mounted) {
          setIsLocalConnected(false);
          setNetworkType('Disconnected');
        }
      }
    };

    checkNetwork();
    const interval = setInterval(checkNetwork, 15000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { isConnected: isLocalConnected, isLocalConnected, isInternetConnected: false, networkType };
}