import * as cheerio from 'cheerio'
import { parse, addHours, startOfWeek } from 'date-fns'
import type { Department, School, Class, Subclass, Semester, ScheduleEvent } from '@/lib/types/schedule'

export function parseDepartments(html: string): Department[] {
  const $ = cheerio.load(html)
  const departments: Department[] = []

  // TODO: Update selector based on actual HTML structure
  $('select#department option').each((_, element) => {
    const $el = $(element)
    const id = $el.attr('value')
    const name = $el.text().trim()

    if (id && name) {
      departments.push({ id, name })
    }
  })

  return departments
}

export function parseSchools(html: string, departmentId: string): School[] {
  const $ = cheerio.load(html)
  const schools: School[] = []

  // TODO: Update selector based on actual HTML structure
  $('select#school option').each((_, element) => {
    const $el = $(element)
    const id = $el.attr('value')
    const name = $el.text().trim()

    if (id && name) {
      schools.push({ id, name, departmentId })
    }
  })

  return schools
}

export function parseClasses(html: string, semesterId: string): Class[] {
  const $ = cheerio.load(html)
  const classes: Class[] = []

  // TODO: Update selector based on actual HTML structure
  $('select#class option').each((_, element) => {
    const $el = $(element)
    const id = $el.attr('value')
    const name = $el.text().trim()

    if (id && name) {
      classes.push({ id, name, semesterId })
    }
  })

  return classes
}

export function parseSubclasses(html: string, classId: string): Subclass[] {
  const $ = cheerio.load(html)
  const subclasses: Subclass[] = []

  // TODO: Update selector based on actual HTML structure
  $('select#subclass option').each((_, element) => {
    const $el = $(element)
    const id = $el.attr('value')
    const name = $el.text().trim()

    if (id && name) {
      subclasses.push({ id, name, classId })
    }
  })

  return subclasses
}

export function parseSemesters(html: string, schoolId: string): Semester[] {
  const $ = cheerio.load(html)
  const semesters: Semester[] = []

  // TODO: Update selector based on actual HTML structure
  $('select#semester option').each((_, element) => {
    const $el = $(element)
    const id = $el.attr('value')
    const name = $el.text().trim()

    if (id && name) {
      semesters.push({ id, name, schoolId })
    }
  })

  return semesters
}

export function parseSchedule(html: string, semesterId: string): ScheduleEvent[] {
  const $ = cheerio.load(html)
  const events: ScheduleEvent[] = []

  // TODO: Update selector based on actual HTML structure
  $('.schedule-item').each((_, element) => {
    const $el = $(element)
    
    const title = $el.find('.course-title').text().trim()
    const location = $el.find('.location').text().trim()
    const professor = $el.find('.professor').text().trim()
    const type = $el.find('.type').text().trim()
    
    const dayStr = $el.find('.day').text().trim()
    const startTimeStr = $el.find('.start-time').text().trim()
    const endTimeStr = $el.find('.end-time').text().trim()
    
    try {
      const baseDate = startOfWeek(new Date())
      const dayOffset = getDayOffset(dayStr)
      
      const startTime = parse(startTimeStr, 'HH:mm', baseDate)
      const endTime = parse(endTimeStr, 'HH:mm', baseDate)
      
      const start = addHours(startTime, dayOffset * 24)
      const end = addHours(endTime, dayOffset * 24)
      
      events.push({
        id: `${semesterId}-${dayStr}-${startTimeStr}`,
        title,
        start,
        end,
        location,
        professor,
        type,
      })
    } catch (err) {
      console.error('Error parsing date/time:', err)
    }
  })

  return events
}

function getDayOffset(day: string): number {
  const days = {
    'Monday': 0,
    'Tuesday': 1,
    'Wednesday': 2,
    'Thursday': 3,
    'Friday': 4,
    'Saturday': 5,
    'Sunday': 6,
  }
  return days[day as keyof typeof days] || 0
} 