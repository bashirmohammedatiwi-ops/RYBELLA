import './Manifesto.css'

const ITEMS = [
  'مستحضرات تجميل أصلية من أفضل العلامات',
  'جودة عالية بأسعار تنافسية',
  'الجمال للجميع وليس حكراً على أحد',
  'نهتم بعملائنا ونستمع لهم',
  'نرسل رسالة حرية وجمال بمرح وإيجابية',
  'مختلفون عن المألوف',
]

export default function Manifesto() {
  return (
    <section className="rybella-manifesto">
      <h2 className="rybella-manifesto-title">بياننا</h2>
      <div className="rybella-manifesto-list">
        {ITEMS.map((item, i) => (
          <p key={i} className="rybella-manifesto-item">\\ {item}</p>
        ))}
      </div>
      <p className="rybella-manifesto-tagline">"مختلفون لأننا أحرار"</p>
    </section>
  )
}
