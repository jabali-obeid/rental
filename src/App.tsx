import { useState, useEffect } from 'react';
import { Rental } from './types';
import { dataService } from './services/dataService';
import { Header } from './components/Header';
import { RentalDashboard } from './components/RentalDashboard';
import { NewRentalModal } from './components/NewRentalModal';
import { FinishRentalModal } from './components/FinishRentalModal';
import { InventoryModule } from './components/InventoryModule';
import { CashRegisterModule } from './components/CashRegisterModule';
import { StatsReportsModule } from './components/StatsReportsModule';
import { SettingsModal } from './components/SettingsModal';
import { PinAuthLock } from './components/PinAuthLock';
import { BottomNavigation, ActiveTab } from './components/BottomNavigation';

export function App() {
  const [, setVersion] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return sessionStorage.getItem('rentflow_pin_authorized') !== 'true';
  });

  // Modals state
  const [isNewRentalOpen, setIsNewRentalOpen] = useState<boolean>(false);
  const [finishRentalTarget, setFinishRentalTarget] = useState<Rental | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Subscribe to real-time data mutations
  useEffect(() => {
    const unsubscribe = dataService.subscribe(() => {
      setVersion((v) => v + 1);
    });
    return unsubscribe;
  }, []);

  const categories = dataService.getCategories();
  const units = dataService.getUnits();
  const allRentals = dataService.getRentals();
  const activeRentals = dataService.getActiveRentals();
  const cashMovements = dataService.getCashMovements();

  const handleFinishRentalClick = (rental: Rental) => {
    setFinishRentalTarget(rental);
  };

  const finishCategory = finishRentalTarget
    ? categories.find((c) => c.id === finishRentalTarget.categoryId)
    : undefined;

  const finishUnit = finishRentalTarget
    ? units.find((u) => u.id === finishRentalTarget.unitId)
    : undefined;

  return (
    <div className="min-h-full w-full max-w-full overflow-x-hidden bg-[#02110c] text-[#f3ebd6] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header with responsive desktop nav */}
      <Header
        activeCount={activeRentals.length}
        onOpenNewRental={() => setIsNewRentalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />

      {/* Main Content Area (Expands comfortably on notebooks and widescreen displays) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 min-w-0 overflow-x-hidden">
        {activeTab === 'dashboard' && (
          <RentalDashboard
            rentals={activeRentals}
            categories={categories}
            units={units}
            onOpenNewRental={() => setIsNewRentalOpen(true)}
            onFinishRental={handleFinishRentalClick}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryModule units={units} categories={categories} />
        )}

        {activeTab === 'cash' && (
          <CashRegisterModule movements={cashMovements} />
        )}

        {activeTab === 'stats' && (
          <StatsReportsModule
            rentals={allRentals}
            categories={categories}
            units={units}
          />
        )}
      </main>

      {/* Bottom Sticky Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        activeRentalsCount={activeRentals.length}
      />

      {/* Modals */}
      <NewRentalModal
        isOpen={isNewRentalOpen}
        onClose={() => setIsNewRentalOpen(false)}
      />

      <FinishRentalModal
        isOpen={Boolean(finishRentalTarget)}
        rental={finishRentalTarget}
        category={finishCategory}
        unit={finishUnit}
        onClose={() => setFinishRentalTarget(null)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Screen Blur PIN Security Lock */}
      {isLocked && (
        <PinAuthLock onUnlock={() => setIsLocked(false)} />
      )}
    </div>
  );
}

export default App;
