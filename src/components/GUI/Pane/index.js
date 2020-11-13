import Pane from './Pane'

import { withStyles } from '@material-ui/core'

export default withStyles((theme) => ({
  pane: {
    padding: theme.spacing(0.5, 0),
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    width: 64,
    margin: theme.spacing(0, 1),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  thumbnail: {},
  label: {
    fontSize: 12,
    color: theme.palette.primary.main,

    '&.light': {
      color: 'grey',
    },
  },
  //
  drawer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    padding: theme.spacing(0.75),
    '&:hover': {
      '& svg': {
        color: 'white !important',
      },
    },
  },
  icon: {
    color: 'darkgray',
    fontSize: 12,

    '&:hover': {
      color: 'white',
    },
  },
}))(Pane)
