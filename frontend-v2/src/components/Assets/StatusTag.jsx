import React from 'react';

/**
 * Two-state status indicator. Color carries the primary signal; the pulse
 * on "online" is the module's one deliberate motion moment, not decoration
 * repeated elsewhere.
 */
export default function StatusTag({ status }) {
  const isOnline = status === 'online';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 13 }}>
      <span className={`dm-status-dot dm-status-dot--${isOnline ? 'online' : 'offline'}`} />
      {isOnline ? 'Online' : 'Offline'}
    </span>
  );
}
