'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function MovieHeroImage({ src, alt, fallback, className, width, height, eager = false }: {
  src: string | null;
  alt: string;
  fallback: string;
  className: string;
  width: number;
  height: number;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <span className={`${className} movie-image-fallback`} role="img" aria-label={`${alt} unavailable`}>{fallback}</span>;
  }

  return <Image className={className} src={src} alt={alt} width={width} height={height} loading={eager ? 'eager' : 'lazy'} onError={() => setFailed(true)} />;
}
