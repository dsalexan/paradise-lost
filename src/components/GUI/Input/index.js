import Input from './Input'

import chroma from 'chroma-js'

import { withStyles } from '@material-ui/core'

export default withStyles((theme) => ({
  wrapper: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: '100px auto',
    gridTemplateRows: 'auto',

    '& > div': {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    },
  },
  fullRow: {
    gridTemplateColumns: 'auto',
  },
  label: {
    fontSize: 12,
    color: 'darkgray',
    marginRight: theme.spacing(1),

    '&.light, & .light': {
      opacity: 0.25,
    },
  },
  input: {},

  // BUTTON
  compositeButton: {
    textTransform: 'initial',
  },
  compositeButton_body: {
    fontWeight: 400,
    color: chroma(theme.palette.primary.main).desaturate(2).darken().hex(),
  },
}))(Input)
