import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import ButtonLink from "../components/ButtonLink";
import PageHeader from "../components/PageHeader";
import useAnimals from "../hooks/useAnimals";

function AnimalList() {
  const { animals, loading, error } = useAnimals();

  if (loading) {
    return <Loading text="Loading animals..." className="status-text" />;
  }

  if (error) {
    return <ErrorMessage message={error} className="error-text" />;
  }

  return (
    <div className="page-card">
      <PageHeader
        title="Animals"
        subtitle="Active animal records"
        action={<ButtonLink to="/animals/new">Create Animal</ButtonLink>}
      />

      {animals.length === 0 ? (
        <p className="empty-text">No animals found.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ear Tag</th>
              <th>Name</th>
              <th>Breed</th>
              <th>Sex</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {animals.map((animal) => (
              <tr key={animal.id}>
                <td>{animal.id}</td>
                <td>{animal.ear_tag}</td>
                <td>{animal.name || "-"}</td>
                <td>{animal.breed || "-"}</td>
                <td>{animal.sex || "-"}</td>
                <td>
                  <ButtonLink to={`/animals/${animal.id}`} variant="secondary">
                    View
                  </ButtonLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AnimalList;
