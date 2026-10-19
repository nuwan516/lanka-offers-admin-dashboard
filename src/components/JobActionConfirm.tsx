import ConfirmDialog from './ConfirmDialog';

export type JobAction = null | { kind: 'cancel' | 'retry'; bank: string };

interface Props {
  action: JobAction;
  busy: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}

/** Confirmation shared by the pages that can cancel or retry a scrape job. */
export default function JobActionConfirm({ action, busy, onConfirm, onDismiss }: Props) {
  const bank = action?.bank.toUpperCase() ?? '';

  if (action?.kind === 'retry') {
    return (
      <ConfirmDialog
        visible
        title={`Retry the ${bank} scrape?`}
        summary="This starts a new real scrape for the same bank."
        consequences={[
          'Offers and a new run record are written to the connected database.',
          'Offers are staged for review; nothing is published.',
        ]}
        acknowledgement="I understand this writes to the connected database."
        confirmLabel="Retry scrape"
        loading={busy}
        onConfirm={onConfirm}
        onDismiss={onDismiss}
      />
    );
  }

  return (
    <ConfirmDialog
      visible={action?.kind === 'cancel'}
      title={`Cancel the ${bank} job?`}
      summary="The running scrape process will be terminated."
      consequences={[
        'Anything this run has already written stays in the database.',
        'The run may be left incomplete; start a new run to finish it.',
      ]}
      confirmLabel="Cancel job"
      tone="danger"
      loading={busy}
      onConfirm={onConfirm}
      onDismiss={onDismiss}
    />
  );
}
