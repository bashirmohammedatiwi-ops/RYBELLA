import './Marquee.css'

const TEXT = 'RYBELLA العراق • الجمال الذي تستحقينه • RYBella Make Up • '

export default function Marquee({ text }) {
  const content = text || TEXT
  const doubled = content + content

  return (
    <div className="rybella-marquee" aria-hidden="true">
      <div className="rybella-marquee-inner">
        <span>{doubled}</span>
      </div>
    </div>
  )
}
