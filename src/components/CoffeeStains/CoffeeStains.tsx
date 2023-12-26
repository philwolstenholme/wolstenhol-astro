import React from 'react';

export const CoffeeStains = function CoffeeStains({ children }: { children: React.ReactNode }) {
  return (
    <>
      <img
        hidden
        data-frivolous-grunge
        className="absolute inline opacity-40 mix-blend-multiply"
        loading="eager"
        alt=""
        width="500"
        height="451"
        src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        srcSet="
        https://wolstenhol.me/proxy/cloudinary/image/upload/c_scale,q_10,w_500,fl_progressive/v1614122419/one-offs/cup-coffee-stain-2.jpg  1x,
        https://wolstenhol.me/proxy/cloudinary/image/upload/c_scale,q_10,w_1000,fl_progressive/v1614122419/one-offs/cup-coffee-stain-2.jpg 2x
      "
        style={{ left: '-230px', top: '600px' }}
      />
      <img
        hidden
        data-frivolous-grunge
        className="absolute mix-blend-multiply inline opacity-40 transform object-cover object-left"
        loading="lazy"
        decoding="async"
        alt=""
        width="112"
        height="405"
        src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        srcSet="
        https://wolstenhol.me/proxy/cloudinary/image/upload/c_scale,q_10,w_500,fl_progressive/v1614122419/one-offs/cup-coffee-stain-2.jpg  1x,
        https://wolstenhol.me/proxy/cloudinary/image/upload/c_scale,q_10,w_1000,fl_progressive/v1614122419/one-offs/cup-coffee-stain-2.jpg 2x
      "
        style={{ right: 0, top: '1900px', height: '405px', width: '9%' }}
      />
      <img
        hidden
        data-frivolous-grunge
        className="absolute inline opacity-40 mix-blend-multiply transform -rotate-45"
        loading="lazy"
        decoding="async"
        alt=""
        width="500"
        height="451"
        src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        srcSet="
        https://wolstenhol.me/proxy/cloudinary/image/upload/c_scale,q_10,w_500,fl_progressive/v1614122419/one-offs/cup-coffee-stain-2.jpg  1x,
        https://wolstenhol.me/proxy/cloudinary/image/upload/c_scale,q_10,w_1000,fl_progressive/v1614122419/one-offs/cup-coffee-stain-2.jpg 2x
      "
        style={{ left: '-230px', top: '2900px' }}
      />
      <div className="isolate">{children}</div>
    </>
  );
};
