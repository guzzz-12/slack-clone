import { RefObject, useEffect, useState } from "react";

/** Custom hook para observar la intersección de un elemento con el viewport */
const useIntersectionObserver = (ref: RefObject<HTMLElement>) => {
  const [isIntersecting, setIsIntersecting] = useState(false);

  const observer = new IntersectionObserver(([entry]) => {
    setIsIntersecting(entry.isIntersecting);
  });

  useEffect(() => {
    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref, observer]);

  return {
    isIntersecting,
  };
}

export default useIntersectionObserver