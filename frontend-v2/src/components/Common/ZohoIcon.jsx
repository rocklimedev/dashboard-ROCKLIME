export default function ZohoIcon({ style }) {
  return (
    <svg role="img" aria-label="Zoho" viewBox="0 0 120 38" width="88" height="30" style={style}>
      {[
        ['Z', '#E42527'],
        ['O', '#089949'],
        ['H', '#226DB4'],
        ['O', '#F9B21D'],
      ].map(([letter, color], index) => (
        <g key={index} transform={`translate(${index * 30 + 2},4)`}>
          <rect width="26" height="29" rx="2" fill="white" stroke={color} strokeWidth="2.5" />
          <text
            x="13"
            y="22"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
            fontWeight="bold"
            fontSize="22"
            fill={color}
          >
            {letter}
          </text>
        </g>
      ))}
    </svg>
  );
}
