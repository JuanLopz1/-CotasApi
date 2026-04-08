import { useState } from "react";

function BrandLogo({ className, alt }) {
  const [useFallback, setUseFallback] = useState(false);

  if (useFallback) {
    return (
      <div className={`${className} brand-logo-fallback`} aria-label={alt} title={alt}>
        +c
      </div>
    );
  }

  return (
    <img
      className={className}
      src="/img/logo.png"
      alt={alt}
      onError={() => setUseFallback(true)}
      loading="eager"
    />
  );
}

export default BrandLogo;
