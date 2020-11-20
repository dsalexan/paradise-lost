import History from './History'

import chroma from 'chroma-js'

import { withStyles } from '@material-ui/core'

export default withStyles((theme) => ({
  wrapper: {
    width: '100%',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '50px auto 50px',
    gridTemplateRows: 'auto auto',
    gridTemplateAreas: "'prev monitor next' 'prev2 monitor next2'",
    gap: `${theme.spacing(1)}px`,
  },
  button: {
    minWidth: 'auto',
  },
  prev: {
    gridArea: 'prev',
  },
  prev2: {
    gridArea: 'prev2',
  },
  next: {
    gridArea: 'next',
  },
  next2: {
    gridArea: 'next2',
  },
  //
  monitor: {
    gridArea: 'monitor',
    width: '100%',

    color: theme.palette.primary.main,
    fontSize: '0.7142857142857143rem',
    boxSizing: 'border-box',
    alignItems: 'center',
    fontFamily: '"Nunito", "Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: 400,
    lineHeight: '1.1876em',
  },
  monitorData: {
    borderRadius: 4,
    padding: theme.spacing(1, 1.5),
    background: 'rgba(0, 0, 0, 0.15)',
    flexGrow: 1,
    display: 'block',
    minWidth: 0,
    boxSizing: 'content-box',
    animationName: 'mui-auto-fill-cancel',
    letterSpacing: 'inherit',
    animationDuration: '10ms',
    height: 'auto',
    marginTop: theme.spacing(1),

    '&:first-of-type': {
      marginTop: 0,
    },

    '& a': {
      color: theme.palette.primary.main,
    },
  },
  monitorButton: {
    marginBottom: theme.spacing(1),
  },

  //
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
  //

  // BUTTON
  compositeButton: {
    textTransform: 'initial',
  },
  compositeButton_body: {
    fontWeight: 400,
    color: chroma(theme.palette.primary.main).desaturate(2).darken().hex(),
  },
}))(History)
