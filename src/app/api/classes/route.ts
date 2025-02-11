import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import axios from 'axios'
import { Class } from '@/lib/types/schedule'

const SEDNA_URL = 'https://sedna.univ-fcomte.fr/jsp/custom/ufc/mselect.jsp'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const semesterId = searchParams.get('semesterId')

  if (!semesterId) {
    return NextResponse.json(
      { message: 'Semester ID is required' },
      { status: 400 }
    )
  }

  try {
    const response = await axios.get(`${SEDNA_URL}?id=${semesterId}`)
    const $ = cheerio.load(response.data)
    const classes: Class[] = []

    // Parse all mselect links for class groups (S2A, S2B, etc.)
    $('a[href^="mselect.jsp?id="]').each((_, element) => {
      const $el = $(element)
      const href = $el.attr('href')
      const text = $el.text().trim()

      // Skip the "Retour" link
      if (text === 'Retour') return

      // Include class group links (S2A, S2B, etc.)
      if (text.match(/^S\d+[A-D]$/)) {
        const id = href?.split('=')[1]
        if (id) {
          classes.push({
            id,
            name: text.slice(-1), // Just get the letter (A, B, C, D)
            semesterId
          })
        }
      }
    })

    if (classes.length === 0) {
      throw new Error('No classes found')
    }

    return NextResponse.json(classes)
  } catch (error) {
    console.error('Error fetching classes:', error)
    return NextResponse.json(
      { message: 'Failed to fetch classes' },
      { status: 500 }
    )
  }
} 