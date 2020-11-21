/* global W, ENGINE */
import { get, last } from 'lodash'
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useStore } from '../../components/Store'

import { merge, interval } from 'rxjs'
import { debounce } from 'rxjs/operators'

import toPairsDeepObservable from '../../lib/lodash/toPairsDeepObservable'
import uniqueName from '../../lib/unique'

import Three from '../../core/three/Three'
import World from '../../core/world/World'
import Projector from '../../core/projector/Projector'

function animate() {
  requestAnimationFrame(animate)
  ENGINE.stats.begin()
  // shaderMaterial.uniforms.time.value = clock.getElapsedTime()
  ENGINE.renderer.render(ENGINE.scene, ENGINE.camera)
  ENGINE.stats.end()
}

export default () => {
  const { control, seeds, projection, three, world, tectonics } = useStore()

  // CREATE WORLD AND STORE IN WINDOW
  useEffect(() => {
    const projector = new Projector(projection)
    window.P = projector

    const _W = new World(world.N, world.radius, {
      jitter: world.sphere.jitter,
      seed: seeds.sphere,
      visibility: world.visible,
      projector,
    })
    window.W = _W
  }, [])

  // SUBSCRIBE TO EVENTS ON COMPONENT MOUNT
  useEffect(() => {
    // CONTROL
    control.clear.subscribe((event) => {
      const ok = window.confirm('NASA, Are you sure?')

      if (!ok) return

      window.localStorage.clear()
      window.location.reload()
    })

    control.save.subscribe((event) => {
      const data = {
        timestamp: new Date(),
        name: control.name.value,
        world: W.save(), // TODO: World save
        seeds: toPairsDeepObservable(seeds)
          .filter(([k, subject]) => !['history', 'locked'].includes(k) && k.substr(0, 6) !== 'locked')
          .map(([k, subject]) => [k, subject.value]),
      }

      control.state.next(data)
    })

    control.load.subscribe((data) => {
      if (!data) data = control.state.value

      control.name.next(data.name)

      get(data, 'seeds', []).map(([path, value]) => {
        get(seeds, path, { next: () => {} }).next(value)
      })

      W.load(data.world) // TODO: world load
    })

    control.newTab.subscribe(() => window.open('http://localhost:3000', '_blank'))

    // SEEDS
    seeds.regenerate.subscribe((path) => {
      if (seeds.locked.all.value) return

      const specificRegenerate = path && !get(path, 'detail') && !get(path, 'currentTarget')
      if (specificRegenerate && !get(seeds.locked, path, {}).value) return

      // SAVE HISTORY
      const history = toPairsDeepObservable(seeds)
        .filter(([k, subject]) => !['history', 'locked', 'regenerate'].includes(k) && k.substr(0, 6) !== 'locked')
        .map(([k, subject]) => [k, subject.value])

      seeds.history.next([
        ...seeds.history.value,
        {
          timestamp: new Date(),
          path: !get(path, 'detail') && !get(path, 'currentTarget') ? path : undefined,
          seeds: history,
        },
      ])

      // RANDOMIZING SEEDS
      if (specificRegenerate) {
        return get(seeds, path, { next: () => {} }).next(uniqueName())
      }

      // ACTUALLY tracks state of UNLOCKED
      if (seeds.locked.sphere.value) seeds.sphere.next(uniqueName())
      if (seeds.locked.tectonics.sites.value) seeds.tectonics.sites.next(uniqueName())
      if (seeds.locked.tectonics.plates.value) seeds.tectonics.plates.next(uniqueName())
    })

    // PROJECTION
    projection.center.subscribe((event) => {
      alert('center')
      // TODO: make camera center
    })

    // WORLD
    world.generate.subscribe((event) => {
      // TODO: implement world generation
      if (!W.enabled) return

      seeds.regenerate.next('sphere')
      W.build()
    })

    // tectonics
    tectonics.generate.subscribe((event) => {
      // TODO: implement tectonics plate generation
      // if (!WORLD.tectonics.enabled) return

      seeds.regenerate.next('tectonics.plates')
      // WORLD.tectonics.generate()
    })

    tectonics.sites.clear.subscribe((event) => {
      // TODO: implement tectonics sites clear
      // if (!WORLD.tectonics.enabled) return
      // WORLD.tectonics.clear()
    })

    tectonics.sites.randomize.subscribe((event) => {
      // TODO: implement tectonics sites randomizator
      // if (!WORLD.tectonics.enabled) return

      seeds.regenerate.next('tectonics.sites')
      // WORLD.tectonics.randomizeSites(
      //   {
      //     primary: tectonics.sites.primary.value,
      //     // secondary: tectonics.sites.secondary.value,
      //   },
      //   { seed: seeds.tectonics.sites.value }
      // )
    })
  }, [])

  // SUBSCRIBE TO KNOBS CHANGES
  useEffect(() => {
    // generate WORLD on N/jitter change
    merge(world.N, world.sphere.jitter)
      .pipe(debounce(() => interval(50)))
      .subscribe(() => {
        world.generate.next()
      })

    // randomize TECTONICS sites if is default on WORLD tesselation ready
    // merge(WORLD.voronoi.diagram)
    //   .pipe(debounce(() => interval(50)))
    //   .subscribe(() => {
    //     if (!WORLD.regions.length || !Store.tectonics.preferRandom.value) return

    //     tectonics.sites.randomize.next()
    //   })
  }, [])

  // INITIALIZE ENGINE
  useEffect(() => {
    const engine = new Three(three)
    window.ENGINE = engine
    ENGINE.init()
    animate()

    W.render(engine)
  }, [])

  return <div></div>
}
