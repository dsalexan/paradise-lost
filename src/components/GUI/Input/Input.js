import React, { useMemo } from 'react'

import clsx from 'clsx'

import Accordion from '@material-ui/core/Accordion'
import AccordionSummary from '@material-ui/core/AccordionSummary'
import AccordionDetails from '@material-ui/core/AccordionDetails'
import Typography from '@material-ui/core/Typography'

import LockOff from 'mdi-material-ui/LockOff'
import LockOutline from 'mdi-material-ui/LockOutline'

import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
} from '@material-ui/core'

import useStateFromObservable from '../../../lib/stateFromObservable'
import { type } from '../../../lib/lodash/type'
import { flatten, isArray } from 'lodash'
import Number from './Number'

const Input = ({ classes, children, label, debounce, value: _value, format, enabler, disabled, ...props } = {}) => {
  const { step, min, max } = props // for NUMBER
  const { options } = props // for SELECT

  const isMonitor = useMemo(() => isArray(_value), [_value])
  const isSelect = useMemo(() => isArray(options) && options.length > 0, [options])

  const [value, setValue] = useStateFromObservable(_value, format, { debounce })
  const [enablerValue, setEnabler] = useStateFromObservable(enabler)

  const _disabled = disabled || !(enablerValue ?? true)

  let valueType = isMonitor ? 'monitor' : isSelect ? 'select' : step === undefined ? type(value) : type(step)
  // for "undefined" as a type, means observable is not behaviour
  //      so, input must be a button (that calls next)

  const fullRow = valueType === 'undefined'

  const [mainLabel, secondaryLabel] = flatten([label])

  return (
    <div className={clsx({ [classes.wrapper]: true, [classes.fullRow]: fullRow })}>
      <div className={clsx(classes.label, { monitor: isMonitor })} style={{ display: fullRow ? 'none' : '' }}>
        <i>{mainLabel}</i>
      </div>
      <div className={clsx(classes.input, { [classes.disableableInput]: !!enabler })}>
        {valueType === 'string' ? (
          <TextField
            disabled={_disabled}
            variant="outlined"
            fullWidth
            size="small"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          ></TextField>
        ) : valueType === 'undefined' ? (
          <Button disabled={_disabled} variant="outlined" color="primary" onClick={(event) => _value.next(event)}>
            {secondaryLabel ? (
              <div className={classes.compositeButton}>
                <div>{mainLabel.toUpperCase()}</div>
                <div className={classes.compositeButton_body}>{secondaryLabel}</div>
              </div>
            ) : (
              mainLabel
            )}
          </Button>
        ) : valueType === 'integer' || valueType === 'float' ? (
          <Number
            disabled={_disabled}
            variant="outlined"
            color="primary"
            size="small"
            fullWidth
            //
            type={valueType}
            step={step}
            min={min}
            max={max}
            //
            value={value}
            onChange={(value) => setValue(value)}
          ></Number>
        ) : valueType === 'boolean' ? (
          <FormControlLabel
            disabled={_disabled}
            control={<Checkbox checked={value} onChange={(event) => setValue(event.target.checked)} color="primary" />}
            label={value ? secondaryLabel || 'Active' : ''}
          />
        ) : valueType === 'select' ? (
          <FormControl variant="outlined" className={classes.denseFormControl}>
            {/* <InputLabel id="demo-simple-select-outlined-label">Age</InputLabel> */}
            <Select
              // labelId="demo-simple-select-outlined-label"
              // id="demo-simple-select-outlined"
              value={value}
              onChange={(event) => setValue(event.target.value)}
            >
              {options.map((option, index) => (
                <MenuItem key={index} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : valueType === 'monitor' ? (
          <div className={classes.monitor}>
            <div className={classes.monitorData}>{value}</div>
          </div>
        ) : (
          <b className={classes.label}>Variable type ({valueType}) not implemented</b>
        )}
        {!!enabler && (
          <Tooltip title={enablerValue && !disabled ? 'Unlocked' : !enablerValue ? 'Locked' : 'Locked Globally'}>
            <Checkbox
              icon={<LockOutline />}
              checkedIcon={<LockOff />}
              checked={enablerValue && !disabled}
              onChange={(event) => setEnabler(event.target.checked)}
              color="primary"
            />
          </Tooltip>
        )}
      </div>
      {children}
    </div>
  )
}

export default Input
