import './Loader.styles.css';
import React from 'react';

/** Shared loading UI: inline by default, wrapped content, or an explicit fullscreen overlay. */
const Loader = ({
  loading = true,
  fullscreen = false,
  size = fullscreen ? 'large' : 'default',
  tip,
  children,
  className = '',
  wrapperClassName = '',
  ...props
}) => {
  const hasContent = children != null;
  if (!loading && !hasContent) return null;

  const indicator = (
    <span
      {...props}
      className={`cm-loader cm-loader--${size} ${className}`}
      role="status"
      aria-live="polite"
    >
      <span className="cm-loader__ring" aria-hidden="true" />
      <span className={tip ? 'cm-loader__tip' : 'cm-loader__sr-only'}>{tip || 'Loading…'}</span>
    </span>
  );

  if (hasContent) {
    return (
      <div
        className={`cm-loader-region ${loading ? 'cm-loader-region--loading' : ''} ${wrapperClassName}`}
        aria-busy={loading}
      >
        <div className="cm-loader-region__content" inert={loading ? true : undefined}>
          {children}
        </div>
        {loading && (
          <div className={fullscreen ? 'cm-loader-fullscreen' : 'cm-loader-region__cover'}>
            {indicator}
          </div>
        )}
      </div>
    );
  }

  if (!fullscreen) return indicator;

  return (
    <div className="cm-loader-fullscreen" id="global-loader">
      {indicator}
    </div>
  );
};

export default Loader;
