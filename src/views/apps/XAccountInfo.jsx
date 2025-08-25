"use client"
import React, { useState, useEffect } from 'react'

import axiosInstance from '@/utils/axiosInstance'

export default function XAccountInfo() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [accountsPerPage, setAccountsPerPage] = useState(5)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [nextPage, setNextPage] = useState(null)
  const [previousPage, setPreviousPage] = useState(null)

  const [newAccount, setNewAccount] = useState({
    account_name: '',
    account_id: ''
  })

  const fetchAccounts = async (page = 1) => {
    try {
      setLoading(true)
      let url = `x-user/?page=${page}&page_size=${accountsPerPage}`
      
      const response = await axiosInstance.get(url)

      setAccounts(response.data.results)
      setTotalCount(response.data.count)
      setTotalPages(response.data.total_pages)
      setCurrentPage(response.data.current_page)
      setNextPage(response.data.next_page)
      setPreviousPage(response.data.previous_page)
    } catch (error) {
      console.error('Error fetching accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts(currentPage)
  }, [currentPage, accountsPerPage])

  const handleAddAccount = async () => {
    if (newAccount.account_name && newAccount.account_id) {
      try {
        if (editingAccount) {
          await axiosInstance.put(`/x-user/${editingAccount.id}/`, {
            account_name: newAccount.account_name,
            account_id: newAccount.account_id
          })

          await fetchAccounts(currentPage)
        } else {
          await axiosInstance.post('x-user/create/', {
            account_name: newAccount.account_name,
            account_id: newAccount.account_id
          })
          
          await fetchAccounts(currentPage)
        }

        setShowModal(false)
        setNewAccount({ account_name: '', account_id: '' })
        setEditingAccount(null)
      } catch (error) {
        console.error('Error creating account:', error)
      }
    }
  }

  const handleEdit = (account) => {
    setEditingAccount(account)
    setNewAccount({
      account_name: account.account_name,
      account_id: account.account_id
    })
    setShowModal(true)
  }

  const handleDelete = async (accountId) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        console.log('Delete functionality to be implemented for account ID:', accountId)


        await axiosInstance.delete(`/x-user/${accountId}/`)
        await fetchAccounts(currentPage)
      } catch (error) {
        console.error('Error deleting account:', error)
      }
    }
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleModalClose = () => {
    setShowModal(false)
    setEditingAccount(null)
    setNewAccount({ account_name: '', account_id: '' })
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary'></div>
      </div>
    )
  }

  return (
    <div 
      className="p-6 mx-auto rounded-xl shadow-sm"
      style={{
        backgroundColor: 'var(--mui-palette-background-paper)',
        border: '1px solid var(--mui-palette-divider)'
      }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--mui-palette-text-primary)]">
            X Account Management
          </h1>
          <p className="text-[var(--mui-palette-text-secondary)] mt-1">
            Manage your X platform accounts
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <select
            value={accountsPerPage}
            onChange={(e) => {
              setAccountsPerPage(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="pl-3 pr-8 py-2 rounded-lg border border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-primary bg-[var(--mui-palette-background-default)] text-[var(--mui-palette-text-primary)]"
          >
            <option value="5">5 per page</option>
            <option value="10">10 per page</option>
            <option value="15">15 per page</option>
            <option value="20">20 per page</option>
          </select>
          
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-md bg-primary text-white hover:bg-[var(--mui-palette-primary-dark)] transition-colors cursor-pointer"
          >
            Add Account
          </button>
        </div>
      </div>

      <div 
        className="rounded-xl shadow-sm border border-[var(--border-color)] overflow-hidden"
        style={{ backgroundColor: 'var(--mui-palette-background-default)' }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border-color)]">
            <thead className="bg-[var(--mui-palette-background-default)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--mui-palette-text-secondary)] uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--mui-palette-text-secondary)] uppercase tracking-wider">
                  Account Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--mui-palette-text-secondary)] uppercase tracking-wider">
                  Account ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--mui-palette-text-secondary)] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] bg-[var(--mui-palette-background-default)]">
              {accounts.map((account, index) => (
                <tr key={account.id} className="transition-colors bg-[var(--mui-palette-background-default)]">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--mui-palette-text-primary)]">
                    {(currentPage - 1) * accountsPerPage + index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--mui-palette-text-primary)]">
                    {account.account_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--mui-palette-text-primary)]">
                    {account.account_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(account)}
                        className="text-primary hover:text-blue-700 px-3 py-1 rounded-md bg-primaryLighter hover:bg-primaryLight transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="text-red-600 hover:text-red-800 px-3 py-1 rounded-md bg-red-100 hover:bg-red-200 transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-[var(--mui-palette-text-secondary)]">
                    No accounts available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-[var(--mui-palette-text-secondary)]">
          Showing{' '}
          <span className="font-medium">
            {accounts.length > 0 ? (currentPage - 1) * accountsPerPage + 1 : 0}
          </span>{' '}
          to <span className="font-medium">{(currentPage - 1) * accountsPerPage + accounts.length}</span> of{' '}
          <span className="font-medium">{totalCount}</span> accounts
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!previousPage || loading}
              className={`px-3 py-1 rounded-md border text-sm font-medium ${
                !previousPage || loading
                  ? 'text-[var(--mui-palette-text-disabled)] bg-[var(--mui-palette-background-paper)] cursor-not-allowed'
                  : 'text-[var(--mui-palette-text-primary)] bg-[var(--mui-palette-background-paper)] hover:bg-[var(--mui-palette-action-hover)]'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!nextPage || loading}
              className={`px-3 py-1 rounded-md border text-sm font-medium ${
                !nextPage || loading
                  ? 'text-[var(--mui-palette-text-disabled)] bg-[var(--mui-palette-background-paper)] cursor-not-allowed'
                  : 'text-[var(--mui-palette-text-primary)] bg-[var(--mui-palette-background-paper)] hover:bg-[var(--mui-palette-action-hover)]'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            className="rounded-lg p-6 w-full max-w-md shadow-xl"
            style={{ backgroundColor: 'var(--mui-palette-background-default)' }}
          >
            <h2 className="text-xl font-semibold text-[var(--mui-palette-text-primary)] mb-4">
              {editingAccount ? 'Edit Account' : 'Add New Account'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--mui-palette-text-primary)]">
                  Account Name
                </label>
                <input
                  type="text"
                  value={newAccount.account_name}
                  onChange={(e) => setNewAccount({ ...newAccount, account_name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--mui-palette-background-paper)] text-[var(--mui-palette-text-primary)] focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="Enter account name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--mui-palette-text-primary)]">
                  Account ID
                </label>
                <input
                  type="number"
                  value={newAccount.account_id}
                  onChange={(e) => setNewAccount({ ...newAccount, account_id: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--mui-palette-background-paper)] text-[var(--mui-palette-text-primary)] focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="Enter account ID"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={handleModalClose}
                className="px-4 py-2 text-[var(--mui-palette-text-primary)] rounded-md hover:bg-[var(--mui-palette-action-hover)]"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAccount}
                disabled={!newAccount.account_name || !newAccount.account_id}
                className={`px-4 py-2 rounded-md text-white transition-all duration-200 ${
                  !newAccount.account_name || !newAccount.account_id
                    ? 'bg-primaryLight cursor-not-allowed opacity-60'
                    : 'bg-primary hover:bg-[var(--mui-palette-primary-dark)]'
                }`}
              >
                {editingAccount ? 'Update' : 'Add'} Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
