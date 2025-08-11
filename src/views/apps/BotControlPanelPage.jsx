'use client'
import React, { useState, useEffect } from 'react'

import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Divider,
  InputAdornment,
  Grid,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
  Tooltip
} from '@mui/material'
import {
  Speed,
  Bolt,
  AccessTime,
  PercentOutlined,
  AttachMoney,
  Shield,
  Rocket,
  InfoOutlined,
  SaveAlt,
  Sync,
  Check,
  ShoppingCart
} from '@mui/icons-material'
import MoneyIcon from '@mui/icons-material/Money';
import { blue, green, orange, red, grey } from '@mui/material/colors'
import { styled } from '@mui/material/styles'
import { motion } from 'framer-motion'

import axiosInstance from '@/utils/axiosInstance'

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  overflow: 'visible',
  border: '1px solid var(--mui-palette-divider)',
  borderRadius: '20px'
}))

const ParameterCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: 8,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 6px 12px rgba(0,0,0,0.1)',
    transform: 'translateY(-2px)'
  }
}))

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)'
    }
  },
  '& .MuiInputAdornment-root': {
    color: theme.palette.text.secondary
  }
}))

const ParameterInput = ({ label, value, onChange, min, max, step, icon, unit, tooltip, type = 'number' }) => (
  <Box sx={{ width: '100%', mb: 3 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
      {icon}
      <Typography variant='subtitle2' sx={{ ml: 1, fontWeight: 500 }}>
        {label}
      </Typography>
      {tooltip && (
        <Tooltip title={tooltip} arrow placement='top'>
          <InfoOutlined fontSize='small' sx={{ ml: 1, color: grey[500], cursor: 'help' }} />
        </Tooltip>
      )}
    </Box>
    <StyledTextField
      fullWidth
      variant='outlined'
      size='small'
      type={type}
      value={value}
      onChange={e => {
        const newValue = parseFloat(e.target.value)

        if (!isNaN(newValue) && newValue >= min && newValue <= max) {
          onChange(null, newValue)
        }
      }}
      inputProps={{
        min,
        max,
        step
      }}
      InputProps={{
        startAdornment: icon && (
          <InputAdornment position='start' sx={{ color: 'inherit' }}>
            {icon}
          </InputAdornment>
        ),
        endAdornment: unit && (
          <InputAdornment position='end' sx={{ color: 'text.secondary' }}>
            {unit}
          </InputAdornment>
        ),
        sx: {
          backgroundColor: 'background.paper'
        }
      }}
      sx={{
        '& .MuiOutlinedInput-input': {
          padding: '10px 14px'
        }
      }}
    />
  </Box>
)

const BotControlPanelPage = () => {
  const [botSettings, setBotSettings] = useState({
    maxSolPerTrade: 0.01,
    targetProfit: 20,
    stopLossPercent: 10,
    autoSellTimeout: 60,
    priority: 'VeryHigh',
    initialBuyValue: 0.001,
    minimumBuyValue:0.01
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [originalSettings, setOriginalSettings] = useState(null)

  useEffect(() => {
    const fetchBotSettings = async () => {

      try {
        setIsLoading(true)
        const response = await axiosInstance.get('/bot-control/')

        if (response.data) {
          const fetchedSettings = {
            maxSolPerTrade: parseFloat(response.data.max_sol_per_trade),
            targetProfit: parseFloat(response.data.tp),
            stopLossPercent: parseFloat(response.data.sl),
            autoSellTimeout: response.data.sl_time_out,
            priority: response.data.priority,
            initialBuyValue: parseFloat(response.data.initial_value_buy_trade),
            minimumBuyValue: parseFloat(response.data.minimum_buy_value || 0.00)
          }

          setBotSettings(fetchedSettings)
          setOriginalSettings(JSON.parse(JSON.stringify(fetchedSettings)))
        }
      } catch (err) {
        console.error('Error fetching bot settings:', err)
        setError('Failed to load bot settings')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBotSettings()
  }, [])

  const isSettingsChanged = () => {
    if (!originalSettings) return false

    return JSON.stringify(botSettings) !== JSON.stringify(originalSettings)
  }

  // Handle changes
  const handleMaxSolChange = (event, newValue) => {
    setBotSettings(prev => ({ ...prev, maxSolPerTrade: newValue }))
  }

  const handleTargetProfitChange = (event, newValue) => {
    setBotSettings(prev => ({ ...prev, targetProfit: newValue }))
  }

  const handleStopLossChange = (event, newValue) => {
    setBotSettings(prev => ({ ...prev, stopLossPercent: newValue }))
  }

  const handleAutoSellTimeoutChange = (event, newValue) => {
    setBotSettings(prev => ({ ...prev, autoSellTimeout: newValue }))
  }

  const handlePriority = (event, newValue) => {
    if (newValue !== null) {
      setBotSettings(prev => ({ ...prev, priority: newValue }))
    }
  }

  const handleInitialBuyValueChange = (event, newValue) => {
    setBotSettings(prev => ({ ...prev, initialBuyValue: newValue }))
  }

  const handleMinimumBuyValueChange = (event, newValue) => {
    setBotSettings(prev => ({ ...prev, minimumBuyValue: newValue }))
  }

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true)
      setSaveSuccess(false)
      setError(null)

      const requestBody = {
        sl: botSettings.stopLossPercent.toFixed(9),
        tp: botSettings.targetProfit.toFixed(9),
        speed_of_trade: 3,
        max_sol_per_trade: botSettings.maxSolPerTrade.toFixed(9),
        sl_time_out: botSettings.autoSellTimeout,
        initial_value_buy_trade: botSettings.initialBuyValue.toFixed(9),
        minimum_value_buy_trade: botSettings.minimumBuyValue.toFixed(9),
        priority: botSettings.priority
      }

      const response = await axiosInstance.put('/bot-control/', requestBody)

      if (response.status === 200) {
        setSaveSuccess(true)

        // Update original settings to reflect the newly saved state
        setOriginalSettings(JSON.parse(JSON.stringify(botSettings)))

        // Hide success message after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (err) {
      console.error('Error saving bot settings:', err)
      setError('Failed to save bot settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary'></div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert severity='error' sx={{ m: 2 }}>
        {error}
      </Alert>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <StyledCard>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant='h5' fontWeight={700}>
              <Bolt sx={{ mr: 1, verticalAlign: 'middle' }} />
              Trading Bot Control Panel
            </Typography>
          </Box>

          <Divider sx={{ mb: 4 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant='h6' sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <AttachMoney fontSize='small' sx={{ mr: 1, color: blue[500] }} />
                Trade Parameters
              </Typography>

              <Grid container spacing={2} style={{ marginTop: '15px' }}>
                <Grid item xs={12}>
                  <ParameterCard>
                    <ParameterInput
                      label='Initial Buy Value'
                      value={botSettings.initialBuyValue}
                      onChange={handleInitialBuyValueChange}
                      min={0.0}
                      max={Infinity}
                      step={0.001}
                      icon={<ShoppingCart fontSize='small' sx={{ color: green[500] }} />}
                      unit='SOL'
                      tooltip='The initial amount of SOL to use when opening a trade'
                    />
                  </ParameterCard>
                </Grid>

                <Grid item xs={12}>
                  <ParameterCard>
                    <ParameterInput
                      label='Minimum Buy Value'
                      value={botSettings.minimumBuyValue}
                      onChange={handleMinimumBuyValueChange}
                      min={0.0}
                      max={Infinity}
                      step={0.01}
                      icon={<ShoppingCart fontSize='small' sx={{ color: green[500] }} />}
                      unit='SOL'
                      tooltip='The minimum amount of SOL to use when opening a trade'
                    />
                  </ParameterCard>
                </Grid>

                <Grid item xs={12} style={{ marginTop: '15px' }}>
                  <ParameterCard>
                    <ParameterInput
                      label='Maximum SOL Per Trade'
                      value={botSettings.maxSolPerTrade}
                      onChange={handleMaxSolChange}
                      min={0.0}
                      max={Infinity}
                      step={0.001}

                      // icon={<SolanaLogo style={{ width: 20, height: 20, color: blue[500] }} />}

                      icon={<MoneyIcon fontSize='small' sx={{ color: blue[500] }} />}
                      unit='SOL'
                      tooltip='The maximum amount of SOL the bot will use for any single trade'
                    />
                  </ParameterCard>
                </Grid>

                <Grid item xs={12} style={{ marginTop: '15px' }}>
                  <ParameterCard>
                    <ParameterInput
                      label='Target Profit Percentage'
                      value={botSettings.targetProfit}
                      onChange={handleTargetProfitChange}
                      min={1}
                      max={100}
                      step={0.1}
                      icon={<PercentOutlined fontSize='small' sx={{ color: green[500] }} />}
                      unit='%'
                      tooltip='The bot will attempt to sell when this profit target is reached'
                    />
                  </ParameterCard>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant='h6' sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Shield fontSize='small' sx={{ mr: 1, color: red[500] }} />
                Risk Management
              </Typography>

              <Grid container spacing={2} style={{ marginTop: '12px' }}>
                <Grid item xs={12}>
                  <ParameterCard>
                    <ParameterInput
                      label='Stop-Loss Percentage'
                      value={botSettings.stopLossPercent}
                      onChange={handleStopLossChange}
                      min={1}
                      max={100}
                      step={0.1}
                      icon={<PercentOutlined fontSize='small' sx={{ color: red[500] }} />}
                      unit='%'
                      tooltip='The bot will sell if the price drops by this percentage'
                    />
                  </ParameterCard>
                </Grid>

                <Grid item xs={12} style={{ marginTop: '15px' }}>
                  <ParameterCard>
                    <ParameterInput
                      label='Auto-Sell Timeout'
                      value={botSettings.autoSellTimeout}
                      onChange={handleAutoSellTimeoutChange}
                      min={1}
                      max={Infinity}
                      step={1}
                      type='number'
                      icon={<AccessTime fontSize='small' sx={{ color: orange[500] }} />}
                      unit='Sec'
                      tooltip='The bot will automatically sell after this many minutes'
                    />
                  </ParameterCard>
                </Grid>

                <Grid item xs={12} style={{ marginTop: '15px' }}>
                  <ParameterCard style={{ marginBottom: '10px' }}>
                    <Typography style={{ marginTop: '10px' }} variant='subtitle1' fontWeight={500} gutterBottom>
                      Priority
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <ToggleButtonGroup
                        value={botSettings.priority}
                        exclusive
                        onChange={handlePriority}
                        aria-label='Priority'
                        fullWidth
                        sx={{ mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}
                      >
                        <ToggleButton value='Low' aria-label='Low'>
                          <Speed fontSize='small' sx={{ mr: 1, color: blue[300] }} />
                          Low
                        </ToggleButton>
                        <ToggleButton value='Medium' aria-label='Medium'>
                          <Speed fontSize='small' sx={{ mr: 1, color: blue[500] }} />
                          Medium
                        </ToggleButton>
                        <ToggleButton value='High' aria-label='High'>
                          <Speed fontSize='small' sx={{ mr: 1, color: blue[700] }} />
                          High
                        </ToggleButton>
                        <ToggleButton value='VeryHigh' aria-label='VeryHigh'>
                          <Bolt fontSize='small' sx={{ mr: 1, color: orange[500] }} />
                          VeryHigh
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Box>
                  </ParameterCard>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            {saveSuccess && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert icon={<Check fontSize='inherit' />} severity='success' sx={{ mr: 2 }}>
                  Settings saved successfully
                </Alert>
              </motion.div>
            )}
            <Button
              variant='outlined'
              color='primary'
              startIcon={<SaveAlt />}
              sx={{
                borderRadius: 2,
                opacity: isSettingsChanged() ? 1 : 0.6,
                pointerEvents: isSettingsChanged() ? 'auto' : 'none'
              }}
              disabled={!isSettingsChanged() || isSaving}
              onClick={handleSaveSettings}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </Box>
        </CardContent>
      </StyledCard>
    </motion.div>
  )
}

export default BotControlPanelPage
