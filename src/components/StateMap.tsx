import { useState } from 'react'

// Approximate state centroid positions on a 700×440 viewBox
const STATE_POS: Record<string, [number, number]> = {
  WA:  [75,  48], OR:  [68,  90], CA:  [58, 178],
  AK:  [52, 370], HI: [130, 395],
  NV:  [98, 150], ID: [122,  88], MT: [175,  55],
  WY: [178, 105], UT: [138, 145], AZ: [145, 205],
  CO: [198, 148], NM: [185, 205],
  ND: [268,  55], SD: [265,  95], NE: [272, 135],
  KS: [278, 175], OK: [280, 218], TX: [275, 275],
  MN: [325,  55], IA: [340, 120], MO: [345, 165],
  AR: [348, 215], LA: [352, 268],
  WI: [378,  80], IL: [383, 130], MS: [385, 238],
  MI: [418,  78], IN: [415, 135], AL: [410, 230],
  TN: [418, 182], KY: [430, 158], OH: [448, 128],
  GA: [448, 225], FL: [462, 290], SC: [475, 205],
  NC: [482, 182], WV: [465, 150], VA: [490, 160],
  MD: [518, 152], DE: [528, 145], PA: [510, 125],
  NJ: [535, 135], NY: [540, 105], CT: [558, 118],
  RI: [568, 114], MA: [572, 106], VT: [558,  86],
  NH: [572,  82], ME: [588,  64],
}

interface Props {
  data: Record<string, number>   // state abbr -> value
  title: string
  valueLabel: string
  formatValue?: (v: number) => string
}

export function StateMap({ data, title, valueLabel, formatValue = String }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)

  const values = Object.values(data)
  const maxVal = values.length ? Math.max(...values) : 1

  function getBubbleRadius(val: number) {
    return 5 + 22 * Math.sqrt(val / maxVal)
  }

  function getBubbleColor(val: number) {
    const t = val / maxVal
    // interpolate: low = #F9A8D4 (pink-300), high = #7E22CE (purple-800)
    const r = Math.round(249 + (126 - 249) * t)
    const g = Math.round(168 + ( 34 - 168) * t)
    const b = Math.round(212 + (206 - 212) * t)
    return `rgb(${r},${g},${b})`
  }

  const hoveredVal = hovered ? data[hovered] : null

  return (
    <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
      <h3>{title}</h3>
      <p className="chart-sub">Bubble size = {valueLabel.toLowerCase()}</p>
      <div style={{ position: 'relative' }}>
        <svg
          viewBox="0 0 700 440"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          {/* Background */}
          <rect width="700" height="440" fill="#FDF5FB" rx="8" />

          {/* State bubbles */}
          {Object.entries(STATE_POS).map(([abbr, [x, y]]) => {
            const val = data[abbr] ?? 0
            const r = val > 0 ? getBubbleRadius(val) : 4
            const fill = val > 0 ? getBubbleColor(val) : '#F3E8FF'
            const stroke = hovered === abbr ? '#DB2777' : 'white'
            return (
              <g key={abbr} style={{ cursor: val > 0 ? 'pointer' : 'default' }}>
                <circle
                  cx={x} cy={y} r={r}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={hovered === abbr ? 2 : 1}
                  opacity={hovered && hovered !== abbr ? 0.55 : 1}
                  onMouseEnter={() => val > 0 && setHovered(abbr)}
                  onMouseLeave={() => setHovered(null)}
                />
                {r > 11 && (
                  <text
                    x={x} y={y + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="8"
                    fontWeight="600"
                    fill={val / maxVal > 0.5 ? 'white' : '#6B21A8'}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {abbr}
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        {/* Tooltip */}
        {hovered && hoveredVal != null && (
          <div style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            background: 'white',
            border: '1px solid #F9A8D4',
            borderRadius: 10,
            padding: '10px 16px',
            boxShadow: '0 4px 16px rgba(219,39,119,0.12)',
            pointerEvents: 'none',
          }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{hovered}</div>
            <div style={{ fontSize: 13, color: '#DB2777', fontWeight: 600 }}>
              {formatValue(hoveredVal)} {valueLabel.toLowerCase()}
            </div>
          </div>
        )}

        {/* Legend */}
        <div style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'white',
          border: '1px solid #F9A8D4',
          borderRadius: 8,
          padding: '6px 12px',
          fontSize: 11,
          color: '#6B7280',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F9A8D4', display: 'inline-block' }} />
          Low
          <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#7E22CE', display: 'inline-block', marginLeft: 6 }} />
          High
        </div>
      </div>
    </div>
  )
}
