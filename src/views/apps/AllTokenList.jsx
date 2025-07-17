'use client'
import React, { useState, useMemo, useEffect } from 'react'

import { useRouter } from 'next/navigation'

import { motion } from 'framer-motion'
import Switch from '@mui/material/Switch'

import { toast } from 'react-toastify'

import axiosInstance from '@/utils/axiosInstance'

const AllTokenList = () => {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [tokens, setTokens] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [tokensPerPage, setTokensPerPage] = useState(8)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedTokenId, setSelectedTokenId] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [total_tokens, setTotalTokens] = useState(0)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [ws, setWs] = useState(null)
  const [isConnected, setIsConnected] = useState(false)

  const [defaultTradeSettings, setDefaultTradeSettings] = useState({
    sl: 10,
    tp: 20,
    max_sol_per_trade: 0.01,
    sl_time_out: 60,
    initial_value_buy_trade: 0.001,
    priority: 'Medium'
  })

  const [approvalValues, setApprovalValues] = useState({
    wallet_count: '',
    amount_per_wallet: ''
  })

  const [isLoadingSettings, setIsLoadingSettings] = useState(false)

  useEffect(() => {
    const fetchDefaultSettings = async () => {
      try {
        setIsLoadingSettings(true)
        const response = await axiosInstance.get('/bot-control/')

        setDefaultTradeSettings(response.data)
      } catch (error) {
        console.error('Error fetching default settings:', error)
        toast.error(error.response?.data?.message || 'Failed to fetch bot-control data', { autoClose: 3000 })
      } finally {
        setIsLoadingSettings(false)
      }
    }

    fetchDefaultSettings()
  }, [])

  const [newToken, setNewToken] = useState({
    name: '',
    symbol: '',
    description: '',
    wallet_count: '',
    amount_per_wallet: '',
    bot_settings: { ...defaultTradeSettings }
  })

  useEffect(() => {
    setNewToken(prev => ({
      ...prev,
      bot_settings: { ...defaultTradeSettings }
    }))
  }, [defaultTradeSettings])

  useEffect(() => {
    const socket = new WebSocket('wss://api.dev.alhpaorbit.com/ws/token/')

    socket.onopen = () => {
      console.log('WebSocket connected')
      setWs(socket)
      setIsConnected(true)
    }

    socket.onmessage = event => {
      const data = JSON.parse(event.data)

      console.log('New token received:', data)

      setTokens(prevTokens => {
        const newToken = {
          id: data.id,
          created_at: new Date().toISOString(),
          name: data.name,
          symbol: data.symbol,
          price: '$0.00',
          image: data.logo || 'https://cdn.pixabay.com/photo/2017/01/25/12/31/bitcoin-2007769_1280.jpg',
          is_approved: true,
          tweet_id: data.tweet_source

          // wallet_count: '0',
          // amount_per_wallet: '0',
          // tradeSettings: { ...defaultTradeSettings }
        }

        const exists = prevTokens.some(token => token.id === data.id)

        if (!exists) {
          return [newToken, ...prevTokens]
        }

        return prevTokens
      })

      setTotalTokens(prev => prev + 1)
      toast.success(`New token added: ${data.name} (${data.symbol})`)
    }

    socket.onerror = error => {
      console.error('WebSocket error:', error)
    }

    socket.onclose = () => {
      console.log('WebSocket disconnected')
      setWs(null)

      setTimeout(() => {
        setWs(new WebSocket('wss://api.dev.alhpaorbit.com/ws/token/'))
      }, 5000)
    }

    return () => {
      if (socket) {
        socket.close()
      }
    }
  }, [defaultTradeSettings])

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')

    if (!accessToken || !refreshToken) {
      router.push('/login')

      return
    }

    const fetchTokens = async () => {
      try {
        setLoading(true)

        const response = await axiosInstance.get('/token/', {
          params: {
            page: currentPage,
            page_size: tokensPerPage
          }
        })

        setTotalTokens(response.data.count)

        // Process tokens as before...
        const processedTokens = response.data.results.map((token, index) => ({
          id: token.id,
          created_at: token.created_at,
          name: token.name,
          symbol: token.symbol,
          price: token.profit ? `$${token.profit}` : '$0.00',
          image: token.logo || 'https://cdn.pixabay.com/photo/2017/01/25/12/31/bitcoin-2007769_1280.jpg',
          is_approved: token.is_approved,
          tweet_id: token.tweet_source,
          tradeSettings: {
            ...defaultTradeSettings,
            walletCount: token.wallet_count?.toString() || '0',
            amountPerWallet: token.amount_per_wallet?.toString() || '0'
          }
        }))

        setTokens(processedTokens)
        setTotalPages(response.data.total_pages)
      } catch (error) {
        console.error('Error fetching tokens:', error)
        toast.error(error.response?.data?.message || 'Failed to fetch token data', { autoClose: 3000 })

        if (error.response?.status === 401) {
          router.push('/login')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchTokens()
  }, [currentPage, tokensPerPage, router])

  const formatDate = dateString => {
    const date = new Date(dateString)

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const shortenTweetId = tweetId => {
    if (!tweetId) return 'N/A'

    return tweetId.length > 10 ? `${tweetId.substring(0, 5)}...${tweetId.substring(tweetId.length - 5)}` : tweetId
  }

  const handleApprovalToggle = async token => {
    if (!token.is_approved) {
      setSelectedTokenId(token.id)
      setShowModal(true)
    }
  }

  const getDisplayIndex = tokenIndex => {
    return (currentPage - 1) * tokensPerPage + tokenIndex + 1
  }

  const handleModalCancel = () => {
    setShowModal(false)
    setSelectedTokenId(null)
  }

  const handleApproveToken = async () => {
    try {
      const response = await axiosInstance.patch(`/token/approve-token/${selectedTokenId}`, {
        is_approved: true,
        wallet_count: approvalValues.wallet_count,
        amount_per_wallet: approvalValues.amount_per_wallet
      })

      setTokens(
        tokens.map(token => {
          if (token.id === selectedTokenId) {
            return {
              ...token,
              is_approved: true,
              wallet_count: approvalValues.wallet_count,
              amount_per_wallet: approvalValues.amount_per_wallet
            }
          }

          return token
        })
      )

      // console.log(approvalValues.wallet_count)
      // console.log(approvalValues.amount_per_wallet)

      setShowModal(false)
      setSelectedTokenId(null)
    } catch (error) {
      console.error('Error approving token:', error)
      toast.error(error.response?.data?.message || 'Failed to approve token')
    }
  }

  const filteredTokens = useMemo(() => {
    return tokens.filter(token => `${token.name} ${token.symbol}`.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [searchTerm, tokens])

  const paginatedTokens = useMemo(() => {
    return filteredTokens.slice(0, tokensPerPage)
  }, [filteredTokens, tokensPerPage])

  const handlePageChange = direction => {
    setCurrentPage(prev => {
      if (direction === 'next' && prev < totalPages) return prev + 1
      if (direction === 'prev' && prev > 1) return prev - 1

      return prev
    })
  }

  const handleAddToken = async () => {
    setIsCreating(true)

    try {
      const formData = new FormData()

      // Append main token fields
      formData.append('name', newToken.name)
      formData.append('symbol', newToken.symbol)
      formData.append('description', newToken.description)
      formData.append('wallet_count', newToken.wallet_count)
      formData.append('amount_per_wallet', newToken.amount_per_wallet)

      // Append image file if selected
      if (selectedFile) {
        formData.append('image', selectedFile)
      }

      Object.entries(newToken.bot_settings).forEach(([key, value]) => {
        formData.append(`bot_settings.${key}`, value.toString())
      })

      // Append bot settings
      formData.append('bot_settings.sl', newToken.bot_settings.sl.toString())
      formData.append('bot_settings.tp', newToken.bot_settings.tp.toString())
      formData.append('bot_settings.max_sol_per_trade', newToken.bot_settings.max_sol_per_trade.toString())
      formData.append('bot_settings.sl_time_out', newToken.bot_settings.sl_time_out.toString())
      formData.append('bot_settings.initial_value_buy_trade', newToken.bot_settings.initial_value_buy_trade.toString())
      formData.append('bot_settings.priority', newToken.bot_settings.priority)
      formData.append('bot_settings.speed_of_trade', 3)

      const response = await axiosInstance.post('/token/create-token/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setShowAddModal(false)
      setNewToken({
        name: '',
        symbol: '',
        description: '',
        wallet_count: '',
        amount_per_wallet: '',
        bot_settings: { ...defaultTradeSettings }
      })

      setSelectedFile(null)
    } catch (error) {
      console.error('Error creating token:', error)
      toast.error(error.response || 'Error creating token', { autoClose: 3000 })
    } finally {
      setIsCreating(false)
    }
  }

  const isAddDisabled =
    !newToken.name || !newToken.symbol || !newToken.description || !newToken.wallet_count || !newToken.amount_per_wallet

  const selectedToken = selectedTokenId ? tokens.find(token => token.id === selectedTokenId) : null

  if (loading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary'></div>
      </div>
    )
  }

  const ConnectionStatus = () => (
    <div className='flex items-center ml-4'>
      <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
      <span className='text-sm text-[var(--mui-palette-text-secondary)]'>
        {isConnected ? 'Connected' : 'Connecting...'}
      </span>
    </div>
  )

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div
        className='p-6 mx-auto'
        style={{
          backgroundColor: 'var(--mui-palette-background-paper)',
          border: '1px solid var(--mui-palette-divider)',
          borderRadius: '20px'
        }}
      >
        <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4'>
          <div>
            <h1 className='text-2xl md:text-3xl font-bold text-[var(--mui-palette-text-primary)]'>Token Explorer</h1>
            <p className='text-[var(--mui-palette-text-secondary)] mt-1'>Discover and analyze all available tokens</p>
          </div>

          <div className='flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full md:w-auto'>
            <ConnectionStatus />
            <div className='relative'>
              <select
                value={tokensPerPage}
                onChange={e => {
                  setTokensPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className='pl-3 pr-8 py-2 rounded-lg border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-primary bg-[var(--mui-palette-background-default)] text-[var(--mui-palette-text-primary)]'
              >
                <option value='5'>5 per page</option>
                <option value='8'>8 per page</option>
                <option value='10'>10 per page</option>
                <option value='15'>15 per page</option>
                <option value='20'>20 per page</option>
              </select>
            </div>

            <div className='relative w-full md:w-64'>
              <input
                type='text'
                placeholder='Search tokens...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='pl-10 pr-4 py-2 rounded-lg border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-primary w-full bg-[var(--mui-palette-background-default)] text-[var(--mui-palette-text-primary)]'
              />
              <svg
                className='absolute left-3 top-2.5 h-5 w-5 text-[var(--mui-palette-text-secondary)]'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                />
              </svg>
            </div>

            <button
              className='px-4 py-2 rounded-md bg-primary text-white hover:bg-[var(--mui-palette-primary-dark)] transition-colors cursor-pointer'
              onClick={() => setShowAddModal(true)}
            >
              Create Token
            </button>
          </div>
        </div>

        <div className='bg-[var(--mui-palette-background-default)] rounded-xl shadow-sm border border-[var(--border-color)] overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-[var(--border-color)]'>
              <thead className='bg-[var(--mui-palette-background-default)]'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-[var(--mui-palette-text-secondary)] uppercase tracking-wider'>
                    #
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-[var(--mui-palette-text-secondary)] uppercase tracking-wider'>
                    Token
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-[var(--mui-palette-text-secondary)] uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-[var(--mui-palette-text-secondary)] uppercase tracking-wider'>
                    Added On
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-[var(--mui-palette-text-secondary)] uppercase tracking-wider'>
                    Tweet Source
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-[var(--mui-palette-text-secondary)] uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-[var(--border-color)] bg-[var(--mui-palette-background-default)]'>
                {paginatedTokens.map((token, index) => (
                  <tr key={token.id} className='transition-colors bg-[var(--mui-palette-background-default)]'>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-[var(--mui-palette-text-primary)]'>
                      {getDisplayIndex(index)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center'>
                        <img
                          src={token.logo || 'https://cdn.pixabay.com/photo/2017/01/25/12/31/bitcoin-2007769_1280.jpg'}
                          alt={token.name}
                          className='h-10 w-10 rounded-full object-cover'
                        />
                        <div className='ml-4'>
                          <div className='text-sm font-medium text-[var(--mui-palette-text-primary)]'>{token.name}</div>
                          <div className='text-sm text-[var(--mui-palette-text-secondary)]'>{token.symbol}</div>
                        </div>
                      </div>
                    </td>

                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center'>
                        <Switch
                          checked={token.is_approved}
                          onChange={() => handleApprovalToggle(token)}
                          color='success'
                          sx={{
                            transform: 'scale(1.4)',
                            '& .MuiSwitch-switchBase': {
                              padding: 2.2
                            }
                          }}
                        />
                        <span className='ml-2 text-sm font-medium text-[var(--mui-palette-text-secondary)]'>
                          {token.is_approved ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                    </td>

                    <td className='px-6 py-4 whitespace-nowrap text-sm text-[var(--mui-palette-text-secondary)]'>
                      {formatDate(token.created_at)}
                    </td>

                    <td className='px-6 py-4 text-left text-sm'>
                      {token.tweet_id ? (
                        <a href={token.tweet_id} target='_blank' rel='noopener noreferrer'>
                          <button className='text-primary hover:text-blue-700 px-3 py-1 rounded-md bg-primaryLighter hover:bg-primaryLight transition-colors cursor-pointer'>
                            View Tweet
                          </button>
                        </a>
                      ) : (
                        <span className='text-[var(--mui-palette-text-secondary)]'>N/A</span>
                      )}
                    </td>

                    <td className='px-6 py-4 text-left text-sm'>
                      <a href={`/apps/live-token-overview/${token.id}`} target='_blank' rel='noopener noreferrer'>
                        <button className='text-primary hover:text-blue-700 px-3 py-1 rounded-md bg-primaryLighter hover:bg-primaryLight transition-colors cursor-pointer'>
                          View Details
                        </button>
                      </a>
                    </td>
                  </tr>
                ))}
                {paginatedTokens.length === 0 && (
                  <tr>
                    <td colSpan='6' className='px-6 py-4 text-center text-[var(--mui-palette-text-secondary)]'>
                      No tokens found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className='flex items-center justify-between mt-6'>
          <div className='text-sm text-[var(--mui-palette-text-secondary)]'>
            Showing{' '}
            <span className='font-medium'>
              {paginatedTokens.length > 0 ? (currentPage - 1) * tokensPerPage + 1 : 0}
            </span>{' '}
            to <span className='font-medium'>{(currentPage - 1) * tokensPerPage + paginatedTokens.length}</span> of{' '}
            <span className='font-medium'>{total_tokens}</span> tokens
          </div>
          <div className='flex space-x-2'>
            <button
              onClick={() => handlePageChange('prev')}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md border text-sm font-medium ${
                currentPage === 1
                  ? 'text-[var(--mui-palette-text-disabled)] bg-[var(--mui-palette-background-paper)] cursor-not-allowed'
                  : 'text-[var(--mui-palette-text-primary)] bg-[var(--mui-palette-background-paper)] hover:bg-[var(--mui-palette-action-hover)]'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange('next')}
              disabled={currentPage === totalPages || totalPages === 0}
              className={`px-3 py-1 rounded-md border text-sm font-medium ${
                currentPage === totalPages || totalPages === 0
                  ? 'text-[var(--mui-palette-text-disabled)] bg-[var(--mui-palette-background-paper)] cursor-not-allowed'
                  : 'text-[var(--mui-palette-text-primary)] bg-[var(--mui-palette-background-paper)] hover:bg-[var(--mui-palette-action-hover)]'
              }`}
            >
              Next
            </button>
          </div>
        </div>

        {showModal && selectedToken && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-[var(--mui-palette-background-default)] rounded-lg p-6 w-full max-w-md shadow-xl'>
              <h2 className='text-xl font-semibold text-[var(--mui-palette-text-primary)] mb-4'>
                Approve {selectedToken.name}
              </h2>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-[var(--mui-palette-text-primary)]'>
                    Wallet Count
                  </label>
                  <input
                    type='number'
                    value={approvalValues.wallet_count}
                    onChange={e => setApprovalValues({ ...approvalValues, wallet_count: e.target.value })}
                    className='mt-1 block w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--mui-palette-background-paper)] text-[var(--mui-palette-text-primary)] focus:outline-none focus:ring-primary focus:border-primary'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-[var(--mui-palette-text-primary)]'>
                    Amount per Wallet
                  </label>
                  <input
                    type='number'
                    value={approvalValues.amount_per_wallet}
                    onChange={e => setApprovalValues({ ...approvalValues, amount_per_wallet: e.target.value })}
                    className='mt-1 block w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--mui-palette-background-paper)] text-[var(--mui-palette-text-primary)] focus:outline-none focus:ring-primary focus:border-primary'
                  />
                </div>

                <div className='flex justify-end space-x-2 mt-4'>
                  <button
                    onClick={handleModalCancel}
                    className='px-4 py-2 text-[var(--mui-palette-text-primary)] rounded-md hover:bg-[var(--mui-palette-action-hover)]'
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApproveToken}
                    disabled={!approvalValues.wallet_count || !approvalValues.amount_per_wallet}
                    className={`px-4 py-2 rounded-md text-white transition-all duration-200 ${
                      !approvalValues.wallet_count || !approvalValues.amount_per_wallet
                        ? 'bg-primaryLight cursor-not-allowed opacity-60'
                        : 'bg-primary hover:bg-[var(--mui-palette-primary-dark)]'
                    }`}
                  >
                    Save & Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showAddModal && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-[var(--mui-palette-background-default)] rounded-lg p-6 w-full max-w-4xl shadow-xl'>
              {isLoadingSettings ? (
                <div className='flex justify-center items-center h-64'>
                  <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary'></div>
                </div>
              ) : (
                <>
                  <h2 className='text-xl font-semibold text-[var(--mui-palette-text-primary)] mb-4'>
                    Create New Token
                  </h2>
                  <div className='grid grid-cols-2 gap-6'>
                    <div className='space-y-4'>
                      <div>
                        <label className='block text-sm font-medium text-[var(--mui-palette-text-primary)]'>
                          Token Name
                        </label>
                        <input
                          type='text'
                          value={newToken.name}
                          onChange={e => setNewToken(prev => ({ ...prev, name: e.target.value }))}
                          className='mt-1 block w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--mui-palette-background-paper)]'
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-[var(--mui-palette-text-primary)]'>
                          Ticker Symbol
                        </label>
                        <input
                          type='text'
                          value={newToken.symbol}
                          onChange={e => setNewToken(prev => ({ ...prev, symbol: e.target.value }))}
                          className='mt-1 block w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--mui-palette-background-paper)]'
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-[var(--mui-palette-text-primary)]'>
                          Upload Image
                        </label>
                        <input
                          type='file'
                          accept='image/*'
                          onChange={e => setSelectedFile(e.target.files[0])}
                          className='mt-1 block w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--mui-palette-background-paper)]'
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-[var(--mui-palette-text-primary)]'>
                          Description
                        </label>
                        <textarea
                          rows={8}
                          value={newToken.description}
                          onChange={e => setNewToken(prev => ({ ...prev, description: e.target.value }))}
                          className='mt-1 block w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--mui-palette-background-paper)]'
                        ></textarea>
                      </div>
                    </div>
                    <div className='space-y-4'>
                      <div>
                        <label className='block text-sm font-medium text-[var(--mui-palette-text-primary)]'>
                          Wallet Count
                        </label>
                        <input
                          type='number'
                          value={newToken.wallet_count}
                          onChange={e => setNewToken(prev => ({ ...prev, wallet_count: e.target.value }))}
                          className='mt-1 block w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--mui-palette-background-paper)]'
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-[var(--mui-palette-text-primary)]'>
                          Amount per Wallet
                        </label>
                        <input
                          type='number'
                          value={newToken.amount_per_wallet}
                          onChange={e => setNewToken(prev => ({ ...prev, amount_per_wallet: e.target.value }))}
                          className='mt-1 block w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--mui-palette-background-paper)]'
                        />
                      </div>
                      <h3 className='text-lg font-medium text-[var(--mui-palette-text-primary)]'>Bot Settings</h3>
                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <label className='block text-sm font-medium text-[var(--mui-palette-text-primary)]'>
                            Stop Loss (%)
                          </label>
                          <input
                            type='number'
                            value={Number(newToken.bot_settings.sl).toFixed(3)}
                            onChange={e =>
                              setNewToken(prev => ({
                                ...prev,
                                bot_settings: {
                                  ...prev.bot_settings,
                                  sl: e.target.value
                                }
                              }))
                            }
                            className='mt-1 block w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--mui-palette-background-paper)]'
                          />
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-[var(--mui-palette-text-primary)]'>
                            Take Profit (%)
                          </label>
                          <input
                            type='number'
                            value={Number(newToken.bot_settings.tp).toFixed(2)}
                            onChange={e =>
                              setNewToken(prev => ({
                                ...prev,
                                bot_settings: {
                                  ...prev.bot_settings,
                                  tp: e.target.value
                                }
                              }))
                            }
                            className='mt-1 block w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--mui-palette-background-paper)]'
                          />
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-[var(--mui-palette-text-primary)]'>
                            Max SOL per Trade
                          </label>
                          <input
                            type='number'
                            value={Number(newToken.bot_settings.max_sol_per_trade).toFixed(3)}
                            onChange={e =>
                              setNewToken(prev => ({
                                ...prev,
                                bot_settings: {
                                  ...prev.bot_settings,
                                  max_sol_per_trade: e.target.value
                                }
                              }))
                            }
                            className='mt-1 block w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--mui-palette-background-paper)]'
                          />
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-[var(--mui-palette-text-primary)]'>
                            SL Timeout (minutes)
                          </label>
                          <input
                            type='number'
                            value={newToken.bot_settings.sl_time_out}
                            onChange={e =>
                              setNewToken(prev => ({
                                ...prev,
                                bot_settings: {
                                  ...prev.bot_settings,
                                  sl_time_out: e.target.value
                                }
                              }))
                            }
                            className='mt-1 block w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--mui-palette-background-paper)]'
                          />
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-[var(--mui-palette-text-primary)]'>
                            Initial Buy Value (SOL)
                          </label>
                          <input
                            type='number'
                            value={Number(newToken.bot_settings.initial_value_buy_trade).toFixed(3)}
                            onChange={e =>
                              setNewToken(prev => ({
                                ...prev,
                                bot_settings: {
                                  ...prev.bot_settings,
                                  initial_value_buy_trade: e.target.value
                                }
                              }))
                            }
                            className='mt-1 block w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--mui-palette-background-paper)]'
                          />
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-[var(--mui-palette-text-primary)]'>
                            Priority
                          </label>
                          <select
                            value={newToken.bot_settings.priority}
                            onChange={e =>
                              setNewToken(prev => ({
                                ...prev,
                                bot_settings: {
                                  ...prev.bot_settings,
                                  priority: e.target.value
                                }
                              }))
                            }
                            className='mt-1 block w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--mui-palette-background-paper)]'
                          >
                            <option value='Low'>Low</option>
                            <option value='Medium'>Medium</option>
                            <option value='High'>High</option>
                            <option value='Very High'>Very High</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className='flex justify-end space-x-2 pt-6'>
                    <button
                      onClick={() => {
                        setShowAddModal(false)
                        setNewToken({
                          name: '',
                          symbol: '',
                          description: '',
                          wallet_count: '10',
                          amount_per_wallet: '10',
                          bot_settings: { ...defaultTradeSettings }
                        })
                        setSelectedFile(null)
                      }}
                      className='px-4 py-2 text-[var(--mui-palette-text-primary)] rounded-md hover:bg-[var(--mui-palette-action-hover)]'
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddToken}
                      disabled={isAddDisabled || isCreating}
                      className={`px-4 py-2 rounded-md text-white transition-all duration-200 flex items-center justify-center ${
                        isAddDisabled || isCreating
                          ? 'bg-primaryLight cursor-not-allowed opacity-60'
                          : 'bg-primary hover:bg-[var(--mui-palette-primary-dark)]'
                      }`}
                    >
                      {isCreating ? (
                        <>
                          <svg
                            className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
                            xmlns='http://www.w3.org/2000/svg'
                            fill='none'
                            viewBox='0 0 24 24'
                          >
                            <circle
                              className='opacity-25'
                              cx='12'
                              cy='12'
                              r='10'
                              stroke='currentColor'
                              strokeWidth='4'
                            ></circle>
                            <path
                              className='opacity-75'
                              fill='currentColor'
                              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                            ></path>
                          </svg>
                          Creating...
                        </>
                      ) : (
                        'Create Token'
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default AllTokenList
