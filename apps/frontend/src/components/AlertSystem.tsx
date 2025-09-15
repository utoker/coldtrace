'use client';

import { useAlertStore } from '@/store/useAlertStore';
import { useAlerts } from '@/hooks/useAlerts';
import { AlertPanel } from './AlertPanel';
import { AlertDetailModal } from './AlertDetailModal';

export function AlertSystem() {
  const isAlertPanelOpen = useAlertStore((state) => state.isAlertPanelOpen);
  const setAlertPanelOpen = useAlertStore((state) => state.setAlertPanelOpen);
  const selectedAlert = useAlertStore((state) => state.selectedAlert);
  const selectAlert = useAlertStore((state) => state.selectAlert);

  // Initialize alerts system (queries, subscriptions, etc.)
  useAlerts();

  const handleClosePanel = () => {
    setAlertPanelOpen(false);
  };

  const handleCloseDetailModal = () => {
    selectAlert(null);
  };

  return (
    <>
      {/* Desktop Alert Panel - slides in from right */}
      <div className="hidden lg:block">
        {isAlertPanelOpen && (
          <div className="fixed right-4 top-20 bottom-4 w-96 z-50">
            <AlertPanel isOpen={isAlertPanelOpen} onClose={handleClosePanel} />
          </div>
        )}
      </div>

      {/* Mobile Alert Panel - full screen overlay */}
      <div className="lg:hidden">
        <AlertPanel isOpen={isAlertPanelOpen} onClose={handleClosePanel} />
      </div>

      {/* Alert Detail Modal */}
      <AlertDetailModal
        alert={selectedAlert}
        isOpen={!!selectedAlert}
        onClose={handleCloseDetailModal}
      />
    </>
  );
}
