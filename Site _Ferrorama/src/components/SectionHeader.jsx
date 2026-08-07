export default function SectionHeader({ number, title, desc }) {
  return (
    <div className="section-header">
      <span className="section-number">{number}</span>
      <h2>{title}</h2>
      <p className="section-desc">{desc}</p>
    </div>
  );
}
