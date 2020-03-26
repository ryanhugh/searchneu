/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 *
 * Little hook just to keep state on whether you're at the top of the screen
 */

import { useState, useEffect } from 'react';

export default function useAtTop(): boolean {
  const [atTop, setAtTop] = useState(true);
  useEffect(() => {
    const handleScroll = () => {
      const pageY = document.body.scrollTop || document.documentElement.scrollTop;
      setAtTop(pageY === 0);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  return atTop;
}
