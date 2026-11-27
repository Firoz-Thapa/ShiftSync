import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout';
import { Card, Button, ToastContainer, useToast } from '../../components/common';
import { useWorkplaces } from '../../hooks/useWorkplaces';
import { useShifts } from '../../hooks/useShifts';
import { ROUTES } from '../../constants/routes';
import {
  ImportedShiftField,
  ImportedShiftRow,
  SHIFT_IMPORT_TEMPLATE,
  parseShiftImport,
  toShiftFormData,
  validateImportedShift,
} from '../../utils/shiftImport';
import './ShiftImport.css';

type Step = 'upload' | 'preview';

export const ShiftImport = () => {
  const navigate = useNavigate();
  const { workplaces } = useWorkplaces();
  const { createShifts } = useShifts();
  const { toasts, error: showError, removeToast } = useToast();

  const [step, setStep] = useState<Step>('upload');
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [rows, setRows] = useState<ImportedShiftRow[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setRawText(String(reader.result ?? ''));
      setFileName(file.name);
      setParseError('');
    };
    reader.onerror = () => setParseError('Could not read that file.');
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePreview = () => {
    const result = parseShiftImport(rawText, workplaces);
    if (result.error) {
      setParseError(result.error);
      return;
    }
    setRows(result.rows);
    setShowErrors(false);
    setParseError('');
    setStep('preview');
  };

  const updateRow = <K extends keyof ImportedShiftRow>(rowId: string, field: K, value: ImportedShiftRow[K]) => {
    setRows(prev => prev.map(row => (row.rowId === rowId ? { ...row, [field]: value } : row)));
  };

  const removeRow = (rowId: string) => {
    setRows(prev => prev.filter(row => row.rowId !== rowId));
  };

  const rowErrors = Object.fromEntries(rows.map(row => [row.rowId, validateImportedShift(row)]));
  const invalidCount = rows.filter(row => Object.keys(rowErrors[row.rowId]).length > 0).length;

  const handleSave = async () => {
    if (invalidCount > 0) {
      setShowErrors(true);
      showError(
        'Fix the highlighted fields',
        `${invalidCount} row${invalidCount === 1 ? '' : 's'} need${invalidCount === 1 ? 's' : ''} attention before saving.`
      );
      return;
    }

    try {
      setIsSaving(true);
      const saved = await createShifts(rows.map(toShiftFormData));
      const firstStart = saved.map(s => s.startDatetime).sort()[0];
      navigate(ROUTES.SCHEDULE, { state: { importedCount: saved.length, focusDate: firstStart } });
    } catch (err: any) {
      showError('Import failed', err?.message || 'Could not save the shifts.');
    } finally {
      setIsSaving(false);
    }
  };

  const fieldError = (row: ImportedShiftRow, field: ImportedShiftField) =>
    showErrors ? rowErrors[row.rowId][field] : undefined;

  const cellClass = (row: ImportedShiftRow, field: ImportedShiftField) =>
    `shift-import__input${fieldError(row, field) ? ' shift-import__input--error' : ''}`;

  return (
    <>
      <PageHeader
        title="📥 Import Shifts"
        subtitle={
          step === 'upload'
            ? 'Upload or paste a CSV roster, then review each shift before saving'
            : 'Review and correct the imported shifts before saving them'
        }
        actions={
          <Button variant="ghost" size="small" onClick={() => navigate(ROUTES.SCHEDULE)}>
            Cancel
          </Button>
        }
      />

      <div className="shift-import">
        {step === 'upload' && (
          <Card className="shift-import__upload">
            <label className="shift-import__file">
              <input type="file" accept=".csv,text/csv,.txt,.tsv" onChange={handleFileChange} />
              <span>📄 Choose CSV file</span>
            </label>
            {fileName && <p className="shift-import__file-name">Loaded: {fileName}</p>}

            <label htmlFor="shift-import-text" className="shift-import__label">
              Or paste your roster
            </label>
            <textarea
              id="shift-import-text"
              className="shift-import__textarea"
              value={rawText}
              onChange={e => {
                setRawText(e.target.value);
                setParseError('');
              }}
              placeholder={SHIFT_IMPORT_TEMPLATE}
              rows={8}
            />

            <p className="shift-import__hint">
              Required columns: <code>date</code> (YYYY-MM-DD), <code>start</code>, <code>end</code>.
              Optional: <code>workplace</code>, <code>title</code>, <code>break</code> (minutes), <code>notes</code>.
              An end time earlier than the start time is treated as an overnight shift.
            </p>

            {parseError && (
              <p className="shift-import__error" role="alert">
                {parseError}
              </p>
            )}

            <div className="shift-import__actions">
              <Button variant="secondary" size="small" onClick={() => setRawText(SHIFT_IMPORT_TEMPLATE)}>
                Use example
              </Button>
              <Button variant="primary" size="small" onClick={handlePreview} disabled={!rawText.trim()}>
                Preview shifts
              </Button>
            </div>
          </Card>
        )}

        {step === 'preview' && (
          <Card className="shift-import__preview" padding="none">
            {rows.length === 0 ? (
              <p className="shift-import__empty">No shifts left to import.</p>
            ) : (
              <div className="shift-import__table-wrap">
                <table className="shift-import__table">
                  <thead>
                    <tr>
                      <th>Line</th>
                      <th>Title</th>
                      <th>Workplace</th>
                      <th>Start</th>
                      <th>End</th>
                      <th>Break (min)</th>
                      <th>Notes</th>
                      <th aria-label="Remove" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(row => (
                      <tr key={row.rowId}>
                        <td className="shift-import__line">{row.sourceLine}</td>
                        <td>
                          <input
                            aria-label={`Title, line ${row.sourceLine}`}
                            className={cellClass(row, 'title')}
                            value={row.title}
                            onChange={e => updateRow(row.rowId, 'title', e.target.value)}
                          />
                          <FieldError message={fieldError(row, 'title')} />
                        </td>
                        <td>
                          <select
                            aria-label={`Workplace, line ${row.sourceLine}`}
                            className={cellClass(row, 'workplaceId')}
                            value={row.workplaceId}
                            onChange={e => updateRow(row.rowId, 'workplaceId', Number(e.target.value))}
                          >
                            <option value={0}>Select workplace</option>
                            {workplaces.map(w => (
                              <option key={w.id} value={w.id}>
                                {w.name}
                              </option>
                            ))}
                          </select>
                          {!row.workplaceId && row.workplaceName && (
                            <span className="shift-import__note">Not found: "{row.workplaceName}"</span>
                          )}
                          <FieldError message={fieldError(row, 'workplaceId')} />
                        </td>
                        <td>
                          <input
                            type="datetime-local"
                            aria-label={`Start, line ${row.sourceLine}`}
                            className={cellClass(row, 'startDatetime')}
                            value={row.startDatetime}
                            onChange={e => updateRow(row.rowId, 'startDatetime', e.target.value)}
                          />
                          <FieldError message={fieldError(row, 'startDatetime')} />
                        </td>
                        <td>
                          <input
                            type="datetime-local"
                            aria-label={`End, line ${row.sourceLine}`}
                            className={cellClass(row, 'endDatetime')}
                            value={row.endDatetime}
                            onChange={e => updateRow(row.rowId, 'endDatetime', e.target.value)}
                          />
                          <FieldError message={fieldError(row, 'endDatetime')} />
                        </td>
                        <td>
                          <input
                            type="number"
                            min={0}
                            aria-label={`Break minutes, line ${row.sourceLine}`}
                            className={`${cellClass(row, 'breakDuration')} shift-import__input--narrow`}
                            value={row.breakDuration}
                            onChange={e => updateRow(row.rowId, 'breakDuration', Number(e.target.value))}
                          />
                          <FieldError message={fieldError(row, 'breakDuration')} />
                        </td>
                        <td>
                          <input
                            aria-label={`Notes, line ${row.sourceLine}`}
                            className="shift-import__input"
                            value={row.notes}
                            onChange={e => updateRow(row.rowId, 'notes', e.target.value)}
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="shift-import__remove"
                            aria-label={`Remove line ${row.sourceLine}`}
                            title="Remove this shift"
                            onClick={() => removeRow(row.rowId)}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="shift-import__footer">
              <Button variant="secondary" size="small" onClick={() => setStep('upload')}>
                ◀ Back
              </Button>
              <Button
                variant="primary"
                size="small"
                onClick={handleSave}
                loading={isSaving}
                disabled={rows.length === 0 || isSaving}
              >
                Save {rows.length} shift{rows.length === 1 ? '' : 's'}
              </Button>
            </div>
          </Card>
        )}
      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
};

const FieldError = ({ message }: { message?: string }) =>
  message ? <span className="shift-import__field-error">{message}</span> : null;
