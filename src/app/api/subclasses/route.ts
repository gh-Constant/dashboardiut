import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import axios from 'axios'
import { Subclass } from '@/lib/types/schedule'

const SEDNA_URL = 'https://sedna.univ-fcomte.fr/jsp/custom/ufc/mselect.jsp'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const classId = searchParams.get('classId')

  if (!classId) {
    return NextResponse.json(
      { message: 'Class ID is required' },
      { status: 400 }
    )
  }

  try {
    const response = await axios.get(`${SEDNA_URL}?id=${classId}`)
    const $ = cheerio.load(response.data)
    const subclasses: Subclass[] = []

    // Parse all links that lead directly to planning (mplanif.jsp) and mselect links
    $('a[href^="mplanif.jsp?id="], a[href^="mselect.jsp?id="]').each((_, element) => {
      const $el = $(element)
      const href = $el.attr('href')
      const text = $el.text().trim()

      // Skip the "Retour" link
      if (text === 'Retour') return

      // Include both direct planning links and group links
      const id = href?.split('=')[1]
      if (id) {
        // If it's a planning link, it's a direct subclass
        const isDirectPlanning = href.startsWith('mplanif.jsp')
        
        // Only include if it's a planning link or matches group pattern (e.g., S2A, S2B)
        if (isDirectPlanning || text.match(/^S\d+[A-Z]$/)) {
          subclasses.push({
            id,
            name: text,
            classId
          })
        }
      }
    })

    if (subclasses.length === 0) {
      throw new Error('No subclasses found')
    }

    return NextResponse.json(subclasses)
  } catch (error) {
    console.error('Error fetching subclasses:', error)
    return NextResponse.json(
      { message: 'Failed to fetch subclasses' },
      { status: 500 }
    )
  }
} 