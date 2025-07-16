'use client'
import React, { useState, useEffect } from 'react'

import { AlertTriangle, Pause, Play } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'

import axiosInstance from '@/utils/axiosInstance'

const ManualControlView = () => {
  const [botActive, setBotActive] = useState(false)
  const [activeTrades, setActiveTrades] = useState([])
  const [loading, setLoading] = useState(true)

  const [pagination, setPagination] = useState({
    count: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 5
  })

  // Fetch bot status
  const fetchBotStatus = async () => {
    try {
      const response = await axiosInstance.get('bot-control/status')

      setBotActive(response.data.status)
    } catch (error) {
      toast.error('Failed to fetch bot status', { autoClose: 3000 })
    }
  }

  // Fetch active trades
  const fetchActiveTrades = async (page = 1, pageSize = pagination.pageSize) => {
    try {
      setLoading(true)
      const response = await axiosInstance.get(`/trade?status=open&page=${page}&page_size=${pageSize}`)
      
      setActiveTrades(response.data.results)
      setPagination({
        count: response.data.count,
        totalPages: response.data.total_pages,
        currentPage: response.data.current_page,
        pageSize
      })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch trades', { autoClose: 3000 })
    } finally {
      setLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchBotStatus()
    fetchActiveTrades()
  }, [])

  // Toggle bot status
  const toggleBotStatus = async () => {
    try {
      const endpoint = botActive ? '/bot-control/stop-bot/' : '/bot-control/start-bot/'

      await axiosInstance.post(endpoint)
      setBotActive(!botActive)
      toast.success(`Bot ${botActive ? 'stopped' : 'started'} successfully!`, { autoClose: 3000 })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to toggle bot status', { autoClose: 3000 })
    }
  }

  // Emergency stop
  const emergencyStop = async () => {
    if (!window.confirm('WARNING: This will close ALL active trades and stop the bot. Proceed?')) return
    
    try {
      setLoading(true)
      await axiosInstance.post('/bot-control/emergency-stop/')
      toast.success('Emergency selling started!', { autoClose: 3000 })
      await fetchBotStatus()
      await fetchActiveTrades(1)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Emergency stop failed', { autoClose: 3000 })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelTrade = async(wallet_address) => {
    try {
      setLoading(true)
      await axiosInstance.post('/trade/close-trade/', {
        wallet_address: wallet_address
      });
  
      setActiveTrades(activeTrades.filter(trade => trade.wallet_address !== wallet_address));
  
      toast.success('Trade closing started', { autoClose: 3000 });
    } catch (error) {
      console.error('Error canceling trade:', error);
      toast.error(error.response?.data?.message || 'Error canceling trade', { autoClose: 3000 });
    }
    finally{
      setLoading(false)
    }
   
  }

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      fetchActiveTrades(newPage)
    }
  }

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value)

    fetchActiveTrades(1, newSize)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="p-6 rounded-lg shadow bg-[var(--mui-palette-background-paper)]" style={{ borderRadius: '20px' }}>
        <h2 className="text-2xl font-bold mb-6">Manual Controls</h2>

        {/* Bot Control */}
        <div className="mb-6">
          <button
            onClick={toggleBotStatus}
            disabled={loading}
            className={`flex items-center px-4 py-2 rounded-md text-white font-medium ${
              botActive ? 'bg-primary hover:bg-primaryDark' : 'bg-red-500 hover:bg-red-600'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {botActive ? (
              <>
                <Pause className="mr-2" size={20} />
                Stop Bot
              </>
            ) : (
              <>
                <Play className="mr-2" size={20} />
                Start Bot
              </>
            )}
          </button>
        </div>

        {/* Active Trades */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Active Trades</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--mui-palette-text-secondary)]">Rows per page:</span>
              <select
                value={pagination.pageSize}
                onChange={handlePageSizeChange}
                disabled={loading}
                className="text-sm rounded px-2 py-1 bg-[var(--mui-palette-background-default)]"
              >
                {[5, 10, 20, 50].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : activeTrades.length === 0 ? (
            <div className="italic">No active trades</div>
          ) : (
            <>
              <div className="overflow-x-auto mb-4">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-left">
                      <th className="px-4 py-2 font-medium">Symbol</th>
                      <th className="px-4 py-2 font-medium">Entry Price</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">Created At</th>
                      <th className="px-4 py-2 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTrades.map(trade => (
                      <tr key={`${trade.created_at}-${trade.token_symbol}`} className="bg-[var(--mui-palette-background-default)]">
                        <td className="px-4 py-3">{trade.token_symbol}</td>
                        <td className="px-4 py-3">${trade.open_price}</td>
                        <td className="px-4 py-3 capitalize">{trade.status}</td>
                        <td className="px-4 py-3">{new Date(trade.created_at).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleCancelTrade(trade.wallet_address)}
                            disabled={loading}
                            className='px-3 py-1 rounded-lg text-xs hover:opacity-80 transition-opacity'
                            style={{
                              backgroundColor: 'var(--mui-palette-error-light)',
                              color: 'black'
                            }}
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-[var(--mui-palette-text-secondary)]">
                  Showing {(pagination.currentPage - 1) * pagination.pageSize + 1}-
                  {Math.min(pagination.currentPage * pagination.pageSize, pagination.count)} of {pagination.count}
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1 || loading}
                    className="px-3 py-1 rounded-md border text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages || loading}
                    className="px-3 py-1 rounded-md border text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Emergency Stop */}
        <div className="mt-8">
          <button
            onClick={emergencyStop}
            disabled={loading || activeTrades.length === 0}
            className={`flex items-center px-6 py-3 bg-primary text-white font-medium rounded-md shadow-sm ${
              (loading || activeTrades.length === 0) ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
            }`}
          >
            <AlertTriangle className="mr-2" size={20} />
            EMERGENCY STOP
            <div className="ml-2 text-xs bg-[var(--mui-palette-error-dark)] px-2 py-1 rounded">
              Sells Everything
            </div>
          </button>
          <p className="text-xs text-[var(--mui-palette-text-secondary)] mt-2">
            Warning: This will immediately close all active trades and stop the bot.
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default ManualControlView
