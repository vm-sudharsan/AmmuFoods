import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Users, Package, AlertTriangle, Store, RefreshCw, ShoppingCart, Calendar, CheckCircle, IndianRupee, Factory } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      if (!loading) setRefreshing(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/dashboard/manufacturing?t=${Date.now()}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        console.error('Failed to fetch dashboard:', response.status);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
            <p className="text-red-600 mb-4">Failed to load dashboard</p>
            <button 
              onClick={fetchDashboardData}
              className="bg-brand-red text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              Retry
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Navbar />
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-serif font-bold text-gray-800">Manufacturing Dashboard</h1>
            <p className="text-gray-600">Real-time production and operations overview</p>
          </div>
          <button 
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="flex items-center gap-2 bg-brand-red text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50"
          >
            <RefreshCw className={refreshing ? 'animate-spin' : ''} size={16} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div 
            onClick={() => navigate('/admin/shops')}
            className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 mb-2">Pending Shop Approvals</p>
                <p className="text-3xl font-bold text-gray-800">{dashboardData.pendingShopApprovals || 0}</p>
                <p className="text-xs text-yellow-600 mt-1">Requires attention</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Users className="text-yellow-600" size={28} />
              </div>
            </div>
          </div>

          <div 
            onClick={() => navigate('/admin/orders')}
            className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 mb-2">Orders to Pack</p>
                <p className="text-3xl font-bold text-gray-800">{dashboardData.ordersToPack || 0}</p>
                <p className="text-xs text-orange-600 mt-1">Ready for packing</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Package className="text-orange-600" size={28} />
              </div>
            </div>
          </div>

          <div 
            onClick={() => navigate('/admin/inventory')}
            className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 mb-2">Low Stock Items</p>
                <p className="text-3xl font-bold text-gray-800">{dashboardData.lowStockItems || 0}</p>
                <p className="text-xs text-red-600 mt-1">{dashboardData.criticalStockItems || 0} critical</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="text-red-600" size={28} />
              </div>
            </div>
          </div>

          <div 
            onClick={() => navigate('/admin/shops')}
            className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 mb-2">Active Partner Shops</p>
                <p className="text-3xl font-bold text-gray-800">{dashboardData.activeShops || 0}</p>
                <p className="text-xs text-green-600 mt-1">Currently active</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Store className="text-green-600" size={28} />
              </div>
            </div>
          </div>
        </div>

        {dashboardData.manufacturingRequirements && dashboardData.manufacturingRequirements.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Factory className="text-brand-red" size={24} />
                <h2 className="text-xl font-bold text-gray-800">Manufacturing Requirements</h2>
              </div>
              <button 
                onClick={() => navigate('/admin/orders')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View Packing →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Product</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Current Stock</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Total Ordered</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">To Manufacture</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.manufacturingRequirements.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-800">{item.productName}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-semibold ${item.currentStock < 10 ? 'text-red-600' : item.currentStock < 20 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {item.currentStock} {item.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-blue-600">
                        {item.totalOrdered} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-bold text-lg ${item.toManufacture > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {item.toManufacture > 0 ? `${item.toManufacture} ${item.unit}` : '✓ Sufficient'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.toManufacture > 0 ? (
                          <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                            Manufacture Needed
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                            Stock Available
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 mb-2">Today's Orders</p>
                <p className="text-2xl font-bold text-gray-800">{dashboardData.todaysOrders || 0}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <ShoppingCart className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div 
            onClick={() => navigate('/admin/events')}
            className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 mb-2">Pending Events</p>
                <p className="text-2xl font-bold text-gray-800">{dashboardData.pendingEvents || 0}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Calendar className="text-purple-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 mb-2">Completed Today</p>
                <p className="text-2xl font-bold text-gray-800">{dashboardData.completedToday || 0}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 mb-2">Today's Revenue</p>
                <p className="text-2xl font-bold text-gray-800">
                  ₹{dashboardData.todaysRevenue ? dashboardData.todaysRevenue.toLocaleString('en-IN') : 0}
                </p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-full">
                <IndianRupee className="text-emerald-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {dashboardData.inventoryOverview && dashboardData.inventoryOverview.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Package className="text-brand-red" size={24} />
                <h2 className="text-xl font-bold text-gray-800">Inventory Overview</h2>
              </div>
              <button 
                onClick={() => navigate('/admin/inventory')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Manage Inventory →
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.inventoryOverview.map((item, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    item.currentStock < 5 ? 'border-red-200 bg-red-50' :
                    item.currentStock < 10 ? 'border-yellow-200 bg-yellow-50' :
                    'border-green-200 bg-green-50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      item.currentStock < 5 ? 'bg-red-100 text-red-800' :
                      item.currentStock < 10 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {item.currentStock} {item.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Min Stock: {item.minStock}</span>
                    <span className={
                      item.currentStock < 5 ? 'text-red-600 font-semibold' :
                      item.currentStock < 10 ? 'text-yellow-600 font-semibold' :
                      'text-green-600'
                    }>
                      {item.currentStock < 5 ? 'Critical!' :
                       item.currentStock < 10 ? 'Low Stock' :
                       'Good Stock'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
