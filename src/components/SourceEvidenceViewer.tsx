import Tabs from '@cloudscape-design/components/tabs';
import Alert from '@cloudscape-design/components/alert';
import Box from '@cloudscape-design/components/box';
import type { RawEvidence } from '../types';

interface Props { evidence: RawEvidence; }

export default function SourceEvidenceViewer({ evidence }: Props) {
  return (
    <div>
      <Alert type="warning" statusIconAriaLabel="Warning">
        Raw evidence is immutable. Apply corrections to normalized records only.
      </Alert>
      <div style={{ marginTop: 12 }}>
        <Tabs
          tabs={[
            {
              id: 'text',
              label: 'Extracted Text',
              content: (
                <Box padding="s">
                  <pre style={{ fontFamily: 'Courier New, monospace', fontSize: 13, whiteSpace: 'pre-wrap', background: 'var(--code-bg)', color: 'var(--code-text)', border: '1px solid var(--code-border)', borderRadius: 4, padding: 12 }}>
                    {evidence.extractedText || '(no extracted text)'}
                  </pre>
                </Box>
              ),
            },
            {
              id: 'html',
              label: 'HTML',
              content: (
                <Box padding="s">
                  <pre style={{ fontFamily: 'Courier New, monospace', fontSize: 12, whiteSpace: 'pre-wrap', background: 'var(--code-bg)', color: 'var(--code-text)', border: '1px solid var(--code-border)', borderRadius: 4, padding: 12, maxHeight: 300, overflow: 'auto' }}>
                    {evidence.rawHtml || '(not available for this source type)'}
                  </pre>
                </Box>
              ),
            },
            {
              id: 'json',
              label: 'JSON/API',
              content: (
                <Box padding="s">
                  <pre style={{ fontFamily: 'Courier New, monospace', fontSize: 12, whiteSpace: 'pre-wrap', background: 'var(--code-bg)', color: 'var(--code-text)', border: '1px solid var(--code-border)', borderRadius: 4, padding: 12, maxHeight: 300, overflow: 'auto' }}>
                    {evidence.rawJson
                      ? JSON.stringify(JSON.parse(evidence.rawJson), null, 2)
                      : '(not available for this source type)'}
                  </pre>
                </Box>
              ),
            },
            {
              id: 'pdf',
              label: 'PDF Text',
              content: (
                <Box padding="s">
                  <pre style={{ fontFamily: 'Courier New, monospace', fontSize: 13, whiteSpace: 'pre-wrap', background: 'var(--code-bg)', color: 'var(--code-text)', border: '1px solid var(--code-border)', borderRadius: 4, padding: 12 }}>
                    {evidence.pdfText || '(no PDF text for this record)'}
                  </pre>
                </Box>
              ),
            },
            {
              id: 'meta',
              label: 'Source Metadata',
              content: (
                <Box padding="s">
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <tbody>
                      {[
                        ['Raw ID', evidence.id],
                        ['Bank', evidence.bank],
                        ['Source Type', evidence.sourceType],
                        ['Source URL', evidence.sourceUrl],
                        ['Retrieved At', new Date(evidence.retrievedAt).toLocaleString()],
                        ['Page Title', evidence.pageTitle],
                        ['Parser Status', evidence.parserStatus],
                        ['Linked Offer', evidence.linkedOfferId ?? '—'],
                        ['Run ID', evidence.runId],
                        ['Checksum', evidence.checksum],
                      ].map(([k, v]) => (
                        <tr key={k} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '8px 10px', color: 'var(--text-secondary)', fontWeight: 600, width: '35%' }}>{k}</td>
                          <td style={{ padding: '8px 10px', color: 'var(--text-primary)', wordBreak: 'break-all' }}>{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
