import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ChurchProvider } from './context/ChurchContext'
import { AppLayout } from './components/layout/AppLayout'
import { Dashboard } from './pages/Dashboard'
import { Members } from './pages/Members'
import { MemberProfile } from './pages/MemberProfile'
import { Contributions } from './pages/Contributions'
import { NotFound } from './pages/NotFound'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'members', element: <Members /> },
      { path: 'members/:memberId', element: <MemberProfile /> },
      { path: 'contributions', element: <Contributions /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

export default function App() {
  return (
    <ChurchProvider>
      <RouterProvider router={router} />
    </ChurchProvider>
  )
}
