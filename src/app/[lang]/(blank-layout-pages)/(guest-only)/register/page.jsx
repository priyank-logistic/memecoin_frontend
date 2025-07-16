// Dynamic Import
import dynamic from 'next/dynamic'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

// Dynamically load the client component (disable SSR)
const Register = dynamic(() => import('@views/Register'), { ssr: false })

export const metadata = {
  title: 'Register',
  description: 'Register to your account'
}

const RegisterPage = async () => {
  // Vars
  const mode = await getServerMode()

  return <Register mode={mode} />
}

export default RegisterPage
