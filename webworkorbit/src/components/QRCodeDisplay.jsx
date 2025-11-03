import { useEffect, useRef } from 'react'
import { X, Download, Share2 } from 'lucide-react'
import QRCode from 'qrcode'

const QRCodeDisplay = ({ job, onClose }) => {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (job?.publicUrl && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, job.publicUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
    }
  }, [job?.publicUrl])

  const downloadQR = async () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const link = document.createElement('a')
      link.download = `${job.title.replace(/\s+/g, '_')}_QR.png`
      link.href = canvas.toDataURL()
      link.click()
    }
  }

  const shareQR = async () => {
    if (navigator.share && job?.publicUrl) {
      try {
        await navigator.share({
          title: job.title,
          text: `Check out this job opportunity: ${job.title} at ${job.company}`,
          url: job.publicUrl
        })
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(job.publicUrl)
        alert('Job link copied to clipboard!')
      }
    } else if (job?.publicUrl) {
      navigator.clipboard.writeText(job.publicUrl)
      alert('Job link copied to clipboard!')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">QR Code</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="text-center">
          <div className="bg-white p-4 rounded-lg border border-gray-200 inline-block mb-4">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto"
            />
          </div>

          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-1">{job.title}</h4>
            <p className="text-sm text-gray-600">{job.company}</p>
            <p className="text-xs text-gray-500 mt-2">
              Scan this QR code to view the job and apply
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={downloadQR}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </button>
            <button
              onClick={shareQR}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QRCodeDisplay