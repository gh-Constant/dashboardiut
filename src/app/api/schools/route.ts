import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import axios from 'axios'
import { School } from '@/lib/types/schedule'

const SEDNA_URL = 'https://sedna.univ-fcomte.fr/jsp/custom/ufc/mselect.jsp'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const departmentId = searchParams.get('departmentId')

  if (!departmentId) {
    return NextResponse.json(
      { message: 'Department ID is required' },
      { status: 400 }
    )
  }

  try {
    // Make a GET request with the department ID
    const response = await axios.get(`${SEDNA_URL}?id=${departmentId}`)
    const $ = cheerio.load(response.data)
    const schools: School[] = []

    // Parse all links that have an ID and optionally an "Etape" link
    $('a[href^="mselect.jsp?id="], a[href^="mplanif.jsp?id="]').each((_, element) => {
      const $el = $(element)
      const href = $el.attr('href')
      const text = $el.text().trim()

      // Skip the "Retour" link
      if (text === 'Retour') return

      // If it's a "mselect" link, it's a main entry
      if (href?.startsWith('mselect.jsp?id=')) {
        const id = href.split('=')[1]
        schools.push({
          id,
          name: text,
          departmentId
        })
      }
      // If it's a "mplanif" link, it's an "Etape" link - we can ignore these
    })

    if (schools.length === 0) {
      throw new Error('No schools found')
    }

    return NextResponse.json(schools)
  } catch (error) {
    console.error('Error fetching schools:', error)
    return NextResponse.json(
      { message: 'Failed to fetch schools' },
      { status: 500 }
    )
  }
} 