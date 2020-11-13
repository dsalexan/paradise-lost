import humanId from 'human-id'

// const customConfig = {
//   dictionaries: [countries, adjectives, colors, animals],
//   separator: '-',
//   length: 3,
// }

export default function generate(config) {
  return humanId(
    config || {
      separator: '-',
      capitalize: false,
    }
  )
}
