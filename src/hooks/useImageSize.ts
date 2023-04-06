import { useState } from "react";

const getImgSize = (url: string, cb: CallableFunction) => {
  const img = new Image();
  img.onload = () => cb(img);
  img.src = url;
};

export const useImageSize = (src: string | null) => {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  src &&
    getImgSize(src, (img: HTMLImageElement) => {
      setSize({
        w: img.naturalWidth,
        h: img.naturalHeight,
      });
    });

  return { size };
};
