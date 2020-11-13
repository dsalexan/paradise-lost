import Folder from './Folder'

import { withStyles } from '@material-ui/core'

export default withStyles((theme) => ({
  folder: {
    flexGrow: 1,
  },
  content: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',

    display: 'flex',
    flexDirection: 'column',
    '& > div': {
      marginTop: theme.spacing(1),
    },
  },
}))(Folder)
