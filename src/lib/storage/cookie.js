/* global process */
const set = (name, value, exp) => {
  if (!exp || exp === -1) {
    const date = new Date()
    date.setDate(date.getDate() + exp)
    exp = date
  }

  document.cookie = `${name}=${value}; expires=${exp.toGMTString()}; path=/`
}

const get = (name, cookie = null) => {
  const nameEquals = `${name}=`

  if (!cookie && !process.browser) return null
  const cookies = cookie ? cookie.split(';') : document.cookie.split(';')

  for (const cookie of cookies) {
    const cookiePair = cookie.trim()
    if (cookiePair.indexOf(nameEquals) === 0) return cookiePair.substring(nameEquals.length, cookiePair.length)
  }

  return null
}

const erase = (name) => set(name, '', -1)

export default { get, set, erase }
