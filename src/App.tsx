import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './App.css'
import { router } from './router/router'
import { AppConfigProvider } from './core/appConfigProvider'

function App() {
  return (
    <>
      <AppConfigProvider>
        <RouterProvider router={router} />
      </AppConfigProvider>
      <Toaster position="top-right" />
    </>
  )
}

export default App
