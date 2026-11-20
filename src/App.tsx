import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Rental } from './types';
import { dataService } from './services/dataService';
import { Header } from './components/Header';
import { RentalDashboard } from './components/RentalDashboard';
import { PinAuthLock } from './components/PinAuthLock';
import { BottomNavigation, ActiveTab } from './components/BottomNavigation';
import { FeedbackHost } from './components/FeedbackHost';
import { TicketsDrawer } from './components/TicketsDrawer';

const InventoryModule = lazy(() =>
  import('./components/InventoryModule').then((m) => ({ default: m.InventoryModule }))
);
const CashRegisterModule = lazy(() =>
  import('./components/CashRegisterModule').then((m) => ({ default: m.CashRegisterModule }))
);
const StatsReportsModule = lazy(() =>
  import('./components/StatsReportsModule').then((m) => ({ default: m.StatsReportsModule }))
);
const NewRentalModal = lazy(() =>
  import('./components/NewRentalModal').then((m) => ({ default: m.NewRentalModal }))
);
const FinishRentalModal = lazy(() =>
  import('./components/FinishRentalModal').then((m) => ({ default: m.FinishRentalModal }))
);
const ReserveActiveVehicleModal = lazy(() =>
  import('./components/ReserveActiveVehicleModal').then((m) => ({ default: m.ReserveActiveVehicleModal }))
);
const SettingsModal = lazy(() =>
  import('./components/SettingsModal').then((m) => ({ default: m.SettingsModal }))
);
const RaftingWhatsappModal = lazy(() =>
  import('./components/RaftingWhatsappModal').then((m) => ({ default: m.RaftingWhatsappModal }))
);
const PricesPanelModal = lazy(() =>
  import('./components/PricesPanelModal').then((m) => ({ default: m.PricesPanelModal }))
);

export function App() {
  const [, setVersion] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return sessionStorage.getItem('rentflow_pin_authorized') !== 'true';
  });

  // Modals state
  const [isNewRentalOpen, setIsNewRentalOpen] = useState<boolean>(false);
  const [finishRentalTarget, setFinishRentalTarget] = useState<Rental | null>(null);
  const [reserveRentalTarget, setReserveRentalTarget] = useState<Rental | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isRaftingOpen, setIsRaftingOpen] = useState<boolean>(false);
  const [isPricesOpen, setIsPricesOpen] = useState<boolean>(false);
  const [raftingInitialTab, setRaftingInitialTab] = useState<'send' | 'steps' | 'qr' | 'history'>('send');

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
  const ticketCounters = dataService.getTicketCounters();
  const ticketPrices = dataService.getTicketPrices();

  const handleOpenNewRental = useCallback(() => {
    setIsNewRentalOpen(true);
  }, []);

  const handleFinishRentalClick = useCallback((rental: Rental) => {
    setFinishRentalTarget(rental);
  }, []);

  const handleReserveRentalClick = useCallback((rental: Rental) => {
    setReserveRentalTarget(rental);
  }, []);

  const finishCategory = finishRentalTarget
    ? categories.find((c) => c.id === finishRentalTarget.categoryId)
    : undefined;

  const finishUnit = finishRentalTarget
    ? units.find((u) => u.id === finishRentalTarget.unitId)
    : undefined;

  return (
    <div className="min-h-full w-full max-w-full overflow-x-hidden bg-gradient-to-br from-[#FCFBF7] via-[#FAF5E4] to-[#F4E6BA] text-eco-dark flex flex-col font-sans">
      {/* Header with responsive desktop nav */}
      <Header
        activeCount={activeRentals.length}
        onOpenNewRental={() => setIsNewRentalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPrices={() => setIsPricesOpen(true)}
        onOpenRafting={() => {
          setRaftingInitialTab('send');
          setIsRaftingOpen(true);
        }}
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
            onOpenNewRental={handleOpenNewRental}
            onFinishRental={handleFinishRentalClick}
            onReserveRental={handleReserveRentalClick}
          />
        )}

        <Suspense
          fallback={
            <div className="py-12 text-center text-xs font-semibold text-eco-creamMuted">
              Cargando módulo...
            </div>
          }
        >
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
        </Suspense>
      </main>

      {/* Bottom Sticky Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        activeRentalsCount={activeRentals.length}
      />

      {/* Lazy-loaded Modals (chunks fetched only when opened) */}
      <Suspense fallback={null}>
        {isNewRentalOpen && (
          <NewRentalModal
            isOpen={isNewRentalOpen}
            onClose={() => setIsNewRentalOpen(false)}
          />
        )}

        {finishRentalTarget && (
          <FinishRentalModal
            isOpen={Boolean(finishRentalTarget)}
            rental={finishRentalTarget}
            category={finishCategory}
            unit={finishUnit}
            onClose={() => setFinishRentalTarget(null)}
          />
        )}

        {reserveRentalTarget && (
          <ReserveActiveVehicleModal
            rental={reserveRentalTarget}
            category={categories.find((c) => c.id === reserveRentalTarget.categoryId)}
            unit={units.find((u) => u.id === reserveRentalTarget.unitId)}
            onClose={() => setReserveRentalTarget(null)}
          />
        )}

        {isSettingsOpen && (
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            onOpenRaftingConfig={() => {
              setRaftingInitialTab('steps');
              setIsRaftingOpen(true);
            }}
          />
        )}

        {isRaftingOpen && (
          <RaftingWhatsappModal
            isOpen={isRaftingOpen}
            onClose={() => setIsRaftingOpen(false)}
            initialTab={raftingInitialTab}
          />
        )}

        {isPricesOpen && (
          <PricesPanelModal
            isOpen={isPricesOpen}
            onClose={() => setIsPricesOpen(false)}
            categories={categories}
            ticketPrices={ticketPrices}
          />
        )}
      </Suspense>

      {/* Right-to-Left Slide-Over Drawer for Bungee & Palestra Tickets (hidden while PIN locked) */}
      {!isLocked && (
        <TicketsDrawer
          counters={ticketCounters}
          prices={ticketPrices}
          onOpenPrices={() => setIsPricesOpen(true)}
        />
      )}

      {/* Screen Blur PIN Security Lock */}
      {isLocked && (
        <PinAuthLock onUnlock={() => setIsLocked(false)} />
      )}

      {/* Global Toast & Confirm/Prompt Host */}
      <FeedbackHost />
    </div>
  );
}

export default App;
