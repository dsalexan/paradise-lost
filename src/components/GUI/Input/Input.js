import React from 'react'

import clsx from 'clsx'

import Accordion from '@material-ui/core/Accordion'
import AccordionSummary from '@material-ui/core/AccordionSummary'
import AccordionDetails from '@material-ui/core/AccordionDetails'
import Typography from '@material-ui/core/Typography'

import ChevronDown from 'mdi-material-ui/ChevronDown'
import ChevronUp from 'mdi-material-ui/ChevronUp'
import { Button, TextField } from '@material-ui/core'

import useStateFromObservable from '../../../lib/stateFromObservable'
import { type } from '../../../lib/lodash/type'
import { flatten } from 'lodash'
import Number from './Number'

const Input = ({ classes, children, label, value: _value, disabled, ...props } = {}) => {
  const [value, setValue] = useStateFromObservable(_value)

  const valueType = type(value)
  // for "undefined" as a type, means observable is not behaviour
  //      so, input must be a button (that calls next)

  const fullRow = valueType === 'undefined'

  const [mainLabel, secondaryLabel] = flatten([label])

  return (
    <div className={clsx({ [classes.wrapper]: true, [classes.fullRow]: fullRow })}>
      <div className={classes.label} style={{ display: fullRow ? 'none' : '' }}>
        <i>{label}</i>
      </div>
      <div className={classes.input}>
        {valueType === 'string' ? (
          <TextField
            disabled={disabled}
            variant="outlined"
            fullWidth
            size="small"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          ></TextField>
        ) : valueType === 'undefined' ? (
          <Button disabled={disabled} variant="outlined" color="primary" onClick={(event) => setValue(event)}>
            {secondaryLabel ? (
              <div className={classes.compositeButton}>
                <div>{mainLabel.toUpperCase()}</div>
                <div className={classes.compositeButton_body}>{secondaryLabel}</div>
              </div>
            ) : (
              mainLabel
            )}
          </Button>
        ) : valueType === 'integer' ? (
          <Number
            disabled={disabled}
            variant="outlined"
            color="primary"
            size="small"
            fullWidth
            value={value}
            onChange={(value) => console.log('NUMBER VALUE', value) && setValue(value)}
          ></Number>
        ) : (
          <b className={classes.label}>Variable type ({valueType}) not implemented</b>
        )}
      </div>
      {children}
    </div>
  )
}

export default Input
