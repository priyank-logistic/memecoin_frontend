// HOC Imports
// import GuestOnlyRoute from '@/hocs/GuestOnlyRoute'

// const Layout = async props => {
//   const params = await props.params
//   const { children } = props

//   return <GuestOnlyRoute lang={params.lang}>{children}</GuestOnlyRoute>
// }

// export default Layout

const Layout = async props => {
  const { children } = props

  return <>{children}</>
}

export default Layout
