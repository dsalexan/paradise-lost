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
  denseFormControl: {
    '& .MuiOutlinedInput-input': {
      padding: theme.spacing(1, 1.5),
      paddingTop: theme.spacing(1),
      paddingBottom: theme.spacing(1),
    },
    '& .MuiSelect-icon': {
      top: 'auto',
    },
  },
  //
  monitor: {
    borderRadius: 4,
    width: '100%',
    background: 'rgba(0, 0, 0, 0.15)',

    color: theme.palette.primary.main,
    display: 'inline-flex',
    position: 'relative',
    fontSize: '0.7142857142857143rem',
    boxSizing: 'border-box',
    alignItems: 'center',
    fontFamily: '"Nunito", "Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: 400,
    lineHeight: '1.1876em',
  },
  monitorData: {
    padding: theme.spacing(1, 1.5),
    width: '100%',
    border: 0,
    height: '1.1876em',
    margin: 0,
    display: 'block',
    minWidth: 0,
    background: 'none',
    boxSizing: 'content-box',
    animationName: 'mui-auto-fill-cancel',
    letterSpacing: 'inherit',
    animationDuration: '10ms',

    '& a': {
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
