import numeral from 'numeral'

numeral.register('locale', 'pt-br', {
  delimiters: {
    thousands: ' ',
    decimal: '.',
  },
  abbreviations: {
    thousand: 'k',
    million: 'm',
    billion: 'b',
    trillion: 't',
  },
  ordinal: function (number) {
    return number === 1 ? 'st' : number === 2 ? 'nd' : number === 3 ? 'rd' : 'th'
  },
  currency: {
    symbol: 'R$',
  },
})
numeral.locale('pt-br')

export default numeral
