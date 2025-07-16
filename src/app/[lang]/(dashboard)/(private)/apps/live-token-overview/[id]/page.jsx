// 'use client'

// import { useParams } from 'next/navigation'

// export default function LiveTokenOverviewPage() {
//   const params = useParams()
//   const token = params.token

//   return (
//     <div>
//       <h1>Live Overview for Token: {token}</h1>
//     </div>
//   )
// }


import LiveTokenOverviewView from "@/views/apps/LiveTokenOverviewView"


const LiveTokenOverviewPage = () => {
  return <LiveTokenOverviewView />
}

export default LiveTokenOverviewPage
