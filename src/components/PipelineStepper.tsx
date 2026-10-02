import StatusIndicator from '@cloudscape-design/components/status-indicator';

export interface PipelineStage {
  name: string;
  status: 'success' | 'warning' | 'error' | 'pending' | 'running';
  duration?: string;
  itemCount?: number;
  errorCount?: number;
}

interface Props { stages: PipelineStage[]; }

function getStatusIndicator(status: PipelineStage['status']) {
  switch (status) {
    case 'success':
      return <StatusIndicator type="success" />;
    case 'warning':
      return <StatusIndicator type="warning" />;
    case 'error':
      return <StatusIndicator type="error" />;
    case 'running':
      return <StatusIndicator type="in-progress" />;
    case 'pending':
    default:
      return <StatusIndicator type="stopped" />;
  }
}

export default function PipelineStepper({ stages }: Props) {
  return (
    <div className="pipeline-stepper">
      {stages.map((s, idx) => (
        <div key={s.name} className="pipeline-step">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#565959' }}>{idx + 1}.</span>
            {getStatusIndicator(s.status)}
          </div>
          <div className="pipeline-step-name" style={{ fontWeight: 600 }}>{s.name}</div>
          {s.duration && <div className="pipeline-step-meta">{s.duration}</div>}
          {s.itemCount !== undefined && <div className="pipeline-step-meta">{s.itemCount} items</div>}
          {!!s.errorCount && <div className="pipeline-step-meta" style={{ color: '#CC0C39', fontWeight: 600 }}>{s.errorCount} errors</div>}
        </div>
      ))}
    </div>
  );
}
