import Root from './Root'

import { withStyles } from '@material-ui/core'

export default withStyles((theme) => ({
  root: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: 500,
    padding: theme.spacing(0.5, 0),
  },
}))(Root)
