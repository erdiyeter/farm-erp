import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import ButtonLink from "../components/ButtonLink";
import PageHeader from "../components/PageHeader";
import useAnimals from "../hooks/useAnimals";
import { tAnimal as t, tAnimalValue as tv } from "../i18n";

function AnimalList() {
  const { animals, loading, error } = useAnimals();

  if (loading) {
    return <Loading text={t("Loading animals...")} className="status-text" />;
  }

  if (error) {
    return <ErrorMessage message={error} className="error-text" />;
  }

  return (
    <div className="page-card">
      <PageHeader
        title={t("Animals")}
        subtitle={t("Active animal records")}
        action={<ButtonLink to="/animals/new">{t("Create Animal")}</ButtonLink>}
      />

      {animals.length === 0 ? (
        <p className="empty-text">{t("No animals found.")}</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("ID")}</th>
              <th>{t("Ear Tag")}</th>
              <th>{t("Name")}</th>
              <th>{t("Breed")}</th>
              <th>{t("Sex")}</th>
              <th>{t("Actions")}</th>
            </tr>
          </thead>

          <tbody>
            {animals.map((animal) => (
              <tr key={animal.id}>
                <td>{animal.id}</td>
                <td>{animal.ear_tag}</td>
                <td>{animal.name || "-"}</td>
                <td>{animal.breed || "-"}</td>
                <td>{tv(animal.sex) || "-"}</td>
                <td>
                  <ButtonLink to={`/animals/${animal.id}`} variant="secondary">
                    {t("View")}
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
