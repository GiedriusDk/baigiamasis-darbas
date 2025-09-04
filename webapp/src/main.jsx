import React from 'react'
import ReactDOM from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import App from './App.jsx'

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="light" theme={{
      colors: { brand: ['#000000ff','#dbeafe','#bfdbfe','#93c5fd','#60a5fa','#3b82f6','#2563eb','#1d4ed8','#1e40af','#1e3a8a'] },
      primaryColor: 'brand',
      radius: { md: '12px', lg: '16px' },
    }}>
      <Notifications position="top-right" />
      <App />
    </MantineProvider>
  </React.StrictMode>
)
