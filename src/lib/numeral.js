import numeral from 'numeral'

numeral.register('locale', 'pt-br', {
  delimiters: {
    thousands: ' ',
    decimal: '.',
  },
})
numeral.locale('pt-br')

export default numeral
