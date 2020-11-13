import React, { useState, useCallback, Fragment, useMemo } from 'react'

import { Button, Slider, TextField, withStyles } from '@material-ui/core'

import { Subject } from 'rxjs'

import useStoredState from '../../lib/storedState'
import useStateFromObservable from '../../lib/stateFromObservable'

import StorableSubject from '../../lib/rxjs/StorableSubject'

import uniqueName from '../../lib/unique'

import Context from './Context'

import { debounce, get } from 'lodash'
import numeral from 'numeral'
import GUI from '../GUI'
import moment from 'moment'

import Cog from 'mdi-material-ui/Cog'
import Earth from 'mdi-material-ui/Earth'

numeral.register('locale', 'pt-br', {
  delimiters: {
    thousands: ' ',
    decimal: '.',
  },
})
numeral.locale('pt-br')

const Provider = ({ classes, children } = {}) => {
  const store = useMemo(() => {
    return {
      control: {
        name: new StorableSubject(uniqueName({ separator: ' ' }), 'store/control/name'),
        save: new Subject(),
        load: new Subject(),
        state: new StorableSubject(null, 'state'),
      },
      seeds: {
        history: new StorableSubject([], 'store/seeds/history'),
        locked: {
          all: new StorableSubject(true, 'store/seeds/locked/all'),
          sphere: new StorableSubject(true, 'store/seeds/locked/sphere'),
          tectonics: {
            sites: new StorableSubject(true, 'store/seeds/locked/tectonics/sites'),
            plates: new StorableSubject(true, 'store/seeds/locked/tectonics/plates'),
          },
        },
        sphere: new StorableSubject('DEUS VULT INFIDEL', 'store/seeds/sphere'),
        tectonics: {
          sites: new StorableSubject('DEUS VULT INFIDEL', 'store/seeds/tectonics/sites'),
          plates: new StorableSubject('DEUS VULT INFIDEL', 'store/seeds/tectonics/plates'),
        },
      },
      world: {
        generate: new Subject(),
        points: new StorableSubject(100, 'store/world/points'),
      },
    }
  }, [])

  const [state] = useStateFromObservable(store.control.state)

  const LoadLabel = useMemo(() => {
    if (!state) return ['Load']
    return [
      'Load',
      <span key={1}>
        {get(state, 'name', '—')} &nbsp;<i style={{ color: 'gray' }}>at</i>&nbsp;{' '}
        {moment(get(state, 'timestamp', new Date())).calendar()}
      </span>,
    ]
  }, [state])

  return (
    <>
      <GUI.Root>
        <GUI.Pane name="Control" id="control" icon={<Cog />}>
          <GUI.Folder name="Data" id="control-data">
            <GUI.Input label="World Name" value={store.control.name}></GUI.Input>
            <GUI.Input label="Save" value={store.control.save}></GUI.Input>
            <GUI.Input label={LoadLabel} value={store.control.load} disabled={!state}></GUI.Input>
          </GUI.Folder>
          <GUI.Folder name="Inspector" id="control-inspector"></GUI.Folder>
        </GUI.Pane>
        <GUI.Pane name="World" id="world" icon={<Earth />}>
          <GUI.Folder name="Stucture" id="world-structure">
            <GUI.Input label="Generate" value={store.world.generate}></GUI.Input>
            <GUI.Input label="Points" value={store.world.points}></GUI.Input>
          </GUI.Folder>
        </GUI.Pane>
      </GUI.Root>

      <Context.Provider value={store}>{children}</Context.Provider>
    </>
  )
}

export default Provider
