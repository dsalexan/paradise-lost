import React from 'react'
import Accordion from '@material-ui/core/Accordion'
import AccordionSummary from '@material-ui/core/AccordionSummary'
import AccordionDetails from '@material-ui/core/AccordionDetails'
import Typography from '@material-ui/core/Typography'

import ChevronDown from 'mdi-material-ui/ChevronDown'
import ChevronUp from 'mdi-material-ui/ChevronUp'

const Root = ({ classes, children, panes, ...props } = {}) => {
  return <div className={classes.root}>{children}</div>
}

export default Root
