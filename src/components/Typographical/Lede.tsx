import React from 'react';

export const Lede = function ModalHeading({ children }: { children: React.ReactNode }) {
  return <p className="font-serif tracking-widest leading-relaxed max-w-3xl">{children}</p>;
};
