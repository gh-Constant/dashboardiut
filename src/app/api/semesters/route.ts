import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import axios from 'axios'
import { Semester } from '@/lib/types/schedule'

const SEDNA_URL = 'https://sedna.univ-fcomte.fr/jsp/custom/ufc/mselect.jsp'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const schoolId = searchParams.get('schoolId')

  if (!schoolId) {
    return NextResponse.json(
      { message: 'School ID is required' },
      { status: 400 }
    )
  }

  try {
    const response = await axios.get(`${SEDNA_URL}?id=${schoolId}`)
    const $ = cheerio.load(response.data)
    const semesters: Semester[] = []

    // Parse all mselect links for semesters (S1, S2)
    $('a[href^="mselect.jsp?id="]').each((_, element) => {
      const $el = $(element)
      const href = $el.attr('href')
      const text = $el.text().trim()

      // Skip the "Retour" link
      if (text === 'Retour') return

      // Include semester links (S1, S2)
      if (text.match(/^S[12]$/)) {
        const id = href?.split('=')[1]
        if (id) {
          semesters.push({
            id,
            name: text,
            schoolId
          })
        }
      }
    })

    if (semesters.length === 0) {
      throw new Error('No semesters found')
    }

    return NextResponse.json(semesters)
  } catch (error) {
    console.error('Error fetching semesters:', error)
    return NextResponse.json(
      { message: 'Failed to fetch semesters' },
      { status: 500 }
    )
  }
} 