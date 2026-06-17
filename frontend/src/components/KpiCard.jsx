function KpiCard({ title, value }) {
  return (
    <div className="dashboard-kpi-card">
      <h2>{title}</h2>
      <p>{value}</p>
    </div>
  );
}

export default KpiCard;
