import Input from './Input'

import chroma from 'chroma-js'

import { withStyles } from '@material-ui/core'

export default withStyles((theme) => ({
  wrapper: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: '100px auto',
    gridTemplateRows: 'auto',
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

    '&.monitor': {
      // color: theme.palette.primary.main,
    },

    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  input: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  disableableInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  //
  monitor: {
    '& .MuiInputBase-root.Mui-disabled': {
      color: theme.palette.primary.main,
    },
  },

  // BUTTON
  compositeButton: {
    textTransform: 'initial',
  },
  compositeButton_body: {
    fontWeight: 400,
    color: chroma(theme.palette.primary.main).desaturate(2).darken().hex(),
  },
}))(Input)
