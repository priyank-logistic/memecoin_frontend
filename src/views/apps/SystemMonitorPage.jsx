'use client'
import React, { useState, useEffect } from 'react'

import { Activity, Clock, Cpu, Database, AlertTriangle, DollarSign, BarChart2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'

import axiosInstance from '@/utils/axiosInstance'

const SystemMonitorPage = () => {
  const [sessionProfit, setSessionProfit] = useState(0)
  const [loading, setLoading] = useState(true)
  const [recentTrades, setRecentTrades] = useState([])
  const [tradesLoading, setTradesLoading] = useState(true)

  const [systemData, setSystemData] = useState({
    cpu: 42,
    ram: 67,
    uptime: '23:45:12',
    activeTokens: 1,
    logs: [
      { id: 1, level: 'error', message: 'RPC connection timeout', timestamp: '13:42:05' },
      { id: 2, level: 'warning', message: 'High latency detected', timestamp: '13:40:12' },
      { id: 3, level: 'info', message: 'Trade executed successfully', timestamp: '13:38:45' },
      { id: 4, level: 'error', message: 'API rate limit exceeded', timestamp: '13:35:22' }
    ]
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch session profit
        const profitResponse = await axiosInstance.get('token/total-profit')

        setSessionProfit(profitResponse.data.profit)
        
        // Fetch recent trades
        const tradesResponse = await axiosInstance.get('trade?page_size=5')

        setRecentTrades(tradesResponse.data.results)
        
      } catch (err) {
        console.error('Error fetching data:', err)
        toast.error(error.response?.data?.message || 'Failed to fetch data', { autoClose: 3000 });
      } finally {
        setLoading(false)
        setTradesLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatDateTime = (isoString) => {
    const date = new Date(isoString)

    
return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const UsageGauge = ({ label, value, icon }) => {
    const gaugeColor = value < 60 ? 'bg-green-500' : value < 80 ? 'bg-yellow-500' : 'bg-red-500'

    return (
      <div className='p-4 rounded-lg' style={{ backgroundColor: 'var(--mui-palette-background-default)' }}>
        <div className='flex items-center justify-between mb-2'>
          <div className='flex items-center'>
            {icon}
            <span className='ml-2' style={{ color: 'var(--mui-palette-text-primary)' }}>
              {label}
            </span>
          </div>
          <span className='text-xl font-bold max-sm:text-[13px]'>{value}%</span>
        </div>
        <div className='w-full rounded-full h-4' style={{ backgroundColor: 'var(--mui-palette-divider)' }}>
          <div className={`h-4 rounded-full ${gaugeColor}`} style={{ width: `${value}%` }}></div>
        </div>
      </div>
    )
  }

  const StatusCard = ({ title, value, icon, text }) => (
    <div
      className='p-4 rounded-lg flex items-center'
      style={{ backgroundColor: 'var(--mui-palette-background-default)' }}
    >
      <div className='p-3 rounded-full bg-blue-900 mr-4'>{icon}</div>
      <div>
        <p className='text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }}>
          {title}
        </p>
        <p className='text-xl font-semibold max-sm:text-[13px]' style={{ color: text }}> {value}</p>
      </div>
    </div>
  )

  const getLogLevelStyle = level => {
    switch (level) {
      case 'error':
        return 'text-red-500'
      case 'warning':
        return 'text-yellow-500'
      case 'info':
      default:
        return 'text-blue-500'
    }
  }

  const getStatusStyle = status => {
    switch (status) {
      case 'open':
        return 'text-yellow-500'
      case 'closed':
        return 'text-green-500'
      default:
        return 'text-gray-500'
    }
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary'></div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div
        className='p-6'
        style={{
          backgroundColor: 'var(--mui-palette-background-paper)',
          color: 'var(--mui-palette-text-primary)',
          border: '1px solid var(--mui-palette-divider)',
          borderRadius: '20px'
        }}
      >
        <header className='mb-8'>
          <h1 className='text-2xl font-bold flex items-center' style={{ color: 'var(--mui-palette-text-primary)' }}>
            <Activity className='mr-2' />
            System Monitor Dashboard
          </h1>
          <p style={{ color: 'var(--mui-palette-text-secondary)' }}>Real-time performance metrics and trading data</p>
        </header>

        {/* Resource Usage Section */}
        <section className='mb-8'>
          <h2 className='text-xl font-bold mb-4'>Resource Usage</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <UsageGauge
              label='CPU Usage'
              style={{ color: 'var(--mui-palette-text-primary)' }}
              value={systemData.cpu}
              icon={<Cpu size={18} className='text-blue-400' />}
            />
            <UsageGauge
              label='RAM Usage'
              value={systemData.ram}
              style={{ color: 'var(--mui-palette-text-primary)' }}
              icon={<Database size={18} className='text-purple-400' />}
            />
          </div>
        </section>

        {/* Status Cards */}
        <section className='mb-8'>
          <h2 className='text-xl font-bold mb-4'>System Status</h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            <StatusCard
              title='Uptime'
              value={systemData.uptime}
              icon={<Clock size={20} className='text-green-400' />}
            />
            <StatusCard
              title='Active Tokens'
              value={systemData.activeTokens}
              icon={<Database size={20} className='text-blue-400' />}
            />
            <StatusCard
              title='Session Profit'
              value={`$${sessionProfit}`}
              icon={<DollarSign size={20} className='text-green-400' />}
              text={sessionProfit >= 0 ? 'var(--mui-palette-success-main)' : 'var(--mui-palette-error-main)'}
            />
          </div>
        </section>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <section>
            <h2 className='text-xl font-bold mb-4 flex items-center'>
              <AlertTriangle size={18} className='mr-2 text-yellow-500' />
              System Logs
            </h2>
            <div
              className='rounded-lg overflow-hidden'
              style={{ backgroundColor: 'var(--mui-palette-background-default)' }}
            >
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead style={{ backgroundColor: 'var(--mui-palette-background-default)' }}>
                    <tr>
                      <th className='py-3 px-4 text-left'>Time</th>
                      <th className='py-3 px-4 text-left'>Level</th>
                      <th className='py-3 px-4 text-left'>Message</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y' style={{ backgroundColor: 'var(--mui-palette-background-default)' }}>
                    {systemData.logs.map(log => (
                      <tr key={log.id} className='hover:bg-gray-750'>
                        <td className='py-3 px-4 ' style={{ color: 'var(--mui-palette-text-secondary)' }}>
                          {log.timestamp}
                        </td>
                        <td className={`py-3 px-4 ${getLogLevelStyle(log.level)} uppercase text-xs font-semibold`}>
                          {log.level}
                        </td>
                        <td className='py-3 px-4'>{log.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Recent Trades Section */}
          <section>
            <h2 className='text-xl font-bold mb-4 flex items-center'>
              <BarChart2 size={18} className='mr-2 text-green-400' />
              Recent Trades
            </h2>
            <div
              className='rounded-lg overflow-hidden'
              style={{ backgroundColor: 'var(--mui-palette-background-default)' }}
            >
              {tradesLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead style={{ backgroundColor: 'var(--mui-palette-background-default)' }}>
                      <tr>
                        <th className='py-3 px-4 text-left'>Time</th>
                        <th className='py-3 px-4 text-left'>Token</th>
                        <th className='py-3 px-4 text-left'>Open Price</th>
                        <th className='py-3 px-4 text-left'>Status</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y' style={{ backgroundColor: 'var(--mui-palette-background-default)' }}>
                      {recentTrades.map((trade, index) => (
                        <tr key={`${trade.created_at}-${index}`} className='hover:bg-gray-750'>
                          <td className='py-3 px-4' style={{ color: 'var(--mui-palette-text-secondary)' }}>
                            {formatDateTime(trade.created_at)}
                          </td>
                          <td className='py-3 px-4 font-medium'>{trade.token_symbol}</td>
                          <td className='py-3 px-4'>${trade.open_price}</td>
                          <td className={`py-3 px-4 font-semibold ${getStatusStyle(trade.status)}`}>
                            {trade.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  )
}

export default SystemMonitorPage
