import React, { useMemo } from 'react'
import { Slider, TextField, withStyles } from '@material-ui/core'

// disabled={disabled}
// variant="outlined"
// color="primary"
// size="small"
// fullWidth
// onChange={(event, value) => setValue(value)}
const Number = ({
  classes,
  type,
  step,
  min,
  max,
  value,
  onChange,
  disabled,
  variant,
  color,
  size,
  fullWidth,
  ...props
}) => {
  const _type = useMemo(() => type || 'integer', [type])
  const _step = useMemo(() => {
    if (step !== undefined) return step

    if (_type === 'integer') return 1
    else return 0.01
  }, [step, _type])

  const handleChange = (value) => {
    onChange && onChange(_type === 'integer' ? parseInt(value) : parseFloat(value))
  }

  return (
    <div className={classes.grid}>
      <TextField
        disabled={disabled}
        variant={variant}
        fullWidth={fullWidth}
        size={size}
        color={color}
        //
        value={value}
        onChange={(event) => handleChange(event.target.value)}
      ></TextField>
      <Slider
        color={color}
        //
        valueLabelDisplay="auto"
        valueLabelFormat={(x) => <b>{x}</b>}
        step={_step}
        min={min ?? 0}
        max={max ?? Math.max(10, _step, value ?? 0)}
        //
        value={value}
        onChange={(event, value) => handleChange(value)}
      />
    </div>
  )
}

export default withStyles((theme) => ({
  grid: {
    display: 'grid',
    gridTemplateColumns: '50px auto',
    gridTemplateRows: 'auto',
    columnGap: theme.spacing(2),
    alignItems: 'center',
  },
}))(Number)
