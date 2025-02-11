import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import axios from 'axios'
import { ScheduleEvent } from '@/lib/types/schedule'
import { parse } from 'date-fns'
import { fr } from 'date-fns/locale'

const SEDNA_URL = 'https://sedna.univ-fcomte.fr/jsp/custom/ufc/mplanif.jsp'

const MONTHS_FR = {
  'Fév': 'février',
  'Mar': 'mars',
  'Avr': 'avril',
  'Mai': 'mai',
  'Jui': 'juin',
  'Jul': 'juillet',
  'Aoû': 'août',
  'Sep': 'septembre',
  'Oct': 'octobre',
  'Nov': 'novembre',
  'Déc': 'décembre',
  'Jan': 'janvier'
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const subclassId = searchParams.get('subclassId')
  const jours = searchParams.get('jours') || '7'

  console.log('Fetching schedule for subclassId:', subclassId, 'jours:', jours)

  if (!subclassId) {
    return NextResponse.json(
      { message: 'Subclass ID is required' },
      { status: 400 }
    )
  }

  try {
    console.log('Making request to:', `${SEDNA_URL}?id=${subclassId}&jours=${jours}`)
    const response = await axios.get(`${SEDNA_URL}?id=${subclassId}&jours=${jours}`, {
      responseType: 'arraybuffer',
      responseEncoding: 'binary'
    })
    
    console.log('Response received, status:', response.status)
    
    // Handle Windows-1252 encoding
    const decoder = new TextDecoder('windows-1252')
    const html = decoder.decode(response.data)
    const $ = cheerio.load(html)
    
    console.log('HTML Content:')
    console.log('----------------------------------------')
    console.log($.html())
    console.log('----------------------------------------')

    const events: ScheduleEvent[] = []
    
    // Process each schedule entry
    $('body > font').contents().each((_, node) => {
      if (node.type !== 'text') return
      
      const text = $(node).text().trim()
      if (!text) return
      
      // Skip navigation links and headers
      if (text.includes('Auj') || text.includes('Demain') || text.includes('Sem') || 
          text.includes('Affichage planning') || text === 'Retour' || 
          text.includes('Note :') || text === ': Semaine' ||
          text.startsWith('(')) { // Skip location lines
        return
      }
      
      console.log('Processing schedule line:', text)
      
      // Match schedule line pattern
      const match = text.match(/^([A-Za-z]{2})\s+(\d+)\s+([A-Za-zéû]+)\s+(\d{1,2})h(\d{0,2})-(\d{1,2})h(\d{0,2})/)
      
      if (match) {
        console.log('Found matching schedule line:', text)
        const [, dayAbbrev, date, monthAbbrev, startHour, startMin = '0', endHour, endMin = '0'] = match
        
        // Get the title from the next link
        const nextLink = $(node).next('a')
        const title = nextLink.length ? nextLink.text().trim() : ''
        
        // Get the location from the text after the link
        const locationNode = nextLink.length ? nextLink[0].next : null
        const locationText = locationNode ? $(locationNode).text().trim() : ''
        const location = locationText.match(/\((.*?)\)/)?.[1] || 'IUT NFC'
        
        try {
          // Convert abbreviated month to full month name
          const month = MONTHS_FR[monthAbbrev as keyof typeof MONTHS_FR]
          if (!month) {
            console.error(`Unknown month abbreviation: ${monthAbbrev}`)
            return
          }
          
          // Parse the date
          const currentYear = new Date().getFullYear()
          const dateStr = `${date} ${month} ${currentYear}`
          console.log('Parsing date:', dateStr)
          const eventDate = parse(dateStr, 'd MMMM yyyy', new Date(), { locale: fr })
          
          if (isNaN(eventDate.getTime())) {
            console.error(`Invalid date: ${dateStr}`)
            return
          }
          
          // Create start and end dates
          const start = new Date(eventDate)
          const end = new Date(eventDate)

          // Parse start time
          start.setHours(parseInt(startHour))
          start.setMinutes(startMin ? parseInt(startMin) : 0)
          start.setSeconds(0)
          start.setMilliseconds(0)

          // Parse end time
          end.setHours(parseInt(endHour))
          end.setMinutes(endMin ? parseInt(endMin) : 0)
          end.setSeconds(0)
          end.setMilliseconds(0)

          // Validate dates
          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            console.error(`Invalid time: ${startHour}:${startMin}-${endHour}:${endMin}`)
            return
          }
          
          const event = {
            id: `${subclassId}-${date}-${startHour}${startMin || '00'}-${endHour}${endMin || '00'}`,
            title,
            start: start.toISOString(),
            end: end.toISOString(),
            location,
            allDay: false
          }
          console.log('Created event:', event)
          events.push(event)
        } catch (err) {
          console.error('Error parsing event:', err)
        }
      } else {
        console.log('Line did not match schedule pattern:', text)
      }
    })

    console.log('Total events parsed:', events.length)

    if (events.length === 0) {
      console.error('No events found in the response')
      return NextResponse.json(
        { message: 'No events found in the schedule' },
        { status: 404 }
      )
    }

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching schedule:', error)
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data)
      console.error('Response status:', error.response?.status)
      console.error('Response headers:', error.response?.headers)
    }
    return NextResponse.json(
      { message: 'Failed to fetch schedule', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 