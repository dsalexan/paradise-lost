import React from 'react'
import clsx from 'clsx'

import Accordion from '@material-ui/core/Accordion'
import AccordionSummary from '@material-ui/core/AccordionSummary'
import AccordionDetails from '@material-ui/core/AccordionDetails'
import Typography from '@material-ui/core/Typography'

import ChevronDown from 'mdi-material-ui/ChevronDown'
import ChevronUp from 'mdi-material-ui/ChevronUp'

const Root = ({ classes, children, placement, ...props } = {}) => {
  return <div className={clsx(classes.root, { [classes.right]: placement === 'right' })}>{children}</div>
}

export default Root
