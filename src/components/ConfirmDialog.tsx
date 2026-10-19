import { useEffect, useState, type ReactNode } from 'react';
import Modal from '@cloudscape-design/components/modal';
import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import Checkbox from '@cloudscape-design/components/checkbox';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Alert from '@cloudscape-design/components/alert';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  /** What is about to happen, in one sentence. */
  summary: ReactNode;
  /** Concrete effects the operator should know about before confirming. */
  consequences?: string[];
  /** Shown as a warning alert above the consequences. */
  warning?: ReactNode;
  /** When set, the confirm button stays disabled until this box is ticked. */
  acknowledgement?: string;
  confirmLabel: string;
  /** "danger" is for actions that remove data from public view or cannot be undone. */
  tone?: 'primary' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}

/**
 * Confirmation for consequential operations. The consequences are spelled out
 * rather than implied, and a required acknowledgement can gate the action.
 * Nothing runs until the operator presses the confirm button.
 */
export default function ConfirmDialog({
  visible,
  title,
  summary,
  consequences = [],
  warning,
  acknowledgement,
  confirmLabel,
  tone = 'primary',
  loading = false,
  onConfirm,
  onDismiss,
}: ConfirmDialogProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  // A fresh acknowledgement is required every time the dialog opens.
  useEffect(() => {
    if (visible) setAcknowledged(false);
  }, [visible]);

  const blocked = acknowledgement !== undefined && !acknowledged;

  // A closed dialog is not rendered at all, so it adds no hidden dialog or buttons to the page.
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      header={title}
      closeAriaLabel="Close dialog"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onDismiss} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={onConfirm}
              loading={loading}
              disabled={blocked}
              data-testid="confirm-action"
              iconName={tone === 'danger' ? 'status-warning' : undefined}
            >
              {confirmLabel}
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="m">
        <Box>{summary}</Box>
        {warning && <Alert type="warning">{warning}</Alert>}
        {consequences.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {consequences.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        )}
        {acknowledgement && (
          <Checkbox checked={acknowledged} onChange={(e) => setAcknowledged(e.detail.checked)}>
            {acknowledgement}
          </Checkbox>
        )}
      </SpaceBetween>
    </Modal>
  );
}
