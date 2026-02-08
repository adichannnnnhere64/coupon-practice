// pages/OrderListPage.tsx
import React, { useState, useEffect, JSX } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonIcon,
  IonBadge,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonLabel,
  IonNote,
  IonLoading,
  IonAlert,
  IonText,
  IonModal,
  IonButtons,
  IonChip,
  IonList,
  IonListHeader,
} from '@ionic/react';
import {
  search,
  eye,
  download,
  arrowBack,
  arrowForward,
  checkmarkCircle,
  time,
  closeCircle,
  refresh,
  receipt,
  card,
  cash,
  wallet,
  ban,
  filter,
  informationCircle,
  cart,
} from 'ionicons/icons';
import './OrderListPage.scss';
import { useHistory } from 'react-router-dom';
import { useAuth } from '@services/useApi';
import apiClient from '@services/APIService';

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface Order {
  id: number;
  order_id: string;
  status: string;
  total: number;
  description: string;
  date: string;
  formatted_date: string;
  items_count: number;
  items: OrderItem[];
  payment_method: string | null;
  payment_status: string | null;
  metadata: Record<string, any>;
}

interface OrderStats {
  total_orders: number;
  total_revenue: number;
  completed_orders: number;
  pending_orders: number;
  cancelled_orders: number;
}

interface Pagination {
  current_page: number;
  total_pages: number;
  total_items: number;
  per_page: number;
  has_more: boolean;
}

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const sortOptions = [
  { value: 'date_desc', label: 'Date: Newest First' },
  { value: 'date_asc', label: 'Date: Oldest First' },
  { value: 'total_desc', label: 'Total: High to Low' },
  { value: 'total_asc', label: 'Total: Low to High' },
];

const OrderListPage: React.FC = () => {
  const history = useHistory();
  const { user } = useAuth();
	console.log(user)
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    total_orders: 0,
    total_revenue: 0,
    completed_orders: 0,
    pending_orders: 0,
    cancelled_orders: 0,
  });
  const [pagination, setPagination] = useState<Pagination>({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    per_page: 10,
    has_more: false,
  });
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportStatus, setExportStatus] = useState('all');
  const [exporting, setExporting] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async (page = 1, resetFilters = false) => {
    try {
      if (!refreshing) setLoading(true);
      setError(null);
      
      const params: any = {
        page,
        per_page: 10,
        sort_by: sortBy,
      };
      
      if (searchQuery && !resetFilters) {
        params.search = searchQuery;
      }
      
      if (statusFilter !== 'all' && !resetFilters) {
        params.status = statusFilter;
      }
      
      const response = await apiClient.get<{
        success: boolean;
        data: {
          orders: Order[];
          stats: OrderStats;
          pagination: Pagination;
        };
      }>('/orders', { params });
      
      if (response.success && response.data) {
        if (page === 1 || resetFilters) {
          setOrders(response.data.orders);
        } else {
          setOrders(prev => [...prev, ...response.data.orders]);
        }
        setStats(response.data.stats);
        setPagination(response.data.pagination);
      } else {
        setError('Failed to load orders');
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, [statusFilter, sortBy]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery || statusFilter !== 'all') {
        fetchOrders(1);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders(1);
  };

  const handleLoadMore = () => {
    if (pagination.has_more && !loading) {
      fetchOrders(pagination.current_page + 1);
    }
  };

  const handleViewOrder = (orderId: number) => {
    history.push(`/orders/${orderId}`);
  };

  const handleShowOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleCancelOrder = async () => {
    if (!cancellingOrderId) return;
    
    try {
      setLoading(true);
      const response = await apiClient.post(`/orders/${cancellingOrderId}/cancel`) as any;
      
      if (response.success) {
        fetchOrders(1);
        setShowCancelConfirm(false);
        setCancellingOrderId(null);
      }
    } catch (error) {
      console.error('Failed to cancel order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportOrders = async () => {
    try {
      setExporting(true);
      
      const params: any = {
        format: exportFormat,
      };
      
      if (exportStatus !== 'all') {
        params.status = exportStatus;
      }
      
      const response = await apiClient.post('/orders/export', params) as any;
      
      if (response.success && response.data) {
        if (exportFormat === 'csv') {
          // Create and download CSV file
          const csvContent = convertToCSV(response.data.csv_data);
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          const url = URL.createObjectURL(blob);
          
          link.setAttribute('href', url);
          link.setAttribute('download', response.data.filename);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        
        setShowExportModal(false);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ];
    
    return csvRows.join('\n');
  };

  const getStatusBadge = (status: string): JSX.Element => {
    switch (status) {
      case 'completed':
        return (
          <IonChip color="success">
            <IonIcon icon={checkmarkCircle} />
            <IonLabel>Completed</IonLabel>
          </IonChip>
        );
      case 'processing':
        return (
          <IonChip color="warning">
            <IonIcon icon={time} />
            <IonLabel>Processing</IonLabel>
          </IonChip>
        );
      case 'pending':
        return (
          <IonChip color="medium">
            <IonIcon icon={time} />
            <IonLabel>Pending</IonLabel>
          </IonChip>
        );
      case 'cancelled':
        return (
          <IonChip color="danger">
            <IonIcon icon={closeCircle} />
            <IonLabel>Cancelled</IonLabel>
          </IonChip>
        );
      default:
        return <IonBadge color="medium">{status}</IonBadge>;
    }
  };

  const getPaymentMethodIcon = (method: string | null) => {
    if (!method) return card;
    
    if (method.toLowerCase().includes('card')) return card;
    if (method.toLowerCase().includes('paypal')) return receipt;
    if (method.toLowerCase().includes('wallet')) return wallet;
    if (method.toLowerCase().includes('cash')) return cash;
    
    return card;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    fetchOrders(1, true);
  };

  const canCancelOrder = (order: Order) => {
    return order.status === 'pending' || order.status === 'processing';
  };

  // Orders Table Content
  const renderOrdersTable = () => {
    if (orders.length === 0) {
      return (
        <div className="no-results ion-text-center ion-padding">
          <IonIcon icon={search} size="large" color="medium" />
          <h3>No orders found</h3>
          <p>Try adjusting your search or filters</p>
          <IonButton onClick={resetFilters}>
            Clear Filters
          </IonButton>
        </div>
      );
    }

    return (
      <div className="orders-table ion-padding">
        <IonCard>
          <IonCardContent>
            <div className="table-responsive">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td data-label="Order ID">
                        <strong>{order.order_id}</strong>
                      </td>
                      <td data-label="Description">
                        <div className="order-description">
                          <strong>{order.description}</strong>
                          {order.metadata?.notes && (
                            <p className="order-notes">{order.metadata.notes}</p>
                          )}
                        </div>
                      </td>
                      <td data-label="Date">
                        {order.formatted_date}
                      </td>
                      <td data-label="Items">
                        <IonBadge color="light">
                          <IonIcon icon={cart} style={{ marginRight: '4px' }} />
                          {order.items_count} items
                        </IonBadge>
                      </td>
                      <td data-label="Total">
                        <strong>{formatCurrency(order.total)}</strong>
                      </td>
                      <td data-label="Payment">
                        <div className="payment-method">
                          <IonIcon 
                            icon={getPaymentMethodIcon(order.payment_method)} 
                            style={{ marginRight: '6px', verticalAlign: 'middle' }}
                          />
                          <span>{order.payment_method || 'Not paid'}</span>
                        </div>
                      </td>
                      <td data-label="Status">
                        {getStatusBadge(order.status)}
                      </td>
                      <td data-label="Actions">
                        <div className="action-buttons">
                          <IonButton
                            size="small"
                            fill="clear"
                            onClick={() => handleShowOrderDetails(order)}
                          >
                            <IonIcon slot="icon-only" icon={informationCircle} />
                          </IonButton>
                          <IonButton
                            size="small"
                            fill="clear"
                            onClick={() => handleViewOrder(order.id)}
                          >
                            <IonIcon slot="icon-only" icon={eye} />
                          </IonButton>
                          {canCancelOrder(order) && (
                            <IonButton
                              size="small"
                              fill="clear"
                              color="danger"
                              onClick={() => {
                                setCancellingOrderId(order.id);
                                setShowCancelConfirm(true);
                              }}
                            >
                              <IonIcon slot="icon-only" icon={ban} />
                            </IonButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </IonCardContent>
        </IonCard>
      </div>
    );
  };

  // Order Details Modal
  const renderOrderDetailsModal = () => (
    <IonModal isOpen={showOrderDetails} onDidDismiss={() => setShowOrderDetails(false)}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Order Details</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setShowOrderDetails(false)}>Close</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {selectedOrder && (
          <div className="order-details ion-padding">
            <IonCard>
              <IonCardContent>
                <div className="order-header">
                  <h2>{selectedOrder.order_id}</h2>
                  <div className="order-status">
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                </div>
                
                <IonGrid>
                  <IonRow>
                    <IonCol size="12" sizeMd="6">
                      <div className="order-info-section">
                        <h3><IonIcon icon={informationCircle} /> Order Information</h3>
                        <IonList lines="full">
                          <IonItem>
                            <IonLabel>
                              <h3>Order ID</h3>
                              <p>{selectedOrder.order_id}</p>
                            </IonLabel>
                          </IonItem>
                          <IonItem>
                            <IonLabel>
                              <h3>Date</h3>
                              <p>{selectedOrder.formatted_date}</p>
                            </IonLabel>
                          </IonItem>
                          <IonItem>
                            <IonLabel>
                              <h3>Description</h3>
                              <p>{selectedOrder.description}</p>
                            </IonLabel>
                          </IonItem>
                        </IonList>
                      </div>
                    </IonCol>
                    
                    <IonCol size="12" sizeMd="6">
                      <div className="payment-info-section">
                        <h3><IonIcon icon={card} /> Payment Information</h3>
                        <IonList lines="full">
                          <IonItem>
                            <IonLabel>
                              <h3>Payment Method</h3>
                              <p>
                                <IonIcon icon={getPaymentMethodIcon(selectedOrder.payment_method)} />
                                {selectedOrder.payment_method || 'Not specified'}
                              </p>
                            </IonLabel>
                          </IonItem>
                          <IonItem>
                            <IonLabel>
                              <h3>Payment Status</h3>
                              <p>{selectedOrder.payment_status || 'Not paid'}</p>
                            </IonLabel>
                          </IonItem>
                          <IonItem>
                            <IonLabel>
                              <h3>Total Amount</h3>
                              <p className="order-total">{formatCurrency(selectedOrder.total)}</p>
                            </IonLabel>
                          </IonItem>
                        </IonList>
                      </div>
                    </IonCol>
                  </IonRow>
                  
                  <IonRow>
                    <IonCol size="12">
                      <div className="order-items-section">
                        <h3><IonIcon icon={cart} /> Order Items ({selectedOrder.items_count})</h3>
                        <IonList lines="full">
                          {selectedOrder.items.map((item) => (
                            <IonItem key={item.id}>
                              <IonLabel>
                                <h3>{item.name}</h3>
                                <p>Quantity: {item.quantity}</p>
                              </IonLabel>
                              <IonNote slot="end">
                                <div className="item-price">
                                  <p>{formatCurrency(item.price)} each</p>
                                  <p className="item-subtotal">{formatCurrency(item.subtotal)}</p>
                                </div>
                              </IonNote>
                            </IonItem>
                          ))}
                        </IonList>
                      </div>
                    </IonCol>
                  </IonRow>
                  
                  <IonRow>
                    <IonCol size="12">
                      <div className="order-total-section">
                        <IonList lines="full">
                          <IonItem>
                            <IonLabel>
                              <h2>Total</h2>
                            </IonLabel>
                            <IonNote slot="end">
                              <h2>{formatCurrency(selectedOrder.total)}</h2>
                            </IonNote>
                          </IonItem>
                        </IonList>
                      </div>
                    </IonCol>
                  </IonRow>
                </IonGrid>
                
                <div className="order-actions ion-padding-top">
                  <IonButton expand="block" onClick={() => handleViewOrder(selectedOrder.id)}>
                    <IonIcon slot="start" icon={eye} />
                    View Full Details
                  </IonButton>
                  {canCancelOrder(selectedOrder) && (
                    <IonButton 
                      expand="block" 
                      color="danger" 
                      fill="outline"
                      onClick={() => {
                        setShowOrderDetails(false);
                        setCancellingOrderId(selectedOrder.id);
                        setShowCancelConfirm(true);
                      }}
                    >
                      <IonIcon slot="start" icon={ban} />
                      Cancel Order
                    </IonButton>
                  )}
                </div>
              </IonCardContent>
            </IonCard>
          </div>
        )}
      </IonContent>
    </IonModal>
  );

  // Export Modal
  const renderExportModal = () => (
    <IonModal isOpen={showExportModal} onDidDismiss={() => setShowExportModal(false)}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Export Orders</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setShowExportModal(false)}>Close</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="export-modal ion-padding">
          <IonCard>
            <IonCardContent>
              <IonList>
                <IonListHeader>
                  <IonLabel>Export Options</IonLabel>
                </IonListHeader>
                
                <IonItem>
                  <IonLabel>Format</IonLabel>
                  <IonSelect 
                    value={exportFormat} 
                    onIonChange={(e) => setExportFormat(e.detail.value)}
                    interface="popover"
                  >
                    <IonSelectOption value="csv">CSV</IonSelectOption>
                    <IonSelectOption value="json">JSON</IonSelectOption>
                  </IonSelect>
                </IonItem>
                
                <IonItem>
                  <IonLabel>Status Filter</IonLabel>
                  <IonSelect 
                    value={exportStatus} 
                    onIonChange={(e) => setExportStatus(e.detail.value)}
                    interface="popover"
                  >
                    <IonSelectOption value="all">All Orders</IonSelectOption>
                    <IonSelectOption value="pending">Pending Only</IonSelectOption>
                    <IonSelectOption value="processing">Processing Only</IonSelectOption>
                    <IonSelectOption value="completed">Completed Only</IonSelectOption>
                    <IonSelectOption value="cancelled">Cancelled Only</IonSelectOption>
                  </IonSelect>
                </IonItem>
              </IonList>
              
              <div className="export-info ion-padding-top">
                <IonText color="medium">
                  <p>
                    This will export all orders matching the selected filters. 
                    The exported file will contain order details including ID, date, status, 
                    items, totals, and payment information.
                  </p>
                </IonText>
              </div>
              
              <div className="export-actions ion-padding-top">
                <IonButton 
                  expand="block" 
                  onClick={handleExportOrders}
                  disabled={exporting}
                >
                  <IonIcon slot="start" icon={download} />
                  {exporting ? 'Exporting...' : 'Export Orders'}
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonModal>
  );

  // Pagination Controls
  const renderPagination = () => {
    if (pagination.total_pages <= 1) return null;

    const paginationButtons = [];
    for (let i = 1; i <= pagination.total_pages; i++) {
      if (
        i === 1 ||
        i === pagination.total_pages ||
        (i >= pagination.current_page - 1 && i <= pagination.current_page + 1)
      ) {
        paginationButtons.push(
          <IonButton
            key={i}
            fill={pagination.current_page === i ? 'solid' : 'outline'}
            size="small"
            onClick={() => fetchOrders(i)}
            disabled={loading}
          >
            {i}
          </IonButton>
        );
      } else if (i === pagination.current_page - 2 || i === pagination.current_page + 2) {
        paginationButtons.push(
          <IonText key={i} color="medium">
            ...
          </IonText>
        );
      }
    }

    return (
      <div className="pagination-section ion-padding">
        <IonCard>
          <IonCardContent>
            <div className="pagination-controls">
              <IonButton
                fill="outline"
                size="small"
                disabled={pagination.current_page === 1 || loading}
                onClick={() => fetchOrders(pagination.current_page - 1)}
              >
                <IonIcon slot="start" icon={arrowBack} />
                Previous
              </IonButton>
              
              <div className="page-numbers">
                {paginationButtons}
              </div>
              
              <IonButton
                fill="outline"
                size="small"
                disabled={!pagination.has_more || loading}
                onClick={handleLoadMore}
              >
                Next
                <IonIcon slot="end" icon={arrowForward} />
              </IonButton>
            </div>
            
            <div className="pagination-info">
              <IonNote>
                Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                {Math.min(pagination.current_page * pagination.per_page, pagination.total_items)} of{' '}
                {pagination.total_items} orders
              </IonNote>
            </div>
          </IonCardContent>
        </IonCard>
      </div>
    );
  };

  return (
    <IonPage className="order-list-page">
      <IonHeader>
        <IonToolbar>
          <IonTitle>My Orders</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleRefresh} disabled={refreshing}>
              <IonIcon slot="icon-only" icon={refreshing ? 'refresh-circle' : refresh} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {/* Stats Overview */}
        <div className="stats-overview ion-padding">
          <IonGrid>
            <IonRow>
              <IonCol size="6" sizeMd="3">
                <IonCard className="stat-card">
                  <IonCardContent>
                    <h3>{stats.total_orders}</h3>
                    <p>Total Orders</p>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              <IonCol size="6" sizeMd="3">
                <IonCard className="stat-card revenue-card">
                  <IonCardContent>
                    <h3>{formatCurrency(stats.total_revenue)}</h3>
                    <p>Total Spent</p>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              <IonCol size="6" sizeMd="3">
                <IonCard className="stat-card">
                  <IonCardContent>
                    <h3>{stats.completed_orders}</h3>
                    <p>Completed</p>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              <IonCol size="6" sizeMd="3">
                <IonCard className="stat-card">
                  <IonCardContent>
                    <h3>{stats.pending_orders}</h3>
                    <p>Pending</p>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          </IonGrid>
        </div>

        {/* Controls */}
        <div className="controls-section ion-padding">
          <IonGrid>
            <IonRow className="ion-align-items-center">
              <IonCol size="12" sizeMd="4">
                <IonSearchbar
                  value={searchQuery}
                  onIonChange={(e) => setSearchQuery(e.detail.value || '')}
                  placeholder="Search orders..."
                  animated
                  clearIcon={searchQuery ? 'close-circle' : undefined}
                  onIonClear={() => setSearchQuery('')}
                />
              </IonCol>
              <IonCol size="6" sizeMd="3">
                <IonItem lines="none">
                  <IonSelect
                    value={statusFilter}
                    onIonChange={(e) => setStatusFilter(e.detail.value)}
                    interface="popover"
                    label="Status"
                    labelPlacement="floating"
                  >
                    {statusOptions.map((option) => (
                      <IonSelectOption key={option.value} value={option.value}>
                        {option.label}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
              </IonCol>
              <IonCol size="6" sizeMd="3">
                <IonItem lines="none">
                  <IonSelect
                    value={sortBy}
                    onIonChange={(e) => setSortBy(e.detail.value)}
                    interface="popover"
                    label="Sort By"
                    labelPlacement="floating"
                  >
                    {sortOptions.map((option) => (
                      <IonSelectOption key={option.value} value={option.value}>
                        {option.label}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
              </IonCol>
              <IonCol size="12" sizeMd="2">
                <div className="action-buttons">
                  <IonButton expand="block" onClick={() => setShowExportModal(true)}>
                    <IonIcon slot="start" icon={download} />
                    Export
                  </IonButton>
                </div>
              </IonCol>
            </IonRow>
            
            {(searchQuery || statusFilter !== 'all') && (
              <IonRow>
                <IonCol>
                  <div className="active-filters">
                    <IonChip color="medium" onClick={resetFilters}>
                      <IonIcon icon={closeCircle} />
                      <IonLabel>Clear Filters</IonLabel>
                    </IonChip>
                    
                    {searchQuery && (
                      <IonChip>
                        <IonIcon icon={search} />
                        <IonLabel>Search: {searchQuery}</IonLabel>
                      </IonChip>
                    )}
                    
                    {statusFilter !== 'all' && (
                      <IonChip>
                        <IonIcon icon={filter} />
                        <IonLabel>Status: {statusOptions.find(o => o.value === statusFilter)?.label}</IonLabel>
                      </IonChip>
                    )}
                  </div>
                </IonCol>
              </IonRow>
            )}
          </IonGrid>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message ion-padding">
            <IonCard color="danger">
              <IonCardContent className="ion-text-center">
                <IonIcon icon={closeCircle} size="large" />
                <h3>Error Loading Orders</h3>
                <p>{error}</p>
                <IonButton onClick={handleRefresh}>
                  <IonIcon slot="start" icon={refresh} />
                  Try Again
                </IonButton>
              </IonCardContent>
            </IonCard>
          </div>
        )}

        {/* Orders Table */}
        {!error && renderOrdersTable()}

        {/* Pagination */}
        {!error && renderPagination()}

        {/* Export Section */}
        <div className="export-section ion-padding">
          <IonCard>
            <IonCardContent>
              <div className="export-content">
                <IonText>
                  <h3>Export Orders</h3>
                  <p>Export your order data to CSV or Excel format for record keeping or analysis</p>
                </IonText>
                <IonButton onClick={() => setShowExportModal(true)}>
                  <IonIcon slot="start" icon={download} />
                  Export Data
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>

      {/* Modals */}
      {renderOrderDetailsModal()}
      {renderExportModal()}

      {/* Loading */}
      <IonLoading
        isOpen={loading}
        message={refreshing ? 'Refreshing orders...' : 'Loading orders...'}
        duration={0}
      />

      {/* Cancel Order Confirmation Alert */}
      <IonAlert
        isOpen={showCancelConfirm}
        onDidDismiss={() => {
          setShowCancelConfirm(false);
          setCancellingOrderId(null);
        }}
        header="Cancel Order"
        message="Are you sure you want to cancel this order? This action cannot be undone."
        buttons={[
          {
            text: 'No',
            role: 'cancel',
            cssClass: 'secondary'
          },
          {
            text: 'Yes, Cancel',
            handler: handleCancelOrder
          }
        ]}
      />
    </IonPage>
  );
};

export default OrderListPage;
