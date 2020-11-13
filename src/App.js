import React, { useRef, useEffect, useState, Suspense, useMemo } from 'react'
import './App.scss'

import Home from './pages/home'

import log from './debug'

export default function App() {
  return (
    <>
      <Home></Home>
    </>
  )
}
