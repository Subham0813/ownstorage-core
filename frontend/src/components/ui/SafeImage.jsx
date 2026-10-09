import { useEffect, useState } from "react";

function SafeImage({ src, alt = "", fallback = null, className, ...rest }) {
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
  }, [src]);

  if (!src || errored) return fallback;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
      {...rest}
    />
  );
}

export default SafeImage;