import React, { useState } from 'react';
import { PageHeader } from '../../components/layout';
import { Card, Button, Modal } from '../../components/common';
import { useWorkplaces } from '../../hooks/useWorkplaces';
import { WorkplaceForm } from '../../components/forms/WorkplaceForm';
import { formatCurrency } from '../../utils/formatters';

export const Workplaces: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name?: string } | null>(null);
  const { workplaces, isLoading, fetchWorkplaces, deleteWorkplace } = useWorkplaces();

  const handleDelete = (id: number, name?: string) => {
    setDeleteTarget({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteWorkplace(deleteTarget.id);
      await fetchWorkplaces();
    } catch (err) {
      console.error('Failed to delete workplace', err);
      // Optionally show toast/UI feedback here
    } finally {
      setDeleteTarget(null);
    }
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  const handleSuccess = async () => {
    console.log('Workplace added successfully, closing modal and refreshing...'); 
    setIsModalOpen(false);
    await fetchWorkplaces();
  };

  return (
    <>
      <PageHeader
        title="🏢 My Workplaces"
        subtitle="Manage your part-time jobs and work locations"
        actions={
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            Add Workplace
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <Card>Loading workplaces...</Card>
        ) : workplaces.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">No workplaces yet</h3>
              <p className="text-gray-600 mb-4">Add your first workplace to get started!</p>
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                Add Workplace
              </Button>
            </div>
          </Card>
        ) : (
          workplaces.map((workplace) => (
            <Card key={workplace.id} className="hover-lift">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
                    style={{ backgroundColor: workplace.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg">{workplace.name}</h3>
                    <p className="text-green-600 font-medium">
                      {formatCurrency(workplace.hourlyRate)}/hour
                    </p>
                    {workplace.address && (
                      <p className="text-gray-600 text-sm mt-1">{workplace.address}</p>
                    )}
                    {workplace.notes && (
                      <p className="text-gray-500 text-sm mt-2">{workplace.notes}</p>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0 ml-3">
                  <Button
                    variant="error"
                    onClick={() => handleDelete(workplace.id, workplace.name)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Workplace"
        size="medium"
      >
        <WorkplaceForm
          onSuccess={handleSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={deleteTarget !== null}
        onClose={cancelDelete}
        title="Confirm Deletion"
        size="small"
        actions={
          <>
            <Button variant="secondary" onClick={cancelDelete}>
              Cancel
            </Button>
            <Button variant="error" onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p>
          Delete workplace "{deleteTarget?.name ?? ''}"? This action cannot be undone.
        </p>
      </Modal>
    </>
  );
};