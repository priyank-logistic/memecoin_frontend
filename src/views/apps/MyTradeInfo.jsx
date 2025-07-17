'use client'
import { useState, useEffect } from 'react'

import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Button,
  Box,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider
} from '@mui/material'
import { green, red, blue } from '@mui/material/colors'
import {
  ArrowUpward,
  ArrowDownward,
  ChevronLeft,
  ChevronRight,
  CalendarToday,
  AccessTime,
  FilterAlt
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { styled } from '@mui/material/styles'
import { DatePicker } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import dayjs from 'dayjs'
import { toast } from 'react-toastify'

import axiosInstance from '@/utils/axiosInstance'

const statusConfig = {
  open: { color: green[500], icon: <ArrowUpward fontSize='small' /> },
  closed: { color: blue[500], icon: <AccessTime fontSize='small' /> }
}

const StatusChip = styled(Chip)(({ status }) => ({
  backgroundColor: statusConfig[status]?.color || 'grey',
  color: 'white',
  fontWeight: 600,
  padding: '0 8px'
}))

const ProfitChip = styled(Chip)(({ profit }) => ({
  backgroundColor: profit >= 0 ? green[100] : red[100],
  color: profit >= 0 ? green[800] : red[800],
  fontWeight: 600,
  padding: '0 8px',
  '& .MuiChip-icon': {
    color: profit >= 0 ? green[800] : red[800]
  }
}))

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover
  },
  '&:last-child td, &:last-child th': {
    border: 0
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected
  }
}))

const MyTradeInfoView = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [loading, setLoading] = useState(false)

  // const [error, setError] = useState(null)
  const [selectedToken, setSelectedToken] = useState('All')

  // Server-side pagination states
  const [pagination, setPagination] = useState({
    count: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 5,
    nextPage: null,
    previousPage: null
  })

  const [trades, setTrades] = useState([])

  // Extract unique tokens from data
  const [uniqueTokens, setUniqueTokens] = useState(['All'])

  const fetchTrades = async (page = 1, pageSize = pagination.pageSize) => {
    setLoading(true)

    // setError(null)

    try {
      const dateStr = selectedDate.format('YYYY-MM-DD')
      const todayStr = dayjs().format('YYYY-MM-DD')

      if (dayjs(dateStr).isAfter(todayStr)) {
        setTrades([])
        setLoading(false)
        toast.warning('Please select a proper date, future dates are not allowed.', { autoClose: 3000 })

        return
      }

      let url = `/trade?date=${dateStr}&page=${page}&page_size=${pageSize}`

      if (selectedToken && selectedToken !== 'All') {
        url += `&symbol=${selectedToken}`
      }

      const response = await axiosInstance.get(url)
      const { results, count, total_pages, current_page, next_page, previous_page } = response.data

      setTrades(results)
      setPagination({
        count,
        totalPages: total_pages,
        currentPage: current_page,
        pageSize,
        nextPage: next_page,
        previousPage: previous_page
      })

      // Update unique tokens list
      const tokens = ['All', ...new Set(results.map(trade => trade.token_symbol))]

      setUniqueTokens(tokens)
    } catch (err) {
      // setError(err.message)
      console.error('Error fetching trades:', err)
      toast.error(err.response?.data?.message || 'Failed to fetch trades', { autoClose: 3000 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrades()
  }, [selectedDate, selectedToken])

  const handlePreviousDay = () => {
    setSelectedDate(prev => prev.subtract(1, 'day'))
  }

  const handleNextDay = () => {
    setSelectedDate(prev => prev.add(1, 'day'))
  }

  const formatDateTime = dateString => {
    return dayjs(dateString).format('HH:mm:ss')
  }

  const getProfitValue = profitStr => {
    if (profitStr == null) return 0

    const str = String(profitStr)

    return parseFloat(str.replace('+', '').replace('-', ''))
  }

  const isProfit = profitStr => {
    if (typeof profitStr === 'number') return profitStr >= 0
    if (typeof profitStr === 'string') return profitStr.includes('+')

    return false
  }

  const calculateTotalPL = () => {
    return trades.reduce((acc, trade) => {
      const profitValue = getProfitValue(trade.profit)

      return acc + (isProfit(trade.profit) ? profitValue : -profitValue)
    }, 0)
  }

  const handlePageChange = newPage => {
    fetchTrades(newPage)
  }

  const handlePageSizeChange = event => {
    const newSize = parseInt(event.target.value, 10)

    setPagination(prev => ({ ...prev, pageSize: newSize }))
    fetchTrades(1, newSize)
  }

  const renderTableRows = () => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={7} align='center'>
            Loading trades...
          </TableCell>
        </TableRow>
      )
    }

    if (trades.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={7} align='center'>
            No trades found for selected criteria
          </TableCell>
        </TableRow>
      )
    }

    return trades.map(trade => {
      const profitValue = getProfitValue(trade.profit)
      const isProfitable = isProfit(trade.profit)

      return (
        <StyledTableRow key={trade.created_at + trade.token_symbol}>
          <TableCell>{formatDateTime(trade.created_at)}</TableCell>
          <TableCell>{trade.token_symbol}</TableCell>
          <TableCell>{trade.token_amount}</TableCell>
          <TableCell align='center'> {trade.open_price ? Number(trade.open_price).toFixed(15) : '-'}</TableCell>
          <TableCell align='center'>{trade.close_price ? Number(trade.close_price).toFixed(15) : '-'}</TableCell>
          <TableCell align='center'>
            {trade.profit ? (
              <ProfitChip
                label={(isProfit(trade.profit) ? '+' : '-') + getProfitValue(trade.profit).toFixed(15)}
                profit={isProfit(trade.profit) ? 1 : -1}
                size='small'
                icon={isProfit(trade.profit) ? <ArrowUpward fontSize='small' /> : <ArrowDownward fontSize='small' />}
              />
            ) : (
              '-'
            )}
          </TableCell>
          <TableCell align='center'>
            <StatusChip
              label={trade.status}
              size='small'
              status={trade.status}
              icon={statusConfig[trade.status]?.icon}
            />
          </TableCell>
        </StyledTableRow>
      )
    })
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
            overflow: 'visible',
            border: '1px solid var(--mui-palette-divider)'
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant='h5' fontWeight={700}>
                Trade History
              </Typography>
            </Box>

            {/* {error && (
              <Box sx={{ mb: 3, color: 'error.main' }}>
                <Typography>Error loading trades: {error}</Typography>
              </Box>
            )} */}

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
                mb: 3
              }}
            >
              <FormControl sx={{ minWidth: 180, width: { xs: '100%', sm: 'auto' } }} size='small'>
                <InputLabel id='token-select-label'>Token</InputLabel>
                <Select
                  labelId='token-select-label'
                  id='token-select'
                  value={selectedToken}
                  label='Token'
                  onChange={e => setSelectedToken(e.target.value)}
                  startAdornment={<FilterAlt sx={{ mr: 0.5 }} />}
                  disabled={loading}
                >
                  {uniqueTokens.map(token => (
                    <MenuItem key={token} value={token}>
                      {token}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: 'center',
                  gap: 2,
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                <Box sx={{ display: 'flex', width: { xs: '100%', sm: 'auto' } }}>
                  <Button
                    variant='outlined'
                    onClick={handlePreviousDay}
                    startIcon={<ChevronLeft />}
                    fullWidth={true}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                    disabled={loading}
                  >
                    Previous
                  </Button>
                </Box>

                <DatePicker
                  value={selectedDate}
                  onChange={newValue => setSelectedDate(newValue)}
                  format='MM/DD/YYYY'
                  disabled={loading}
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: {
                        width: { xs: '100%', sm: 200 },
                        height: 40
                      },
                      InputProps: {
                        startAdornment: <CalendarToday sx={{ mr: 1 }} />
                      }
                    }
                  }}
                />

                <Box sx={{ display: 'flex', width: { xs: '100%', sm: 'auto' } }}>
                  <Button
                    variant='outlined'
                    onClick={handleNextDay}
                    endIcon={<ChevronRight />}
                    fullWidth={true}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                    disabled={loading}
                  >
                    Next
                  </Button>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <FormControl size='small' sx={{ minWidth: 120 }}>
                  <InputLabel id='rows-per-page-label'>Rows Per Page</InputLabel>
                  <Select
                    labelId='rows-per-page-label'
                    id='rows-per-page'
                    value={pagination.pageSize}
                    label='Rows Per Page'
                    onChange={handlePageSizeChange}
                    disabled={loading}
                  >
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={25}>25</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Typography variant='h6'>
                Total P&L:{' '}
                <Typography
                  component='span'
                  color={calculateTotalPL() >= 0 ? 'success.main' : 'error.main'}
                  fontWeight={600}
                >
                  {calculateTotalPL().toLocaleString('fullwide', {
                    useGrouping: false,
                    maximumFractionDigits: 100
                  })}
                </Typography>
               {' '} SOL
              </Typography>
            </Box>

            {/* Token Heading Display */}
            {selectedToken !== 'All' && (
              <Box sx={{ mb: 7, mt: 5 }}>
                <Typography variant='h4' fontWeight={700} color='primary'>
                  {selectedToken}
                </Typography>
                <Typography variant='subtitle1' color='text.secondary'>
                  Trades for {selectedDate.format('MMMM D, YYYY')}
                </Typography>
                <Divider sx={{ mt: 1 }} />
              </Box>
            )}

            <TableContainer component={Paper} sx={{ boxShadow: 'none', mb: 1 }}>
              <Table sx={{ minWidth: 650 }} aria-label='trade information table'>
                <TableHead>
                  <TableRow>
                    <TableCell>Order Time</TableCell>
                    <TableCell>Token</TableCell>
                    <TableCell>Token Amount</TableCell>
                    <TableCell align='center'>Entry Price</TableCell>
                    <TableCell align='center'>Close Price</TableCell>
                    <TableCell align='center'>Profit</TableCell>
                    <TableCell align='center'>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>{renderTableRows()}</TableBody>
              </Table>
            </TableContainer>

            {/* Server-side Pagination */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 2,
                mb: 1,
                px: 1
              }}
            >
              <Typography color='text.secondary' style={{ fontSize: '0.875rem' }}>
                Showing {trades.length > 0 ? (pagination.currentPage - 1) * pagination.pageSize + 1 : 0}-
                {Math.min(pagination.currentPage * pagination.pageSize, pagination.count)} of {pagination.count} trades
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, mt: 2.5 }}>
                <button
                  onClick={() => handlePageChange(pagination.previousPage)}
                  disabled={!pagination.previousPage || loading}
                  className={`px-3 py-1 rounded-md border text-sm font-medium ${
                    !pagination.previousPage || loading
                      ? 'text-[var(--mui-palette-text-disabled)] bg-[var(--mui-palette-background-paper)] cursor-not-allowed'
                      : 'text-[var(--mui-palette-text-primary)] bg-[var(--mui-palette-background-paper)] hover:bg-[var(--mui-palette-action-hover)]'
                  }`}
                >
                  Previous
                </button>

                <button
                  onClick={() => handlePageChange(pagination.nextPage)}
                  disabled={!pagination.nextPage || loading}
                  className={`px-3 py-1 rounded-md border text-sm font-medium ${
                    !pagination.nextPage || loading
                      ? 'text-[var(--mui-palette-text-disabled)] bg-[var(--mui-palette-background-paper)] cursor-not-allowed'
                      : 'text-[var(--mui-palette-text-primary)] bg-[var(--mui-palette-background-paper)] hover:bg-[var(--mui-palette-action-hover)]'
                  }`}
                >
                  Next
                </button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </LocalizationProvider>
  )
}

export default MyTradeInfoView
