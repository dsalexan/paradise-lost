/* global process */
const storage = 'localStorage'

const get = (key, defaultValue = null) => {
  if (!process.browser) return defaultValue
  if (window[storage].getItem(key) === 'undefined') return defaultValue
  return JSON.parse(window[storage].getItem(key) || JSON.stringify(defaultValue))
}

const set = (key, value) => {
  window[storage].setItem(key, JSON.stringify(value))
}

export default { get, set }
