interface Props {
  label: string;
  value: number; // 0–1
  showValue?: boolean;
}

export default function ConfidenceBar({ label, value, showValue = true }: Props) {
  const pct = Math.round(value * 100);
  const cls = value >= 0.85 ? 'high' : value >= 0.6 ? 'medium' : 'low';
  const color = value >= 0.85 ? '#007600' : value >= 0.6 ? '#FF9900' : '#CC0C39';

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 13 }}>
        <span style={{ color: '#0F1111' }}>{label}</span>
        {showValue && <span style={{ color, fontWeight: 600 }}>{value.toFixed(2)}</span>}
      </div>
      <div className="confidence-bar-track">
        <div className={`confidence-bar-fill ${cls}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
