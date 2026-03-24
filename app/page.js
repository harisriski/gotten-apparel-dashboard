'use client';

import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import OverviewPage from './components/OverviewPage';
import OrdersPage from './components/OrdersPage';
import FinancePage from './components/FinancePage';
import CustomersPage from './components/CustomersPage';
import InventoryPage from './components/InventoryPage';
import ProductionPage from './components/ProductionPage';
import OrderFormPage from './components/OrderFormPage';
import OrderDetailPage from './components/OrderDetailPage';
import FinanceFormPage from './components/FinanceFormPage';
import CustomerFormPage from './components/CustomerFormPage';
import InventoryFormPage from './components/InventoryFormPage';
import ProductionFormPage from './components/ProductionFormPage';

export default function Dashboard() {
  const [activePage, setActivePage] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Sub-page state for CRUD form pages
  const [subPage, setSubPage] = useState(null); // { type: 'order-add', data: null } etc.

  function handleSearch(query) {
    setSearchQuery(query);
    setActivePage('orders');
    setSubPage(null);
  }

  function navigateTo(page) {
    setActivePage(page);
    setSearchQuery('');
    setSubPage(null);
  }

  // Order handlers
  function handleOrderAdd() {
    setSubPage({ type: 'order-add' });
  }
  function handleOrderEdit(order) {
    setSubPage({ type: 'order-edit', data: order });
  }
  function handleOrderDetail(order) {
    if (order && !order.customer) {
      fetch(`/api/orders/${order.id}`)
        .then(r => r.json())
        .then(d => { if (!d.error) setSubPage({ type: 'order-detail', data: d }); })
        .catch(console.error);
    } else {
      setSubPage({ type: 'order-detail', data: order });
    }
  }
  function handleOrderSaved() {
    setSubPage(null);
  }

  // Finance handlers
  function handleFinanceAdd() {
    setSubPage({ type: 'finance-add' });
  }
  function handleFinanceEdit(tx) {
    setSubPage({ type: 'finance-edit', data: tx });
  }
  function handleFinanceSaved() {
    setSubPage(null);
  }

  // Customer handlers
  function handleCustomerAdd() {
    setSubPage({ type: 'customer-add' });
  }
  function handleCustomerEdit(customer) {
    setSubPage({ type: 'customer-edit', data: customer });
  }
  function handleCustomerDetail(customer) {
    setSubPage({ type: 'customer-detail', data: customer });
  }
  function handleCustomerSaved() {
    setSubPage(null);
  }

  // Inventory handlers
  function handleInventoryAddRaw() {
    setSubPage({ type: 'inventory-add-raw' });
  }
  function handleInventoryEditRaw(item) {
    setSubPage({ type: 'inventory-edit-raw', data: item });
  }
  function handleInventoryAddStock() {
    setSubPage({ type: 'inventory-add-stock' });
  }
  function handleInventoryEditStock(item) {
    setSubPage({ type: 'inventory-edit-stock', data: item });
  }
  function handleInventorySaved() {
    setSubPage(null);
  }

  // Production handlers
  function handleProductionAdd() {
    setSubPage({ type: 'production-add' });
  }
  function handleProductionEdit(item) {
    setSubPage({ type: 'production-edit', data: item });
  }
  function handleProductionSaved() {
    setSubPage(null);
  }

  function goBack() {
    setSubPage(null);
  }

  // Render sub-pages (form/detail pages)
  function renderSubPage() {
    if (!subPage) return null;

    switch (subPage.type) {
      case 'order-add':
        return <OrderFormPage onSave={handleOrderSaved} onCancel={goBack} />;
      case 'order-edit':
        return <OrderFormPage editOrder={subPage.data} onSave={handleOrderSaved} onCancel={goBack} />;
      case 'order-detail':
        return <OrderDetailPage order={subPage.data} onBack={goBack} onEdit={handleOrderEdit} />;
      case 'finance-add':
        return <FinanceFormPage onSave={handleFinanceSaved} onCancel={goBack} />;
      case 'finance-edit':
        return <FinanceFormPage editTx={subPage.data} onSave={handleFinanceSaved} onCancel={goBack} />;
      case 'customer-add':
        return <CustomerFormPage onSave={handleCustomerSaved} onCancel={goBack} onEdit={handleCustomerEdit} />;
      case 'customer-edit':
        return <CustomerFormPage editCustomer={subPage.data} onSave={handleCustomerSaved} onCancel={goBack} onEdit={handleCustomerEdit} />;
      case 'customer-detail':
        return <CustomerFormPage detailCustomer={subPage.data} onSave={handleCustomerSaved} onCancel={goBack} onEdit={handleCustomerEdit} />;
      case 'inventory-add-raw':
        return <InventoryFormPage formType="raw" onSave={handleInventorySaved} onCancel={goBack} />;
      case 'inventory-edit-raw':
        return <InventoryFormPage editItem={subPage.data} formType="raw" onSave={handleInventorySaved} onCancel={goBack} />;
      case 'inventory-add-stock':
        return <InventoryFormPage formType="stock" onSave={handleInventorySaved} onCancel={goBack} />;
      case 'inventory-edit-stock':
        return <InventoryFormPage editItem={subPage.data} formType="stock" onSave={handleInventorySaved} onCancel={goBack} />;
      case 'production-add':
        return <ProductionFormPage onSave={handleProductionSaved} onCancel={goBack} />;
      case 'production-edit':
        return <ProductionFormPage editItem={subPage.data} onSave={handleProductionSaved} onCancel={goBack} />;
      default:
        return null;
    }
  }

  const pages = {
    overview: <OverviewPage onViewOrders={() => navigateTo('orders')} onOrderClick={handleOrderDetail} />,
    orders: <OrdersPage onOrderClick={handleOrderDetail} onAdd={handleOrderAdd} onEdit={handleOrderEdit} searchQuery={searchQuery} />,
    finance: <FinancePage onAdd={handleFinanceAdd} onEdit={handleFinanceEdit} />,
    customers: <CustomersPage onAdd={handleCustomerAdd} onEdit={handleCustomerEdit} onDetail={handleCustomerDetail} />,
    inventory: <InventoryPage onAddRaw={handleInventoryAddRaw} onEditRaw={handleInventoryEditRaw} onAddStock={handleInventoryAddStock} onEditStock={handleInventoryEditStock} />,
    production: <ProductionPage onOrderClick={handleOrderDetail} onAdd={handleProductionAdd} onEdit={handleProductionEdit} />,
  };

  return (
    <>
      <Sidebar
        activePage={activePage}
        onPageChange={navigateTo}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="main-content">
        <Topbar
          activePage={activePage}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          onSearch={handleSearch}
        />
        {subPage ? renderSubPage() : pages[activePage]}
      </main>
    </>
  );
}
