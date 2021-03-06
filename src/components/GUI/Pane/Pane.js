import React, { useState } from 'react'
import clsx from 'clsx'

import Accordion from '@material-ui/core/Accordion'
import AccordionSummary from '@material-ui/core/AccordionSummary'
import AccordionDetails from '@material-ui/core/AccordionDetails'
import Typography from '@material-ui/core/Typography'
import SvgIcon from '@material-ui/core/SvgIcon'

import CollapseAll from 'mdi-material-ui/CollapseAll'
import ExpandAll from 'mdi-material-ui/ExpandAll'
import ChevronUp from 'mdi-material-ui/ChevronUp'

import Collapse from '@material-ui/core/Collapse'

import { IconButton, Tooltip } from '@material-ui/core'
import useStoredState from '../../../lib/storedState'

const Pane = ({ classes, id, name, icon, placement, children, ...props }) => {
  const [open, setOpen] = useStoredState(`${id}-pane`, false)

  const counterPlacement = placement === 'right' ? 'left' : 'right'

  return (
    <div className={classes.pane}>
      {placement === 'right' ? (
        <>
          <Collapse style={{ flexGrow: 1 }} in={open}>
            {children}
          </Collapse>

          <div className={classes.tab}>
            <IconButton
              className={classes.thumbnail}
              onClick={() => setOpen(!open)}
              color={open ? 'primary' : 'default'}
            >
              <SvgIcon>{icon}</SvgIcon>
            </IconButton>
            <div className={clsx(classes.label, { light: !open })}>{name}</div>
          </div>
        </>
      ) : (
        <>
          <div className={classes.tab}>
            <IconButton
              className={classes.thumbnail}
              onClick={() => setOpen(!open)}
              color={open ? 'primary' : 'default'}
            >
              <SvgIcon>{icon}</SvgIcon>
            </IconButton>
            <div className={clsx(classes.label, { light: !open })}>{name}</div>
          </div>

          <Collapse style={{ flexGrow: 1 }} in={open}>
            {children}
          </Collapse>
        </>
      )}
    </div>
  )
}

export default Pane
