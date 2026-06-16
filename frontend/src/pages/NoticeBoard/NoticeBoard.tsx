import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/layout';
import { Button, Modal, Loading } from '../../components/common';
import { NoticeCard } from '../../components/notices/NoticeCard';
import { NoticeForm } from '../../components/notices/NoticeForm/NoticeForm';
import { useNotices } from '../../hooks/useNotices';
import { useWorkplaces } from '../../hooks/useWorkplaces';
import { CreateNoticeData, Notice } from '../../types';
import './NoticeBoard.css';

export const NoticeBoard: React.FC = () => {
  const { workplaceId } = useParams<{ workplaceId: string }>();
  const navigate = useNavigate();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title?: string } | null>(null);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsedWorkplaceId = parseInt(workplaceId || '0', 10);
  const { workplaces } = useWorkplaces();
  const { notices, isLoading, error, fetchNotices, createNotice, updateNotice, deleteNotice } =
    useNotices(parsedWorkplaceId);

  const workplace = workplaces.find(w => w.id === parsedWorkplaceId);

  useEffect(() => {
    if (!workplace && workplaces.length > 0) {
      navigate('/workplaces');
    }
  }, [workplace, workplaces, navigate]);

  const handleDelete = (id: number, title?: string) => {
    setDeleteTarget({ id, title });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteNotice(deleteTarget.id);
      await fetchNotices();
    } catch (err) {
      console.error('Failed to delete notice', err);
    } finally {
      setDeleteTarget(null);
    }
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  const handleEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setIsFormModalOpen(true);
  };

  const handlePin = async (id: number, isPinned: boolean) => {
    try {
      await updateNotice(id, { isPinned });
      await fetchNotices();
    } catch (err) {
      console.error('Failed to pin notice', err);
    }
  };

  const handleFormSuccess = () => {
    setIsFormModalOpen(false);
    setEditingNotice(null);
    fetchNotices();
  };

  const handleFormCancel = () => {
    setIsFormModalOpen(false);
    setEditingNotice(null);
  };

  const handleFormSubmit = async (data: CreateNoticeData) => {
    setIsSubmitting(true);
    try {
      if (editingNotice) {
        await updateNotice(editingNotice.id, data);
      } else {
        await createNotice(data);
      }
      handleFormSuccess();
    } catch (err) {
      console.error('Failed to save notice', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!workplace) {
    return (
      <>
        <PageHeader
          title="📋 Notice Board"
          subtitle="Loading..."
        />
        <Loading text="Loading notice board..." />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`📋 ${workplace.name} Notice Board`}
        subtitle="Manage workplace notices and announcements"
        actions={
          <Button variant="primary" onClick={() => setIsFormModalOpen(true)}>
            Add Notice
          </Button>
        }
      />

      {error && (
        <div className="notice-board__error">
          Error loading notices: {error}
        </div>
      )}

      <div className="notice-board__container">
        {isLoading ? (
          <Loading text="Loading notices..." />
        ) : notices.length === 0 ? (
          <div className="notice-board__empty">
            <div className="notice-board__empty-content">
              <h3>No notices yet</h3>
              <p>Start by creating your first workplace notice!</p>
              <Button variant="primary" onClick={() => setIsFormModalOpen(true)}>
                Create First Notice
              </Button>
            </div>
          </div>
        ) : (
          <div className="notice-board__feed">
            {notices.map((notice) => (
              <NoticeCard
                key={notice.id}
                notice={notice}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPin={handlePin}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isFormModalOpen}
        onClose={handleFormCancel}
        title={editingNotice ? 'Edit Notice' : 'Create New Notice'}
        size="large"
      >
        <NoticeForm
          workplaceId={parsedWorkplaceId}
          notice={editingNotice || undefined}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
          isSubmitting={isSubmitting}
          onSubmit={handleFormSubmit}
        />
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        onClose={cancelDelete}
        title="Delete Notice"
        size="small"
      >
        <div className="modal-content">
          <p>Are you sure you want to delete this notice?</p>
          {deleteTarget?.title && (
            <p className="text-gray-600">
              <strong>{deleteTarget.title}</strong>
            </p>
          )}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <Button variant="primary" onClick={confirmDelete}>
              Delete
            </Button>
            <Button variant="secondary" onClick={cancelDelete}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
