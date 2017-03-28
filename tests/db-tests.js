'use strict'

import test from 'ava'
import {
  createTable,
  updateDatabase,
  getDateReport,
  getFullReport,
  removeDatabase,
  calculateWorkHours,
  dbTestFile
} from '../lib/db.js'

// natives
const fs = require('fs')
const moment = require('moment')

const knexForTestsInMemory = require('knex')({
  dialect: 'sqlite3',
  connection: {
    filename: ''
  },
  useNullAsDefault: true
})

const knexForTestsInFile = require('knex')({
  dialect: 'sqlite3',
  connection: {
    filename: dbTestFile
  },
  useNullAsDefault: true
})

test.serial('db file is created properly', async t => {
  await createTable(knexForTestsInFile)
  const fileGotCreated = fs.existsSync(dbTestFile)
  t.true(fileGotCreated)
})

test.serial('removeDatabase removes db file', async t => {
  try {
    await removeDatabase()
  } catch (e) {
    console.log(e)
  }
  const fileGotRemoved = !fs.existsSync(dbTestFile)
  t.true(fileGotRemoved)
})

test('createTable makes tables alright', async t => {
  await createTable(knexForTestsInMemory)
  const hasRecordsTable = await knexForTestsInMemory.schema.hasTable('records')
  const hasNotesTable = await knexForTestsInMemory.schema.hasTable('notes')
  const hasBothTables = hasRecordsTable && hasNotesTable

  t.true(hasBothTables)
})
test('updateDatabase inserts and reads correctly', async t => {
  const options = {
    breakDuration: 25,
    date: '2017-03-11',
    end: '17:35',
    id: 1,
    notes: [],
    start: '09:15'
  }
  await updateDatabase(options, knexForTestsInMemory)
  const recordInDb = await getDateReport(options.date, knexForTestsInMemory)
  t.deepEqual(recordInDb, options)
})

test('calculateWorkHours works', async t => {
  const options = {
    breakDuration: 25,
    date: '2017-03-11',
    end: '17:35',
    id: 1,
    notes: [],
    start: '09:15'
  }
  const okResult = {
    date: '2017-03-11',
    workHours: moment.duration(moment('2017-03-11 17:10').diff(moment('2017-03-11 09:15'))),
    notes: []
  }
  await updateDatabase(options, knexForTestsInMemory)
  const calculatedWorkHours = await calculateWorkHours(options.date, knexForTestsInMemory)
  t.deepEqual(calculatedWorkHours, okResult)
})

test.serial('getFullReport outputs ok results', async t => {
  const options = {
    breakDuration: 25,
    date: '2017-03-11',
    end: '17:35',
    id: 1,
    notes: [],
    start: '09:15'
  }

  const okResults = [ { date: '2017-03-11',
    workHours: moment.duration(moment('2017-03-11 17:10').diff(moment('2017-03-11 09:15'))),
    notes: [] } ]

  await updateDatabase(options, knexForTestsInMemory)
  const results = await getFullReport(knexForTestsInMemory)
  t.deepEqual(results, okResults)
})
