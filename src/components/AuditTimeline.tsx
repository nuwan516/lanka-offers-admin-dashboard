import type { AuditEvent } from '../types';

interface Props { events: AuditEvent[]; }

export default function AuditTimeline({ events }: Props) {
  if (!events.length) return <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>No audit events recorded.</p>;
  return (
    <div className="audit-timeline">
      {events.map(ev => (
        <div key={ev.id} className="audit-event">
          <div className="audit-event-time">{new Date(ev.timestamp).toLocaleString()}</div>
          <div className="audit-event-desc">{ev.description}</div>
          <div className="audit-event-actor">by {ev.actor}</div>
          {ev.changes && (
            <div className="audit-event-changes">
              {Object.entries(ev.changes).map(([field, { from, to }]) => (
                <div key={field}>
                  <strong>{field}:</strong>{' '}
                  <span className="diff-old">{from}</span>
                  <span style={{ color: 'var(--text-secondary)', margin: '0 6px' }}>to</span>
                  <span className="diff-new">{to}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
