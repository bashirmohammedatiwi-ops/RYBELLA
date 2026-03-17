import './FloatingContact.css'

export default function FloatingContact({ whatsappNumber }) {
  if (!whatsappNumber) return null
  const num = String(whatsappNumber).replace(/\D/g, '')
  const link = `https://wa.me/${num}`

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="floating-contact"
      aria-label="تواصل عبر واتساب"
    >
      <span className="floating-contact-icon">💬</span>
    </a>
  )
}
