'use client'
import React, { useState, useEffect, useRef } from 'react'

import { useParams, useRouter } from 'next/navigation'

import { Clock, ExternalLink, Copy, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'

import axiosInstance from '@/utils/axiosInstance'

const defaultTokenData = {
  name: '',
  symbol: '',
  address: '',
  currentPrice: 0,
  averagePrice: 0,
  priceChange: 0,
  priceChange7d: 0,
  volumeSOL: 0,
  holder_count: 0,
  volumeUSD: 0,
  liquidity: 0,
  holders: 0,
  marketCap: 0,
  allTimeHigh: 0,
  allTimeLow: 0,
  priceHistory: Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    price: 70000 + Math.sin(i / 3) * 30000 + Math.random() * 5000,
    volume: Math.floor(Math.random() * 5000000) + 1000000
  })),
  socials: {
    website: null,
    x: null,
    telegram: null
  },
  description: ''
}

const getTimeSinceLaunch = launchTime => {
  if (!launchTime) return 'N/A'

  const launch = new Date(launchTime)
  const now = new Date()
  const diffTime = Math.abs(now - launch)

  const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365))
  const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30))
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60))

  if (diffYears > 0) return `${diffYears}y ago`
  if (diffMonths > 0) return `${diffMonths}mo ago`
  if (diffDays > 0) return `${diffDays}d ago`
  if (diffHours > 0) return `${diffHours}h ago`
  if (diffMinutes > 0) return `${diffMinutes}m ago`

  return 'Just now'
}

const formatNumber = (num, decimals = 2) => {
  if (!num) return '$0.00'
  if (num >= 1e9) return `$${(num / 1e9).toFixed(decimals)}B`
  if (num >= 1e6) return `$${(num / 1e6).toFixed(decimals)}M`
  if (num >= 1e3) return `$${(num / 1e3).toFixed(decimals)}K`

  return `$${num.toFixed(decimals)}`
}

const SkeletonLoader = ({
  height = 'h-5',
  width = 'w-full',
  rounded = 'rounded-md',
  color = 'bg-gray-200 dark:bg-gray-700',
  animation = 'animate-pulse',
  className = '',
  count = 1,
  spacing = 'space-y-2'
}) => {
  const skeletons = Array.from({ length: count }, (_, index) => (
    <div key={index} className={`${animation} ${color} ${height} ${width} ${rounded} ${className}`} />
  ))

  return <div className={`w-full ${count > 1 ? spacing : ''}`}>{skeletons}</div>
}

const LiveTokenOverview = () => {
  const { id } = useParams()
  const router = useRouter()
  const [token, setToken] = useState(defaultTokenData)

  const [loadingStates, setLoadingStates] = useState({
    tokenData: true,
    activeTrades: true,
    tradeHistory: true,
    logs: true
  })

  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const [activeTrades, setActiveTrades] = useState({
    data: [],
    pagination: {
      count: 0,
      totalPages: 1,
      currentPage: 1,
      pageSize: 5
    }
  })

  const [tradeHistory, setTradeHistory] = useState({
    data: [],
    pagination: {
      count: 0,
      totalPages: 1,
      currentPage: 1,
      pageSize: 5
    }
  })

  const [logs, setLogs] = useState([])
  const [fullscreenLogType, setFullscreenLogType] = useState(null)

  const ws = useRef(null)
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false)

  const [tokenPriceWs, setTokenPriceWs] = useState({
    price: null,
    volumeSOL: null,
    holder_count: null,
    volumeUSD: null,
    marketCap: null,
    allTimeHigh: null,
    allTimeLow: null,
    averagePrice: null
  })


  const updateLoadingState = (section, isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      [section]: isLoading
    }))
  }

  useEffect(() => {
    const connectWebSocket = () => {
      ws.current = new WebSocket(`wss://api.dev.alhpaorbit.com/ws/bot-log/${id}/`)

      ws.current.onopen = () => {
        console.log('WebSocket connected')
        setIsWebSocketConnected(true)
      }

      ws.current.onmessage = event => {
        try {
          const newLog = JSON.parse(event.data)

          if (newLog.info_tag === 'error') {
            toast.error(
              <div>
                <div className='font-bold'>{newLog.log_message}</div>
                {newLog.wallet_address && (
                  <div className='text-xs mt-1'>
                    Wallet: {newLog.wallet_address.slice(0, 6)}...{newLog.wallet_address.slice(-4)}
                  </div>
                )}
                {newLog.symbol && <div className='text-xs'>Token: {newLog.symbol}</div>}
                {newLog.stage && <div className='text-xs'>Stage: {newLog.stage}</div>}
              </div>,
              {
                autoClose: 5000,
                closeButton: true,
                position: 'top-right',
                className: 'bg-red-50 border-l-4 border-red-500',
                bodyClassName: 'text-red-800'
              }
            )
          }

          setLogs(prevLogs => {
            const updatedLogs = [newLog, ...prevLogs]

            if (updatedLogs.length > 100) {
              return updatedLogs.slice(0, 100)
            }

            return updatedLogs
          })
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.current.onerror = error => {
        console.warn('WebSocket temporary error (non-blocking):', error)
        setIsWebSocketConnected(false)
      }

      ws.current.onclose = () => {
        console.log('WebSocket disconnected')
        setIsWebSocketConnected(false)

        setTimeout(connectWebSocket, 5000)
      }
    }

    connectWebSocket()

    return () => {
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [])

  useEffect(() => {
    if (!id) return

    const connectPriceWebSocket = () => {
      const priceWs = new WebSocket(`wss://api.dev.alhpaorbit.com/ws/token-price/${id}/`)

      priceWs.onopen = () => {
        console.log('Price WebSocket connected')
      }

      priceWs.onmessage = event => {
        try {
          const priceData = JSON.parse(event.data)

          setTokenPriceWs({
            price: parseFloat(priceData.token_price),
            volumeSOL: parseFloat(priceData.volume_sol),
            holder_count: parseFloat(priceData.holder_count),
            volumeUSD: parseFloat(priceData.volume_dollar),
            marketCap: parseFloat(priceData.market_cap),
            allTimeHigh: parseFloat(priceData.all_time_high),
            allTimeLow: parseFloat(priceData.all_time_low),
            averagePrice: parseFloat(priceData.average_price)
          })
        } catch (error) {
          console.error('Error parsing price WebSocket message:', error)
        }
      }

      priceWs.onerror = error => {
        console.warn('Price WebSocket error:', error)
      }

      priceWs.onclose = () => {
        console.log('Price WebSocket disconnected')
        setTimeout(connectPriceWebSocket, 5000)
      }

      return priceWs
    }

    const priceWs = connectPriceWebSocket()

    return () => {
      if (priceWs) {
        priceWs.close()
      }
    }
  }, [id])

  const fetchTradeHistory = async (symbol, page = 1, pageSize = 5) => {
    try {
      updateLoadingState('tradeHistory', true)

      const response = await axiosInstance.get(
        `/trade?symbol=${symbol}&status=closed&page=${page}&page_size=${pageSize}`
      )

      if (response.data) {
        setTradeHistory({
          data: response.data.results,
          pagination: {
            count: response.data.count,
            totalPages: response.data.total_pages,
            currentPage: response.data.current_page,
            pageSize: pageSize
          }
        })
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to fetch trade history', { autoClose: 3000 })
      console.error('Error fetching trade history:', error)
    } finally {
      updateLoadingState('tradeHistory', false)
    }
  }

  const fetchActiveTrades = async (symbol, page = 1, pageSize = 5) => {
    try {
      updateLoadingState('activeTrades', true)
      const response = await axiosInstance.get(`/trade?symbol=${symbol}&status=open&page=${page}&page_size=${pageSize}`)

      if (response.data) {
        setActiveTrades({
          data: response.data.results,
          pagination: {
            count: response.data.count,
            totalPages: response.data.total_pages,
            currentPage: response.data.current_page,
            pageSize: pageSize
          }
        })
      }
    } catch (error) {
      toast.error('Failed to fetch active trades', { autoClose: 3000 })
      console.error('Error fetching active trades:', error)
    } finally {
      updateLoadingState('activeTrades', false)
    }
  }

  const fetchLogs = async id => {
    try {
      updateLoadingState('logs', true)
      const response = await axiosInstance.get(`/bot-control/log/${id}`)

      if (response.data) {
        setLogs(response.data)
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
      toast.error(error.response?.data?.error || 'Failed to fetch logs', { autoClose: 3000 })
    } finally {
      updateLoadingState('logs', false)
    }
  }

  const handleActiveTradesPageChange = newPage => {
    if (newPage > 0 && newPage <= activeTrades.pagination.totalPages) {
      fetchActiveTrades(token.symbol, newPage, activeTrades.pagination.pageSize)
    }
  }

  const handleActiveTradesPageSizeChange = e => {
    const newSize = parseInt(e.target.value)

    fetchActiveTrades(token.symbol, 1, newSize)
  }

  const handleTradeHistoryPageChange = newPage => {
    if (newPage > 0 && newPage <= tradeHistory.pagination.totalPages) {
      fetchTradeHistory(token.symbol, newPage, tradeHistory.pagination.pageSize)
    }
  }

  const handleTradeHistoryPageSizeChange = e => {
    const newSize = parseInt(e.target.value)

    fetchTradeHistory(token.symbol, 1, newSize)
  }

  const cancelTrade = async wallet_address => {
    try {
      await axiosInstance.post('/trade/close-trade/', {
        wallet_address: wallet_address
      })

      setActiveTrades(prev => ({
        ...prev,
        data: prev.data.filter(trade => trade.wallet_address !== wallet_address)
      }))

      toast.success('Trade closing started', { autoClose: 3000 })
    } catch (error) {
      console.error('Error canceling trade:', error)
      toast.error(error.response?.data?.message || 'Error canceling trade', { autoClose: 3000 })
    }
  }

  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        updateLoadingState('tokenData', true)
        const response = await axiosInstance.get(`/token/${id}`)

        if (response.data.success) {
          const tokenData = response.data.data

          setToken({
            ...defaultTokenData,
            name: tokenData.name,
            symbol: tokenData.symbol,
            description: tokenData.description,
            socials: {
              website: tokenData.website,
              x: tokenData.x,
              telegram: tokenData.telegram
            },
            created_at: tokenData.created_at,
            logo: tokenData.logo,
            mint_address: tokenData.mint_address,
            currentPrice: tokenData.current_price || 0,
            averagePrice: tokenData.average_price || 0,
            marketCap: tokenData.market_cap || 0,
            allTimeHigh: tokenData.highest_price || 0,
            allTimeLow: tokenData.lowest_price || 0,
            volumeSOL: tokenData.volume_sol || 0,
            holder_count: tokenData.holder_count || 0,
            volumeUSD: tokenData.volume_dollar || 0
          })

          await Promise.all([fetchLogs(id), fetchActiveTrades(tokenData.symbol), fetchTradeHistory(tokenData.symbol)])
        } else {
          setError('Failed to fetch token data')
        }
      } catch (err) {
        console.error('Error fetching token data:', err)
        setError(err.message || 'Error fetching token data')

        if (err.response?.status === 404) {
          router.push('/404')
        }
      } finally {
        updateLoadingState('tokenData', false)
      }
    }

    fetchTokenData()
  }, [id, router])

  const copyToClipboard = text => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (error) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className='text-red-500'>{error}</div>
      </div>
    )
  }

  const getCurrentPrice = () => (tokenPriceWs.price !== null ? tokenPriceWs.price : token.currentPrice)
  const getAveragePrice = () => (tokenPriceWs.averagePrice !== null ? tokenPriceWs.averagePrice : token.averagePrice)
  const getVolumeSOL = () => (tokenPriceWs.volumeSOL !== null ? tokenPriceWs.volumeSOL : token.volumeSOL)
  const getHolderCount = () => (tokenPriceWs.holder_count !== null ? tokenPriceWs.holder_count : token.holder_count)
  const getVolumeUSD = () => (tokenPriceWs.volumeUSD !== null ? tokenPriceWs.volumeUSD : token.volumeUSD)
  const getMarketCap = () => (tokenPriceWs.marketCap !== null ? tokenPriceWs.marketCap : token.marketCap)

  const getAllTimeHigh = () => (tokenPriceWs.allTimeHigh !== null ? tokenPriceWs.allTimeHigh : token.allTimeHigh)
  const getAllTimeLow = () => (tokenPriceWs.allTimeLow !== null ? tokenPriceWs.allTimeLow : token.allTimeLow)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className='p-6 rounded-2xl shadow-xl'
      style={{ backgroundColor: 'var(--mui-palette-background-paper)', border: '1px solid var(--mui-palette-divider)' }}
    >
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4'>
        {loadingStates.tokenData ? (
          <SkeletonLoader height='h-10' width='w-full' />
        ) : (
          <div className='flex items-start gap-4 w-full md:w-auto'>
            <div
              className='w-14 h-14 rounded-xl flex items-center justify-center shadow-sm'
              style={{ backgroundColor: 'var(--mui-palette-primary-light)' }}
            >
              {token.logo ? (
                <img src={token.logo} alt={token.name} className='w-full h-full rounded-xl object-cover' />
              ) : (
                <span className='text-2xl font-bold' style={{ color: 'var(--mui-palette-text-primary)' }}>
                  {token.symbol?.charAt(0) || 'T'}
                </span>
              )}
            </div>

            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2'>
                <h2 className='text-2xl font-bold truncate' style={{ color: 'var(--mui-palette-text-primary)' }}>
                  {token.name} {token.symbol && <span className='font-normal opacity-70'>({token.symbol})</span>}
                </h2>
              </div>

              <div className='flex flex-wrap items-center gap-2 mt-2'>
                {token.mint_address && (
                  <button
                    onClick={() => copyToClipboard(token.mint_address)}
                    className='flex items-center text-sm hover:opacity-80 transition-opacity px-2 py-1 rounded-lg'
                    style={{ backgroundColor: 'var(--mui-palette-background-default)' }}
                  >
                    <ExternalLink size={14} className='mr-1' style={{ color: 'var(--mui-palette-text-secondary)' }} />
                    <span style={{ color: 'var(--mui-palette-text-primary)' }}>
                      {token.mint_address.substring(0, 6)}...
                      {token.mint_address.substring(token.mint_address.length - 4)}
                    </span>
                    <Copy size={12} className='ml-1' style={{ color: 'var(--mui-palette-text-secondary)' }} />
                  </button>
                )}

                {copied && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className='text-xs px-2 py-1 rounded'
                    style={{
                      backgroundColor: 'var(--mui-palette-success-light)',
                      color: 'var(--mui-palette-error-dark)'
                    }}
                  >
                    Copied!
                  </motion.div>
                )}

                {Object.entries(token.socials).map(
                  ([platform, url]) =>
                    url && (
                      <a
                        key={platform}
                        href={url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='p-1.5 rounded-full hover:opacity-80 transition-opacity'
                        style={{ backgroundColor: 'var(--mui-palette-background-default)' }}
                      >
                        <span className='text-xs capitalize' style={{ color: 'var(--mui-palette-text-secondary)' }}>
                          {platform}
                        </span>
                      </a>
                    )
                )}
              </div>
            </div>
          </div>
        )}
        <div className='flex items-center gap-1'>
          <span className='text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }}>
            Current Price
            {tokenPriceWs.price !== null ? (
              <span className='text-green-500 text-xs ml-1'>• Live</span>
            ) : (
              <span className='text-gray-500 text-xs ml-1'>• API</span>
            )}
          </span>
        </div>

        {!loadingStates.tokenData && (
          <div className='flex items-center gap-3'>
            <div
              className='flex items-center gap-2 px-3 py-2 rounded-lg'
              style={{ backgroundColor: 'var(--mui-palette-background-default)' }}
            >
              <Clock size={16} style={{ color: 'var(--mui-palette-text-secondary)' }} />
              <span className='text-sm' style={{ color: 'var(--mui-palette-text-primary)' }}>
                Created {getTimeSinceLaunch(token.created_at)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
        {loadingStates.tokenData ? (
          <SkeletonLoader height='h-6' width='w-32' />
        ) : (
          <>
            <div
              className='p-5 rounded-xl relative flex justify-between items-start'
              style={{ backgroundColor: 'var(--mui-palette-background-default)' }}
            >
              <div className='w-full min-w-0'>
                <p className='text-sm lg:text-md mb-1' style={{ color: 'var(--mui-palette-text-secondary)' }}>
                  Current Price
                </p>
                <p
                  title={`$${Number(getCurrentPrice()).toFixed(15)}`}
                  className='text-xl lg:text-3xl font-bold truncate md:overflow-visible md:whitespace-normal'
                  style={{
                    color: 'var(--mui-palette-text-primary)',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}
                >
                  ${Number(getCurrentPrice()).toFixed(15)}
                </p>
              </div>
            </div>

            <div className='grid grid-cols-3 gap-4'>
              <div className='p-5 rounded-xl' style={{ backgroundColor: 'var(--mui-palette-background-default)' }}>
                <p className='text-sm mb-1' style={{ color: 'var(--mui-palette-text-secondary)' }}>
                  Market Cap
                </p>
                <p className='text-xl lg:text-2xl font-bold' style={{ color: 'var(--mui-palette-text-primary)' }}>
                  {formatNumber(getMarketCap())}
                </p>
              </div>

              <div
                className='p-5 rounded-xl min-w-0'
                style={{ backgroundColor: 'var(--mui-palette-background-default)' }}
              >
                <p className='text-sm mb-1' style={{ color: 'var(--mui-palette-text-secondary)' }}>
                  Volume
                </p>
                <p
                  title={`$${Number(getVolumeUSD()).toFixed(15)}`}
                  className='text-xl lg:text-2xl font-bold truncate md:whitespace-normal'
                  style={{ color: 'var(--mui-palette-text-primary)' }}
                >
                  ${Number(getVolumeUSD()).toFixed(15)}
                </p>
                <div
                  className='flex items-center gap-1 mt-1 text-xs truncate'
                  style={{ color: 'var(--mui-palette-text-secondary)' }}
                >
                  {Number(getVolumeSOL()).toFixed(10)} SOL
                </div>
              </div>

              <div className='p-5 rounded-xl' style={{ backgroundColor: 'var(--mui-palette-background-default)' }}>
                <p className='text-sm mb-1' style={{ color: 'var(--mui-palette-text-secondary)' }}>
                  holder count
                </p>
                <p className='text-xl lg:text-2xl ml-4 font-bold' style={{ color: 'var(--mui-palette-text-primary)' }}>
                  {getHolderCount()}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className='p-5 rounded-xl mb-6' style={{ backgroundColor: 'var(--mui-palette-background-default)' }}>
        <div className='flex justify-between items-center mb-6'>
          <div></div>

          <div className='flex items-center gap-2'>
            <p className='text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }}>
              Average Price:
            </p>
            <p className='text-lg font-medium truncate' style={{ color: 'var(--mui-palette-text-primary)' }}>
              ${Number(getAveragePrice()).toFixed(15)}
            </p>
          </div>
        </div>

        <iframe
          width='100%'
          height='600'
          src={`https://birdeye.so/tv-widget/${token.mint_address}?chain=solana&viewMode=pair&chartInterval=5&chartType=CANDLE&chartLeftToolbar=show&theme=dark`}
          frameborder='0'
          allowfullscreen
        ></iframe>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
        <div className='p-5 rounded-xl' style={{ backgroundColor: 'var(--mui-palette-background-default)' }}>
          <h3 className='font-semibold text-lg mb-4' style={{ color: 'var(--mui-palette-text-primary)' }}>
            Key Metrics
          </h3>
          {loadingStates.tokenData ? (
            <SkeletonLoader height='h-6' width='w-32' />
          ) : (
            <div className='grid grid-cols-2 gap-4 min-w-0'>
              <div>
                <p className='text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }}>
                  All Time High
                </p>
                <p className='text-lg font-medium truncate' style={{ color: 'var(--mui-palette-text-primary)' }}>
                  ${Number(getAllTimeHigh()).toFixed(15)}
                </p>
              </div>
              <div>
                <p className='text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }}>
                  All Time Low
                </p>
                <p className='text-lg font-medium truncate' style={{ color: 'var(--mui-palette-text-primary)' }}>
                  ${Number(getAllTimeLow()).toFixed(15)}
                </p>
              </div>
              <div>
                <p className='text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }}>
                  Total Supply
                </p>
                <p className='text-lg font-medium' style={{ color: 'var(--mui-palette-text-primary)' }}>
                  1 Billion
                </p>
              </div>
            </div>
          )}
        </div>

        <div className='p-5 rounded-xl' style={{ backgroundColor: 'var(--mui-palette-background-default)' }}>
          <div className='flex justify-between items-center mb-4'>
            <h3 className='font-semibold text-lg' style={{ color: 'var(--mui-palette-text-primary)' }}>
              About {token.name}
            </h3>
          </div>
          {loadingStates.tokenData ? (
            <SkeletonLoader height='h-6' width='w-32' />
          ) : (
            <p className='text-sm mb-4' style={{ color: 'var(--mui-palette-text-secondary)' }}>
              {token.description}
            </p>
          )}
        </div>
      </div>

      <div className='p-5 rounded-xl mb-6' style={{ backgroundColor: 'var(--mui-palette-background-default)' }}>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='font-semibold text-lg' style={{ color: 'var(--mui-palette-text-primary)' }}>
            Active Trades
          </h3>
          <div className='flex items-center gap-2'>
            <span className='text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }}>
              {activeTrades.pagination.count} active
            </span>
          </div>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b' style={{ borderColor: 'var(--mui-palette-divider)' }}>
                {['Time', 'Open Price', 'Total SOL', 'Action'].map(header => (
                  <th
                    key={header}
                    className='py-3 text-sm font-medium text-center'
                    style={{ color: 'var(--mui-palette-text-secondary)' }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingStates.tokenData || loadingStates.activeTrades ? (
                <tr>
                  <td colSpan={4} className='py-10 text-center'>
                    <SkeletonLoader height='h-6' width='w-32' />
                  </td>
                </tr>
              ) : (
                activeTrades.data.map(trade => (
                  <tr
                    key={trade.created_at}
                    className='border-b hover:bg-black/5 dark:hover:bg-white/5 transition-colors'
                    style={{ borderColor: 'var(--mui-palette-divider)' }}
                  >
                    <td className='p-3 text-sm text-center' style={{ color: 'var(--mui-palette-text-secondary)' }}>
                      {new Date(trade.created_at).toLocaleString()}
                    </td>
                    <td className='p-3 text-sm text-center' style={{ color: 'var(--mui-palette-text-primary)' }}>
                      {parseFloat(trade.open_price).toFixed(20)}
                    </td>
                    <td className='p-3 text-sm text-center' style={{ color: 'var(--mui-palette-text-primary)' }}>
                      {parseFloat(trade.total_sol).toFixed(20)}
                    </td>
                    <td className='p-3 text-sm text-center'>
                      <button
                        onClick={() => cancelTrade(trade.wallet_address)}
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
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className='flex justify-between items-center mt-4'>
          <div className='flex items-center gap-2'>
            <span className='text-sm text-muted-foreground'>Trades per page:</span>
            <select
              value={activeTrades.pagination.pageSize}
              onChange={handleActiveTradesPageSizeChange}
              className='text-sm border rounded px-2 py-1 bg-[var(--mui-palette-background-paper)]'
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>

          <div className='flex items-center gap-2'>
            <button
              onClick={() => handleActiveTradesPageChange(activeTrades.pagination.currentPage - 1)}
              disabled={activeTrades.pagination.currentPage === 1}
              className='p-1 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <ChevronLeft size={18} />
            </button>

            <span className='text-sm text-muted-foreground'>
              Page {activeTrades.pagination.currentPage} of {activeTrades.pagination.totalPages}
            </span>

            <button
              onClick={() => handleActiveTradesPageChange(activeTrades.pagination.currentPage + 1)}
              disabled={activeTrades.pagination.currentPage === activeTrades.pagination.totalPages}
              className='p-1 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {activeTrades.data.length === 0 && !loadingStates.activeTrades && (
          <div className='py-8 text-center'>
            <p className='text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }}>
              No active trades
            </p>
          </div>
        )}
      </div>

      <div className='mb-6'>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className='p-6 rounded-xl border border-[var(--mui-palette-divider)] bg-[var(--mui-palette-background-default)] shadow-lg'
        >
          <div className='flex justify-between items-center mb-6'>
            <div className='flex items-center space-x-3'>
              <div className='relative'>
                <div
                  className={`w-3 h-3 rounded-full ${isWebSocketConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
                ></div>
                <div
                  className={`absolute inset-0 rounded-full ${isWebSocketConnected ? 'bg-green-500/30 animate-ping' : 'bg-red-500/30'}`}
                ></div>
              </div>
              <h3 className='font-semibold text-xl' style={{ color: 'var(--mui-palette-text-primary)' }}>
                Live Logs {!isWebSocketConnected && '(Reconnecting...)'}
              </h3>
            </div>
            <button
              onClick={() => setFullscreenLogType('live')}
              className='text-sm px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white hover:shadow-lg transition-all flex items-center space-x-2'
            >
              <span>View All Logs</span>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-4 w-4'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4'
                />
              </svg>
            </button>
          </div>

          {loadingStates.logs ? (
            <SkeletonLoader height='h-6' width='w-32' />
          ) : logs.length > 0 ? (
            <>
              <div className='space-y-4 max-h-[400px] overflow-y-auto pr-3'>
                {logs.slice(0, 3).map((log, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border ${
                      log.info_tag === 'error'
                        ? 'border-red-500/30 bg-gradient-to-br from-red-500/5 to-red-900/5'
                        : log.info_tag === 'warning'
                          ? 'border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-yellow-900/5'
                          : 'border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-blue-900/5'
                    }`}
                  >
                    <div className='flex justify-between items-start mb-2'>
                      <div className='flex-1'>
                        <p className='text-sm font-medium text-[var(--mui-palette-text-primary)]'>{log.log_message}</p>
                      </div>
                      <span
                        className={`ml-3 px-2.5 py-1 rounded-full text-xs font-medium ${
                          log.info_tag === 'error'
                            ? 'bg-red-500/90 text-white'
                            : log.info_tag === 'warning'
                              ? 'bg-yellow-500/90 text-white'
                              : 'bg-blue-500/90 text-white'
                        }`}
                      >
                        {log.info_tag}
                      </span>
                    </div>

                    <div className='flex flex-wrap gap-2 mt-2 text-xs'>
                      {log.wallet_address && (
                        <div className='flex items-center text-[var(--mui-palette-text-secondary)] bg-[var(--mui-palette-background-paper)] px-2 py-1 rounded-lg border border-[var(--mui-palette-divider)]'>
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            className='h-3.5 w-3.5 mr-1.5 text-blue-500'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z'
                            />
                          </svg>
                          {log.wallet_address?.slice(0, 6)}...{log.wallet_address?.slice(-4)}
                        </div>
                      )}

                      {log.stage && (
                        <div className='flex items-center text-[var(--mui-palette-text-secondary)] bg-[var(--mui-palette-background-paper)] px-2 py-1 rounded-lg border border-[var(--mui-palette-divider)]'>
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            className='h-3.5 w-3.5 mr-1.5 text-green-500'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                          >
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                          </svg>
                          Stage: {log.stage}
                        </div>
                      )}
                    </div>
                    <div className='mt-3 text-right'>
                      <span className='text-xs text-[var(--mui-palette-text-secondary)]'>
                        {new Date(log.created_at || Date.now()).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className='mt-4 pt-4 border-t border-[var(--mui-palette-divider)]'>
                <p className='text-xs text-[var(--mui-palette-text-secondary)] text-center'>
                  Showing {Math.min(3, logs.length)} of {logs.length} Logs
                </p>
              </div>
            </>
          ) : (
            <div className='flex flex-col items-center justify-center py-12 text-center'>
              <svg
                className='w-16 h-16 text-[var(--mui-palette-text-secondary)] mb-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={1.5}
                  d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                />
              </svg>
              <h4 className='text-lg font-medium text-[var(--mui-palette-text-primary)] mb-1'>No logs found</h4>
              <p className='text-sm text-[var(--mui-palette-text-secondary)] max-w-md'>
                {isWebSocketConnected
                  ? 'No activity logs available yet'
                  : 'Connection issues - logs will appear once reconnected'}
              </p>
            </div>
          )}
        </motion.div>
      </div>

      <div className='p-5 rounded-xl mb-6' style={{ backgroundColor: 'var(--mui-palette-background-default)' }}>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='font-semibold text-lg' style={{ color: 'var(--mui-palette-text-primary)' }}>
            Trade History
          </h3>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b' style={{ borderColor: 'var(--mui-palette-divider)' }}>
                {['Time', 'Open Price', 'Close Price', 'Profit'].map(header => (
                  <th
                    key={header}
                    className='py-3 text-sm font-medium text-center'
                    style={{ color: 'var(--mui-palette-text-secondary)' }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingStates.tradeHistory ? (
                <tr>
                  <td colSpan={4} className='py-10 text-center'>
                    <SkeletonLoader height='h-6' width='w-32' />
                  </td>
                </tr>
              ) : (
                tradeHistory.data.map(trade => (
                  <tr
                    key={trade.created_at}
                    className='border-b hover:bg-black/5 dark:hover:bg-white/5 transition-colors'
                    style={{ borderColor: 'var(--mui-palette-divider)' }}
                  >
                    <td className='p-3 text-sm text-center' style={{ color: 'var(--mui-palette-text-secondary)' }}>
                      {new Date(trade.created_at).toLocaleString()}
                    </td>
                    <td className='p-3 text-sm text-center' style={{ color: 'var(--mui-palette-text-primary)' }}>
                      {parseFloat(trade.open_price).toFixed(20)}
                    </td>
                    <td className='p-3 text-sm text-center' style={{ color: 'var(--mui-palette-text-primary)' }}>
                      {parseFloat(trade.close_price).toFixed(20)}
                    </td>
                    <td
                      className='p-3 text-sm text-center'
                      style={{
                        color:
                          parseFloat(trade.profit) < 0
                            ? 'var(--mui-palette-error-main)'
                            : 'var(--mui-palette-success-main)'
                      }}
                    >
                      {parseFloat(trade.profit).toFixed(20)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className='flex justify-between items-center mt-4'>
          <div className='flex items-center gap-2'>
            <span className='text-sm text-muted-foreground'>Trades per page:</span>
            <select
              value={tradeHistory.pagination.pageSize}
              onChange={handleTradeHistoryPageSizeChange}
              className='text-sm border rounded px-2 py-1 bg-[var(--mui-palette-background-paper)]'
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>

          <div className='flex items-center gap-2'>
            <button
              onClick={() => handleTradeHistoryPageChange(tradeHistory.pagination.currentPage - 1)}
              disabled={tradeHistory.pagination.currentPage === 1}
              className='p-1 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <ChevronLeft size={18} />
            </button>

            <span className='text-sm text-muted-foreground'>
              Page {tradeHistory.pagination.currentPage} of {tradeHistory.pagination.totalPages}
            </span>

            <button
              onClick={() => handleTradeHistoryPageChange(tradeHistory.pagination.currentPage + 1)}
              disabled={tradeHistory.pagination.currentPage === tradeHistory.pagination.totalPages}
              className='p-1 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {tradeHistory.data.length === 0 && !loadingStates.tradeHistory && (
          <div className='py-8 text-center'>
            <p className='text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }}>
              No trade history available
            </p>
          </div>
        )}
      </div>

      {fullscreenLogType && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 pt-20'
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className='bg-[var(--mui-palette-background-paper)] rounded-xl w-full max-w-6xl max-h-[90vh] flex flex-col border border-[var(--mui-palette-divider)]'
          >
            <div className='flex justify-between items-center p-6 border-b border-[var(--mui-palette-divider)] sticky top-0 bg-[var(--mui-palette-background-paper)] z-10'>
              <div className='flex items-center'>
                <div className='w-3 h-3 rounded-full bg-green-500 mr-3 animate-pulse'></div>
                <h2 className='text-xl font-bold' style={{ color: 'var(--mui-palette-text-primary)' }}>
                  Live Logs
                </h2>
              </div>
            </div>

            <div className='overflow-y-auto p-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {logs.map((log, idx) => (
                  <motion.div
                    key={log.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`p-4 rounded-lg border ${
                      log.info_tag === 'error'
                        ? 'border-red-500/30 bg-red-500/10'
                        : log.info_tag === 'warning'
                          ? 'border-yellow-500/30 bg-yellow-500/10'
                          : 'border-blue-500/30 bg-blue-500/10'
                    }`}
                  >
                    <div className='flex justify-between items-start gap-2'>
                      <div className='text-sm font-medium flex-1' style={{ color: 'var(--mui-palette-text-primary)' }}>
                        {log.log_message}
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-white text-xs capitalize ${
                          log.info_tag === 'error'
                            ? 'bg-red-500'
                            : log.info_tag === 'warning'
                              ? 'bg-yellow-500'
                              : 'bg-blue-500'
                        }`}
                      >
                        {log.info_tag}
                      </span>
                    </div>

                    <div className='mt-3 grid grid-cols-2 gap-2 text-xs'>
                      <div className='flex items-center text-muted-foreground'>
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          className='h-3 w-3 mr-1.5'
                          fill='none'
                          viewBox='0 0 24 24'
                          stroke='currentColor'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z'
                          />
                        </svg>
                        {log.wallet_address?.slice(0, 6)}...{log.wallet_address?.slice(-4)}
                      </div>
                      <div className='flex items-center text-muted-foreground'>
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          className='h-3 w-3 mr-1.5'
                          fill='none'
                          viewBox='0 0 24 24'
                          stroke='currentColor'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z'
                          />
                        </svg>
                        {log.symbol || 'N/A'}
                      </div>
                      <div className='flex items-center text-muted-foreground'>
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          className='h-3 w-3 mr-1.5'
                          fill='none'
                          viewBox='0 0 24 24'
                          stroke='currentColor'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
                          />
                        </svg>
                        Stage: {log.stage || 'N/A'}
                      </div>
                      <div className='flex items-center text-muted-foreground'>
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          className='h-3 w-3 mr-1.5'
                          fill='none'
                          viewBox='0 0 24 24'
                          stroke='currentColor'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                          />
                        </svg>
                        {new Date(log.created_at || Date.now()).toLocaleString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className='p-4 border-t border-[var(--mui-palette-divider)] flex justify-between items-center text-sm text-[var(--mui-palette-text-secondary)]'>
              <div>Showing {logs.length} logs</div>
              <button
                onClick={() => setFullscreenLogType(null)}
                className='px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-dark transition-colors'
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default LiveTokenOverview
