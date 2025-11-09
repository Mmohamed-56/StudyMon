const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { battleType } = JSON.parse(event.body)

    // Get random music from pool
    const { data: musicPool, error } = await supabase
      .from('battle_music')
      .select('*')
      .eq('battle_type', battleType)
      .order('play_count', { ascending: true }) // Prefer less-played tracks
      .limit(5)

    if (error) {
      console.error('Error fetching music:', error)
    }

    // Pick random from top 5 least-played
    let selectedMusic = null
    if (musicPool && musicPool.length > 0) {
      selectedMusic = musicPool[Math.floor(Math.random() * musicPool.length)]
      
      // Increment play count
      await supabase
        .from('battle_music')
        .update({ play_count: selectedMusic.play_count + 1 })
        .eq('id', selectedMusic.id)
    }

    if (selectedMusic) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ musicUrl: selectedMusic.music_url })
      }
    }

    // No music in pool - would need to generate (TODO)
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ musicUrl: null })
    }

  } catch (error) {
    console.error('Error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to get battle music',
        details: error.message 
      })
    }
  }
}

