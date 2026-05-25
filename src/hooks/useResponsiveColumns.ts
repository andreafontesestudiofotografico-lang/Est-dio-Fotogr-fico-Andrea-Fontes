import { useState, useEffect, useCallback } from "react";

export function useResponsiveColumns(defaultColumns = 3) {
  const [columns, setColumns] = useState(defaultColumns);

  const calculateColumns = useCallback(() => {
    const width = window.innerWidth;
    if (width < 640) setColumns(2); // sm
    else if (width < 1024) setColumns(3); // lg
    else if (width < 1280) setColumns(4); // xl
    else setColumns(5); // 2xl
  }, []);

  useEffect(() => {
    calculateColumns();
    window.addEventListener("resize", calculateColumns);
    return () => window.removeEventListener("resize", calculateColumns);
  }, [calculateColumns]);

  return columns;
}
