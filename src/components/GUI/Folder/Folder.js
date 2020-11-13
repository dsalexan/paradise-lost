import React from 'react'
import Accordion from '@material-ui/core/Accordion'
import AccordionSummary from '@material-ui/core/AccordionSummary'
import AccordionDetails from '@material-ui/core/AccordionDetails'
import Typography from '@material-ui/core/Typography'

import ChevronDown from 'mdi-material-ui/ChevronDown'
import ChevronUp from 'mdi-material-ui/ChevronUp'
import useStoredState from '../../../lib/storedState'
import { get } from 'lodash'

const Folder = ({ classes, id, name, children, ...props }) => {
  const [open, setOpen] = useStoredState(`${id}-folder`, false)

  return (
    <Accordion className={classes.folder} expanded={open} onChange={(event, expanded) => setOpen(expanded)}>
      <AccordionSummary expandIcon={<ChevronDown></ChevronDown>}>
        <Typography>{name}</Typography>
      </AccordionSummary>
      <AccordionDetails className={get(classes, 'content')}>{children}</AccordionDetails>
    </Accordion>
  )
}

export default Folder
