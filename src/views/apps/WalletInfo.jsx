'use client'
import React, { useState, useMemo, useEffect } from 'react'

import { motion } from 'framer-motion'
import { toast } from 'react-toastify'

import axiosInstance from '@/utils/axiosInstance'

const WalletInfo = () => {
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [walletsPerPage, setWalletsPerPage] = useState(5)
  const [showPrivateKeyModal, setShowPrivateKeyModal] = useState(false)
  const [stageFilter, setStageFilter] = useState('All')
  const [showInTradeOnly, setShowInTradeOnly] = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [privateKey, setPrivateKey] = useState('')

  const stageMapping = {
    0: 'Wallet Created',
    1: 'Wallet Funded',
    2: 'Buying Token',
    3: 'Selling Token',
    4: 'Transferred Sol To Master'
  }

  const stageOptions = ['All', ...Object.values(stageMapping)]

  const fetchWallets = async () => {
    try {
      setLoading(true)

      const params = {
        is_in_trade: showInTradeOnly || undefined,
        stage:
          stageFilter !== 'All' ? Object.keys(stageMapping).find(key => stageMapping[key] === stageFilter) : undefined,
        page_size: walletsPerPage,
        page: currentPage
      }

      const response = await axiosInstance.get('/wallet/', { params })

      const transformedWallets = response.data.results.map((wallet, index) => ({
        id: wallet.id,
        wallet_public_key: wallet.public_key,
        token: wallet.symbol,
        stage: wallet.stage,
        token_balance: parseFloat(wallet.token_balance),
        sol_balance: parseFloat(wallet.funded_SOL),
        is_in_trade: wallet.is_in_trade
      }))

      setWallets(transformedWallets)
      setTotalPages(response.data.total_pages)
      setTotalCount(response.data.count)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred while fetching wallets.")
      console.error('Error fetching wallets:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWallets()
  }, [currentPage, walletsPerPage, stageFilter, showInTradeOnly])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const filteredWallets = useMemo(() => {
    return wallets.filter(wallet => {
      const matchesSearch = `${wallet.wallet_public_key} ${wallet.token}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())

      return matchesSearch
    })
  }, [searchTerm, wallets])

  const handlePageChange = direction => {
    setCurrentPage(prev => {
      if (direction === 'next' && prev < totalPages) return prev + 1
      if (direction === 'prev' && prev > 1) return prev - 1

      return prev
    })
  }

  const copyToClipboard = text => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!', { autoClose: 1500 })
  }

  const shortenPublicKey = key => {
    return key.length > 10 ? `${key.substring(0, 5)}...${key.substring(key.length - 5)}` : key
  }

  const viewPrivateKey = async id => {
    try {
      const response = await axiosInstance.get(`/wallet/private-key/${id}`)

      setPrivateKey(response.data.private_key)
      setShowPrivateKeyModal(true)
    } catch (err) {
      console.error('Error fetching private key:', err)
      toast.error('Failed to fetch private key.',{ autoClose: 2000 } )
    }
  }

  if (loading && wallets.length === 0) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary'></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative' role='alert'>
        <strong className='font-bold'>Error: </strong>
        <span className='block sm:inline'>{error}</span>
      </div>
    )
  }

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
        <div className='flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4'>
          <div className='w-full xl:flex-1'>
            <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full'>
              <div>
                <h1 className='text-2xl md:text-3xl font-bold text-[var(--mui-palette-text-primary)]'>
                  Wallet Information
                </h1>
                <p className='text-[var(--mui-palette-text-secondary)] mt-1'>View and manage all wallet details</p>
              </div>

              <div className='flex flex-col sm:flex-row items-stretch gap-3 w-full md:w-auto'>
                <div className='flex gap-3 flex-col sm:flex-row w-full sm:w-auto'>
                  <div className='flex items-center'>
                    <div className='ml-3 mr-3 text-sm font-medium text-[var(--mui-palette-text-primary)]'>In Trade</div>
                    <label htmlFor='inTradeToggle' className='flex items-center cursor-pointer'>
                      <div className='relative mr-5'>
                        <input
                          type='checkbox'
                          id='inTradeToggle'
                          className='sr-only'
                          checked={showInTradeOnly}
                          onChange={() => {
                            setShowInTradeOnly(!showInTradeOnly)
                            setCurrentPage(1)
                          }}
                        />
                        <div
                          className={`block w-14 h-8 rounded-full ${showInTradeOnly ? 'bg-primary' : 'bg-gray-300'}`}
                        ></div>
                        <div
                          className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${
                            showInTradeOnly ? 'transform translate-x-6' : ''
                          }`}
                        ></div>
                      </div>
                    </label>
                  </div>

                  <div className='relative'>
                    <select
                      value={walletsPerPage}
                      onChange={e => {
                        setWalletsPerPage(Number(e.target.value))
                        setCurrentPage(1)
                      }}
                      className='pl-3 pr-8 py-2 rounded-lg border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-primary bg-[var(--mui-palette-background-default)] text-[var(--mui-palette-text-primary)]'
                    >
                      <option value='5'>5 per page</option>
                      <option value='8'>8 per page</option>
                      <option value='10'>10 per page</option>
                    </select>
                  </div>
                  <div className='relative'>
                    <select
                      value={stageFilter}
                      onChange={e => {
                        setStageFilter(e.target.value)
                        setCurrentPage(1)
                      }}
                      className='pl-3 pr-8 py-2 rounded-lg border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-primary bg-[var(--mui-palette-background-default)] text-[var(--mui-palette-text-primary)]'
                    >
                      {stageOptions.map(option => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className='relative w-full sm:w-64'>
                  <input
                    type='text'
                    placeholder='Search wallets...'
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
              </div>
            </div>
          </div>
        </div>

        <div className='bg-[var(--mui-palette-background-default)] rounded-xl shadow-sm border border-[var(--border-color)] overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-[var(--border-color)]'>
              <thead className='bg-[var(--mui-palette-background-default)]'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-[var(--mui-palette-text-secondary)] uppercase tracking-wider'>
                    ID
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-[var(--mui-palette-text-secondary)] uppercase tracking-wider'>
                    Wallet Public Key
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-[var(--mui-palette-text-secondary)] uppercase tracking-wider'>
                    Token
                  </th>
                  <th className='px-6 py-3 text-xs font-medium text-[var(--mui-palette-text-secondary)] uppercase tracking-wider'>
                    Stage
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-[var(--mui-palette-text-secondary)] uppercase tracking-wider'>
                    Token Balance
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-[var(--mui-palette-text-secondary)] uppercase tracking-wider'>
                    SOL Balance
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-[var(--mui-palette-text-secondary)] uppercase tracking-wider'>
                    In Trade
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-[var(--mui-palette-text-secondary)] uppercase tracking-wider'>
                    Private Key
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-[var(--border-color)] bg-[var(--mui-palette-background-default)]'>
                {filteredWallets.map((wallet,index) => (
                  <tr key={wallet.id} className='transition-colors bg-[var(--mui-palette-background-default)]'>
                    <td className='px-6 py-5 whitespace-nowrap text-sm text-[var(--mui-palette-text-primary)]'>
                      {index + 1}
                    </td>
                    <td className='px-6 py-5 whitespace-nowrap text-sm text-[var(--mui-palette-text-primary)]'>
                      <div
                        className='flex items-center gap-2 cursor-pointer group'
                        onClick={() => copyToClipboard(wallet.wallet_public_key)}
                        title='Click to copy'
                      >
                        <span className='group-hover:text-primary transition-colors'>
                          {shortenPublicKey(wallet.wallet_public_key)}
                        </span>
                        <span className='opacity-0 group-hover:opacity-100 transition-opacity'>
                          <svg
                            className='h-4 w-4 text-[var(--mui-palette-text-secondary)] group-hover:text-primary'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3'
                            />
                          </svg>
                        </span>
                      </div>
                    </td>
                    <td className='px-6 py-5 whitespace-nowrap text-sm text-[var(--mui-palette-text-primary)]'>
                      {wallet.token}
                    </td>
                    <td className='px-6 py-5 whitespace-nowrap'>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          wallet.stage === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : wallet.stage === 'Inactive'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {wallet.stage}
                      </span>
                    </td>
                    <td className='px-6 py-5 whitespace-nowrap text-sm text-[var(--mui-palette-text-primary)]'>
                      {wallet.token_balance.toFixed(8)} SOL
                    </td>
                    <td className='px-6 py-5 whitespace-nowrap text-sm text-[var(--mui-palette-text-primary)]'>
                      {wallet.sol_balance.toFixed(8)} SOL
                    </td>
                    <td className='px-6 py-5 whitespace-nowrap text-sm text-[var(--mui-palette-text-primary)]'>
                      {wallet.is_in_trade ? (
                        <span className='px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full'>Yes</span>
                      ) : (
                        <span className='px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full'>No</span>
                      )}
                    </td>
                    <td className='px-6 py-5 whitespace-nowrap text-sm'>
                      <button
                        onClick={() => viewPrivateKey(wallet.id)}
                        className='text-primary hover:text-blue-700 px-3 py-1 rounded-md bg-primaryLighter hover:bg-primaryLight transition-colors cursor-pointer'
                      >
                        View Private Key
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredWallets.length === 0 && (
                  <tr>
                    <td colSpan='8' className='px-6 py-5 text-center text-[var(--mui-palette-text-secondary)]'>
                      {loading ? 'Loading...' : 'No wallets found.'}
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
              {filteredWallets.length > 0 ? (currentPage - 1) * walletsPerPage + 1 : 0}
            </span>{' '}
            to <span className='font-medium'>{(currentPage - 1) * walletsPerPage + filteredWallets.length}</span> of{' '}
            <span className='font-medium'>{totalCount}</span> wallets
          </div>
          <div className='flex space-x-2'>
            <button
              onClick={() => handlePageChange('prev')}
              disabled={currentPage === 1 || loading}
              className={`px-3 py-1 rounded-md border text-sm font-medium ${
                currentPage === 1 || loading
                  ? 'text-[var(--mui-palette-text-disabled)] bg-[var(--mui-palette-background-paper)] cursor-not-allowed'
                  : 'text-[var(--mui-palette-text-primary)] bg-[var(--mui-palette-background-paper)] hover:bg-[var(--mui-palette-action-hover)]'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange('next')}
              disabled={currentPage === totalPages || totalPages === 0 || loading}
              className={`px-3 py-1 rounded-md border text-sm font-medium ${
                currentPage === totalPages || totalPages === 0 || loading
                  ? 'text-[var(--mui-palette-text-disabled)] bg-[var(--mui-palette-background-paper)] cursor-not-allowed'
                  : 'text-[var(--mui-palette-text-primary)] bg-[var(--mui-palette-background-paper)] hover:bg-[var(--mui-palette-action-hover)]'
              }`}
            >
              Next
            </button>
          </div>
        </div>

        {showPrivateKeyModal && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-[var(--mui-palette-background-default)] rounded-lg p-6 w-full max-w-md shadow-xl'>
              <h2 className='text-xl font-semibold text-[var(--mui-palette-text-primary)] mb-4'>Private Key</h2>
              <div className='bg-[var(--mui-palette-background-paper)] p-4 rounded-md mb-4 overflow-x-auto'>
                <code className=''>{privateKey}</code>
              </div>
              <div className='flex justify-end space-x-2'>
                <button
                  onClick={() => copyToClipboard(privateKey)}
                  className='px-4 py-2 rounded-md bg-primary text-white hover:bg-[var(--mui-palette-primary-dark)] transition-colors'
                >
                  Copy
                </button>
                <button
                  onClick={() => setShowPrivateKeyModal(false)}
                  className='px-4 py-2 rounded-md border border-[var(--border-color)] text-[var(--mui-palette-text-primary)] hover:bg-[var(--mui-palette-action-hover)] transition-colors'
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default WalletInfo
