import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ShareHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    async function handleShare() {
      try {
        // Browser posts share data to this route
        const formData = new FormData(document.forms[0])

        const sharedUrl = formData.get('url')
        const sharedText = formData.get('text')
        const sharedTitle = formData.get('title')
        const sharedFile = formData.get('files')

        const payload = {
          url: sharedUrl || sharedText || '',
          title: sharedTitle || '',
          status: 'UNORGANISED'
        }

        // 🔁 SAME API you already use on desktop
        await fetch('/api/resources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

      } catch (err) {
        console.error('Share handling failed', err)
      } finally {
        navigate('/student/resources') // or inbox/dashboard
      }
    }

    handleShare()
  }, [])

  return null
}
