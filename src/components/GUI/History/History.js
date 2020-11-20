import React, { useEffect, useMemo, useState } from 'react'

import clsx from 'clsx'

import ChevronLeft from 'mdi-material-ui/ChevronLeft'
import ChevronDoubleLeft from 'mdi-material-ui/ChevronDoubleLeft'
import ChevronRight from 'mdi-material-ui/ChevronRight'
import ChevronDoubleRight from 'mdi-material-ui/ChevronDoubleRight'
import LockOutline from 'mdi-material-ui/LockOutline'

import { Button, SvgIcon, FormControlLabel, TextField, Tooltip } from '@material-ui/core'

import useStateFromObservable from '../../../lib/stateFromObservable'
import { type } from '../../../lib/lodash/type'
import { flatten, get, isArray } from 'lodash'

const History = ({ classes, children, label, debounce, value: _value, format, disabled, onApply, ...props } = {}) => {
  const [value, setValue] = useStateFromObservable(_value)

  const _disabled = disabled

  const [mainLabel, secondaryLabel] = flatten([label])

  const [index, setIndex] = useState(get(value, 'length', 0) - 1)
  const size = useMemo(() => value.length, [value])
  const current = value[index]

  const noPrevious = useMemo(() => index <= 0, [index])
  const noNext = useMemo(() => index >= get(value, 'length', 0) - 1, [index, value])

  useEffect(() => {
    if (index === -1) setIndex(get(value, 'length', 0) - 1)
  }, [value])

  return (
    <div className={classes.wrapper}>
      <div className={classes.grid}>
        <Tooltip title="Previous">
          <Button
            className={clsx(classes.prev, classes.button)}
            disabled={_disabled || noPrevious}
            variant="outlined"
            color="primary"
            onClick={(event) => setIndex(index - 1)}
          >
            <SvgIcon>
              <ChevronLeft></ChevronLeft>
            </SvgIcon>
          </Button>
        </Tooltip>
        <Tooltip title="First">
          <Button
            className={clsx(classes.prev2, classes.button)}
            disabled={_disabled || noPrevious}
            variant="outlined"
            color="primary"
            onClick={(event) => setIndex(0)}
          >
            <SvgIcon>
              <ChevronDoubleLeft></ChevronDoubleLeft>
            </SvgIcon>
          </Button>
        </Tooltip>
        <div className={classes.monitor}>
          {index === -1 ? (
            <div className={classes.monitorData}>
              <center>—</center>
            </div>
          ) : (
            <Tooltip title="Apply Entry">
              <Button
                className={classes.monitorButton}
                fullWidth
                disabled={_disabled}
                variant="outlined"
                color="primary"
                onClick={(event) => onApply && onApply(current)}
              >
                {index + 1} of {size}
              </Button>
            </Tooltip>
          )}

          <div className={classes.monitorData} style={{ color: 'darkgray' }}>
            {!current ? <i style={{ color: 'gray' }}>No entry</i> : (format ?? JSON.stringify)(current)}
          </div>
        </div>
        <Tooltip title="Next">
          <Button
            className={clsx(classes.next, classes.button)}
            disabled={_disabled || noNext}
            variant="outlined"
            color="primary"
            onClick={(event) => setIndex(index + 1)}
          >
            <SvgIcon>
              <ChevronRight></ChevronRight>
            </SvgIcon>
          </Button>
        </Tooltip>
        <Tooltip title="Last">
          <Button
            className={clsx(classes.next2, classes.button)}
            disabled={_disabled || noNext}
            variant="outlined"
            color="primary"
            onClick={(event) => setIndex(get(value, 'length', 0) - 1)}
          >
            <SvgIcon>
              <ChevronDoubleRight></ChevronDoubleRight>
            </SvgIcon>
          </Button>
        </Tooltip>
      </div>
      {children}
    </div>
  )
}

export default History
