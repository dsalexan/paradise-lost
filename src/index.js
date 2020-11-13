import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import * as serviceWorker from './serviceWorker'

import { ThemeProvider } from '@material-ui/core'
import theme from './theme'

import { StoreProvider } from './components/Store'

// SETTING DEBUG
let debug = ['*']
debug = ['paradise-lost*', 'three*']
debug = [...debug, '-engine.io-client:*', '-socket.io-client:*', '-socket.io-client*']
localStorage.debug = debug.join(',')

ReactDOM.render(
  <ThemeProvider theme={theme}>
    <StoreProvider>
      <App />
    </StoreProvider>
  </ThemeProvider>,
  document.getElementById('root')
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
