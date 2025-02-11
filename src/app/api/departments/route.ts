import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import axios from 'axios'
import { Department } from '@/lib/types/schedule'

const SEDNA_URL = 'https://sedna.univ-fcomte.fr/jsp/custom/ufc/mselect.jsp'

export async function GET() {
  try {
    const response = await axios.get(SEDNA_URL)
    const $ = cheerio.load(response.data)
    
    const departments: Department[] = []
    
    // Parse the links that represent departments
    $('a[href^="mselect.jsp?id="]').each((_, element) => {
      const $el = $(element)
      const href = $el.attr('href')
      const id = href?.split('=')[1] // Extract ID from href="mselect.jsp?id=XXXX"
      const name = $el.text().trim()
      
      if (id && name) {
        departments.push({ id, name })
      }
    })

    if (departments.length === 0) {
      throw new Error('No departments found')
    }

    return NextResponse.json(departments)
  } catch (error) {
    console.error('Error fetching departments:', error)
    return NextResponse.json(
      { message: 'Failed to fetch departments' },
      { status: 500 }
    )
  }
} 