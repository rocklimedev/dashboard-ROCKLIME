/**
 * Design intent: this module is a fleet-monitoring console, not a form-heavy
 * back-office screen — closer in spirit to a NOC dashboard than a SaaS
 * settings page. Device IDs, secrets, and timestamps are literal machine
 * identifiers, so they're set in monospace throughout (functional, not
 * decorative). Status uses a fixed two-state vocabulary (online / offline)
 * with color as the primary signal, reinforced by a subtle pulse on "online"
 * — the one deliberate motion moment in the module.
 *
 * Merge this into your app's <ConfigProvider theme={...}> — either replace
 * your global theme with it, or spread it alongside your existing tokens if
 * this module is scoped to a sub-tree:
 *
 *   <ConfigProvider theme={{ token: { ...yourTokens, ...dmTheme.token } }}>
 */

export const dmTheme = {
  token: {
    colorPrimary: '#0E9F8E', // teal — signal/instrumentation accent, not AntD's default blue
    colorInfo: '#0E9F8E',
    colorSuccess: '#3DDC84', // "online" green
    colorWarning: '#F5A623', // "offline" / attention amber
    colorError: '#E5484D',
    colorBgLayout: '#12161A', // control-room dark
    colorBgContainer: '#181D22',
    colorBgElevated: '#1E242A',
    colorBorder: '#262C33',
    colorBorderSecondary: '#1F252B',
    colorText: '#E6EAED',
    colorTextSecondary: '#8B95A1',
    colorTextTertiary: '#5B6570',
    borderRadius: 6,
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  components: {
    Table: {
      headerBg: '#181D22',
      headerColor: '#8B95A1',
      rowHoverBg: '#1E242A',
    },
    Tag: {
      defaultBg: '#1E242A',
    },
  },
};

export const monoFontFamily =
  "'IBM Plex Mono', 'JetBrains Mono', SFMono-Regular, Menlo, Consolas, monospace";
