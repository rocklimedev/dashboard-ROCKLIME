Styling in frontend-V2
=====================

`src/index.css` is the shared CSS entry point. Its imports preserve the original
cascade order: legacy libraries, shared tokens, then application styles grouped
by area. Keep that import order when making changes.

- `tokens.css` holds the exact existing colors and font sizes. Values were not
  rounded or merged, so this refactor does not intentionally change the design.
- `antd-controls.css` holds the initial Ant Design input/button overrides.
- The other shared files group tables, cards, orders, chat, search, inventory,
  and dashboard rules in their original sequence. Later overrides remain later.
- `Component.styles.css`, next to each component, holds its extracted styles.
  Import it directly from that component so lazy routes load their own CSS.

The `fv2-<component>-<hash>` classes represent deduplicated inline declarations
within that component. Their `:is(#fv2-style-priority, .class)` selector uses an
unused ID as a specificity anchor to beat normal legacy class rules, without
adding `!important`. Do not assign that ID to an element. Existing important
declarations retain their original precedence. A normal stylesheet selector
cannot perfectly reproduce inline specificity against arbitrary future ID
selectors or inline defaults added by third-party components; check the affected
screen when changing either.

The empty styled-components wrappers retain component identity, ref forwarding,
and prop handling; their visual rules now live in the adjacent CSS files.
Dragging uses a state class. Embedded JSX style tags have been removed.

Remaining inline objects hold runtime values (drag transforms, dimensions,
progress, conditional colors, and similar state). Objects with JSX prop spreads
or related dynamic shorthand/longhand declarations are retained where extracting
them could change override behavior. Existing `!important` declarations and
legacy styles in `src/assets/css` are preserved to avoid changing the cascade.

Run `npm run styles:audit` for a JSON inventory with per-file inline object,
embedded CSS, styled template, font-size, hex color, and important counts. The
report separates application code, centralized tokens, and legacy asset CSS.
References such as `style={pdfStyle}` can be document export options rather than
CSS; the inline count deliberately counts JSX object expressions only.
