import React, { useState, useCallback, Fragment, useMemo, useEffect } from 'react'

import { Button, Slider, TextField, withStyles } from '@material-ui/core'

import { Subject, BehaviorSubject, merge } from 'rxjs'

import useStoredState from '../../lib/storedState'
import useStateFromObservable from '../../lib/stateFromObservable'

import StorableSubject from '../../lib/rxjs/StorableSubject'

import uniqueName from '../../lib/unique'

import Context from './Context'

import { debounce, get } from 'lodash'
import numeral from '../../lib/numeral'
import GUI from '../GUI'
import moment from 'moment'

import Cog from 'mdi-material-ui/Cog'
import Web from 'mdi-material-ui/Web'
import Earth from 'mdi-material-ui/Earth'

import useSurfaceArea from '../../domain/earth/surfaceArea'
import findClosest from '../../lib/lodash/findClosest'

const Provider = ({ classes, children } = {}) => {
  const data = {
    countries: {
      surfaceArea: new BehaviorSubject(null), // useSurfaceArea(), // TODO: findout how to not freeze page when fetching csv
    },
  }

  const store = useMemo(() => {
    return {
      control: {
        name: new StorableSubject(uniqueName({ separator: ' ' }), 'store/control/name'),
        save: new Subject(),
        load: new Subject(),
        state: new StorableSubject(null, 'state'),
        clear: new Subject(),
        newTab: new Subject(),
        performance: new StorableSubject(true, 'store/control/performance'),
      },
      seeds: {
        regenerate: new Subject(),
        //
        history: new StorableSubject([], 'store/seeds/history'),
        //
        locked: {
          all: new StorableSubject(true, 'store/seeds/locked/all'),
          // ACTUALLY tracks state of UNLOCKED
          sphere: new StorableSubject(true, 'store/seeds/locked/sphere'),
          tectonics: {
            sites: new StorableSubject(true, 'store/seeds/locked/tectonics/sites'),
            plates: new StorableSubject(true, 'store/seeds/locked/tectonics/plates'),
          },
        },
        //
        sphere: new StorableSubject('DEUS VULT INFIDEL', 'store/seeds/sphere'),
        tectonics: {
          sites: new StorableSubject('DEUS VULT INFIDEL', 'store/seeds/tectonics/sites'),
          plates: new StorableSubject('DEUS VULT INFIDEL', 'store/seeds/tectonics/plates'),
        },
      },
      projection: {
        type: new StorableSubject('orthographic', 'store/projection/type'),
        scale: new StorableSubject(10, 'store/projection/scale'),
        zoom: new StorableSubject(1, 'store/projection/zoom'),
        gizmoSize: new StorableSubject(1, 'store/projection/gizmoSize'),
        center: new Subject(),
      },
      three: {
        removeOnHide: new StorableSubject(false, 'store/three/removeOnHide'),
        fog: {
          color: new StorableSubject(0x222222, 'store/three/fog/color'),
          near: new StorableSubject(70, 'store/three/fog/near'),
          far: new StorableSubject(135, 'store/three/fog/far'),
        },
        background: new StorableSubject(0x222222, 'store/three/background'),
        camera: {
          // thirdFar: // TODO: thirdFar é um terço da distanca far da camera, normalmente vai ser igual ao radius do planet
        },
      },
      world: {
        generate: new Subject(),
        //
        N: new StorableSubject(100, 'store/world/n'),
        radius: new StorableSubject(637.1, 'store/world/radius'),
        //
        sphere: {
          jitter: new StorableSubject(0.0, 'store/world/sphere/jitter'),
        },
        tesselation: {
          center: new StorableSubject('Centroids', 'store/world/tesselation/center'),
        },
        visible: {
          grid: new StorableSubject(true, 'store/world/visible/grid'),
          cloud: new StorableSubject(true, 'store/world/visible/cloud'),
          triangles: new StorableSubject(true, 'store/world/visible/triangles'),
          centers: new StorableSubject(true, 'store/world/visible/centers'),
          regions: new StorableSubject(true, 'store/world/visible/regions'),
        },
      },
      tectonics: {
        generate: new Subject(),
        //
        sites: {
          clear: new Subject(),
          randomize: new Subject(),
          preferRandom: new StorableSubject(false, 'store/tectonics/sites/preferRandom'),
          primary: new StorableSubject(7, 'store/tectonics/sites/primary'),
          secondary: new StorableSubject(10, 'store/tectonics/sites/secondary'),
        },
        alpha: new StorableSubject(0.5, 'store/tectonics/alpha'),
        //
        // tertiary: new StorableSubject(10, 'store/tectonics/tertiary'),
        // visible
        visible: {
          label: new StorableSubject(true, 'store/tectonics/visible/label'),
          cloud: new StorableSubject(true, 'store/tectonics/visible/cloud'),
          contour: new StorableSubject(true, 'store/tectonics/visible/contour'),
        },
      },
    }
  }, [])

  const [state] = useStateFromObservable(store.control.state)
  const [allSeedsLocked] = useStateFromObservable(store.seeds.locked.all)

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
        <GUI.Pane name="Control" id="right-control" icon={<Cog></Cog>}>
          <GUI.Folder name="Data" id="control-data">
            <GUI.Input label="World Name" value={store.control.name}></GUI.Input>
            <GUI.Input label="Save" value={store.control.save}></GUI.Input>
            <GUI.Input label={LoadLabel} value={store.control.load} disabled={!state}></GUI.Input>
            <GUI.Input label="Clear Storage" value={store.control.clear}></GUI.Input>
            <GUI.Input label="New Tab" value={store.control.newTab}></GUI.Input>
            <GUI.Input label="Show Performance" value={store.control.performance}></GUI.Input>
          </GUI.Folder>
        </GUI.Pane>
        <GUI.Pane name="Tectonics" id="tectonics" icon={<Earth />}>
          <GUI.Folder name="Overview" id="tectonics-overview">
            {/* <GUI.Input label="Tectonic Plates" value={store.control.name}></GUI.Input> */}
            <GUI.Input label="Generate" value={store.tectonics.generate}></GUI.Input>

            <GUI.Input
              label="Seed"
              value={store.seeds.tectonics.plates}
              enabler={store.seeds.locked.tectonics.plates}
              disabled={allSeedsLocked}
            ></GUI.Input>
          </GUI.Folder>
          <GUI.Folder name="Sites" id="tectonics-sites">
            <GUI.Input label="Clear" value={store.tectonics.sites.clear}></GUI.Input>
            <GUI.Input label="Randomize Sites" value={store.tectonics.sites.randomize}></GUI.Input>

            <GUI.Input
              label="Seed"
              value={store.seeds.tectonics.sites}
              enabler={store.seeds.locked.tectonics.sites}
              disabled={allSeedsLocked}
            ></GUI.Input>
            <GUI.Input
              label={[
                'Randomize by default?',
                'On world build this module will sample the sites randomically (following the quantities bellow)',
              ]}
              value={store.tectonics.sites.preferRandom}
            ></GUI.Input>

            <GUI.Input
              label="Primary Sites (7)"
              value={store.tectonics.sites.primary}
              min={0}
              max={15}
              step={1}
            ></GUI.Input>
            <GUI.Input
              label="Secondary Sites (10)"
              value={store.tectonics.sites.secondary}
              min={0}
              max={50}
              step={1}
            ></GUI.Input>
          </GUI.Folder>
          <GUI.Folder name="Visibility" id="tectonics-visibility">
            <GUI.Input label="Label" value={store.tectonics.visible.label}></GUI.Input>
            <GUI.Input label="Cloud" value={store.tectonics.visible.cloud}></GUI.Input>
            <GUI.Input label="Contour" value={store.tectonics.visible.contour}></GUI.Input>
            <GUI.Input label="Alpha (Contour)" value={store.tectonics.alpha} min={0} max={1} step={0.01}></GUI.Input>
          </GUI.Folder>
        </GUI.Pane>
      </GUI.Root>
      <GUI.Root placement="right">
        <GUI.Pane placement="right" name="Control" id="control" icon={<Cog />}>
          <GUI.Folder name="Seeds" id="control-seeds">
            <GUI.Input
              label={['Lock All Seeds?', 'No seed will be regenerated by default or on page reload.']}
              value={store.seeds.locked.all}
            ></GUI.Input>
            <GUI.Input
              label="Regenerate All Seeds"
              value={store.seeds.regenerate}
              disabled={allSeedsLocked}
            ></GUI.Input>
            <GUI.History
              value={store.seeds.history}
              format={({ timestamp, path, seeds } = {}) => {
                return (
                  <>
                    {timestamp && (
                      <>
                        <div>{moment(timestamp).calendar()}</div>
                        <br />
                      </>
                    )}
                    {path && (
                      <>
                        <div>
                          <i style={{ color: 'gray' }}>called with </i>
                          {path}
                        </div>
                        <br />
                      </>
                    )}
                    {seeds && (
                      <div
                        style={{
                          display: 'grid',
                          columnGap: 8,
                          gridTemplateColumns: 'auto auto',
                          gridTemplateRows: 'repeat(auto)',
                        }}
                      >
                        {seeds.map(([key, value]) => (
                          <React.Fragment key={key}>
                            <div style={{ textAlign: 'right', color: 'gray' }}>{key}</div>
                            <div>{value}</div>
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </>
                )
              }}
              onApply={({ timestamp, path, seeds } = {}) => {
                seeds.map(([key, value]) => {
                  if (store.seeds.locked.all) return
                  if (!get(store.seeds.locked, key, {}).value) return
                  get(store.seeds, key, { next: () => {} }).next(value)
                })
              }}
            ></GUI.History>
          </GUI.Folder>
          <GUI.Folder name="Projection" id="control-projection">
            <GUI.Input
              label="Zoom"
              value={[store.projection.zoom]}
              format={(zoom) => `${numeral(zoom.value).format(`0.00%`)}`}
            ></GUI.Input>
            <GUI.Input
              label="Projection"
              value={store.projection.type}
              options={['Orthographic', 'Equirectangular']}
            ></GUI.Input>
            <GUI.Input label="Gizmo Size" value={store.projection.gizmoSize} min={0.1} max={50} step={0.1}></GUI.Input>
            <GUI.Input label="Center" value={store.projection.center}></GUI.Input>
          </GUI.Folder>
          <GUI.Folder name="Three" id="control-three">
            <GUI.Input label="Remove Mesh on Hide" value={store.three.removeOnHide}></GUI.Input>
            <GUI.Input label="Fog (Color)" value={store.three.fog.color}></GUI.Input>
            <GUI.Input label="Fog (Near)" value={store.three.fog.near} min={10} max={3000} step={1}></GUI.Input>
            <GUI.Input label="Fog (Far)" value={store.three.fog.far} min={10} max={3000} step={1}></GUI.Input>
            <GUI.Input label="Background" value={store.three.background}></GUI.Input>
          </GUI.Folder>
        </GUI.Pane>
        <GUI.Pane placement="right" name="World" id="world" icon={<Web />}>
          <GUI.Folder name="Monitor" id="world-monitor">
            <GUI.Input
              label="Scale"
              value={[store.projection.scale]}
              format={([scale]) => `1:${numeral(scale.value).format()} km`}
            ></GUI.Input>
            <GUI.Input
              label="Planet Radius"
              value={[store.projection.scale, store.world.radius]}
              format={([scale, radius]) => `${numeral(scale.value * radius.value).format()} km`}
            ></GUI.Input>
            <GUI.Input
              label="Planet Surface Area"
              value={[store.projection.scale, store.world.radius]}
              format={([scale, radius]) => `${numeral(4 * Math.PI * (scale.value * radius.value) ** 2).format()} km²`}
            ></GUI.Input>
            <GUI.Input
              label="Average Region Area"
              value={[store.projection.scale, store.world.radius, store.world.N, data.countries.surfaceArea]}
              debounce={50}
              format={([scale, radius, N, surfaceAreas]) => {
                const avgSurfaceArea = (4 * Math.PI * (scale.value * radius.value) ** 2) / N.value

                const [country, area] = surfaceAreas.value
                  ? findClosest(surfaceAreas.value, avgSurfaceArea, ([n, a]) => a)
                  : [null, avgSurfaceArea]

                // https://www.google.com/search?q=SLOVAK%20REPUBLIC
                // encodeURI
                const avgArea = `${numeral(avgSurfaceArea).format()} km²`

                if (!country) return avgArea
                return (
                  <span>
                    {avgArea}
                    {` (${numeral(avgSurfaceArea / area).format('0.00%')} of `}
                    <a rel="noreferrer" target="_blank" href={`https://www.google.com/search?q=${encodeURI(country)}`}>
                      {country}
                    </a>
                    {`)`}
                  </span>
                )
              }}
            ></GUI.Input>
          </GUI.Folder>

          <GUI.Folder name="Sphere" id="world-sphere">
            <GUI.Input label="Generate" value={store.world.generate}></GUI.Input>
            <GUI.Input
              label="Seed"
              value={store.seeds.sphere}
              enabler={store.seeds.locked.sphere}
              disabled={allSeedsLocked}
            ></GUI.Input>
            <GUI.Input label="N" value={store.world.N} min={4} max={500000}></GUI.Input>
            <GUI.Input label="Jitter" value={store.world.sphere.jitter} max={1} step={0.01}></GUI.Input>
            <GUI.Input label="Radius" value={store.world.radius} min={1} max={1000.0} step={0.01}></GUI.Input>
            <GUI.Input
              label="Center Method"
              value={store.world.tesselation.center}
              options={['Centroids', 'Circumcenters']}
            ></GUI.Input>
          </GUI.Folder>
          <GUI.Folder name="Visibility" id="world-visibility">
            <GUI.Input label="Grid" value={store.world.visible.grid}></GUI.Input>
            <GUI.Input label="Cloud" value={store.world.visible.cloud}></GUI.Input>
            <GUI.Input label="Triangulation" value={store.world.visible.triangles}></GUI.Input>
            <GUI.Input label="Tesselation (Regions)" value={store.world.visible.regions}></GUI.Input>
            <GUI.Input label="Tesselation (Centers)" value={store.world.visible.centers}></GUI.Input>
          </GUI.Folder>
        </GUI.Pane>
      </GUI.Root>

      <Context.Provider value={store}>{children}</Context.Provider>
    </>
  )
}

export default Provider
