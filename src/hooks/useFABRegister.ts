import { useEffect } from 'react';
import { useFAB } from '../context/FABContext';

export function useFABRegister(onPress: (() => void) | null, label: string) {
  const { setFAB } = useFAB();
  useEffect(() => {
    if (onPress) {
      setFAB({ onPress, label });
    } else {
      setFAB(null);
    }
    return () => setFAB(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onPress === null]);
}
