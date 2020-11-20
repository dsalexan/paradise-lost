/* global process */

import * as Comlink from 'comlink'

const worker = {
  calc() {
    console.log('CALCLING')
    return { calced: true }
  },
}

Comlink.expose(worker)
