// Dynamic Import
import dynamic from 'next/dynamic'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

// Dynamically load the client component (disable SSR)
const Login = dynamic(() => import('@views/Login'), { ssr: false })

export const metadata = {
  title: 'Login',
  description: 'Login to your account'
}

const LoginPage = async () => {
  // Vars
  const mode = await getServerMode()

  return <Login mode={mode} />
}

export default LoginPage
