import { useContext } from 'react'
import Context from './Context'

const Hook = () => {
  const context = useContext(Context)
  return context
}

export default Hook
